import { describe, expect, it } from 'vitest'

import {
  DynamicWorkerPluginRunner,
  type PluginSandboxLoader,
  ServerPluginScriptService,
  type ScriptRow,
  type ScriptRunRow,
  type ServerPluginScriptRepositoryContract,
} from './plugins.script'

class MemoryScriptRepository implements ServerPluginScriptRepositoryContract {
  installed = new Set(['example.plugin'])
  scripts = new Map<string, ScriptRow>()
  runs: ScriptRunRow[] = []

  async find(pluginId: string) {
    return this.scripts.get(pluginId) ?? null
  }

  async listDue(now: number, limit = 50) {
    return [...this.scripts.values()]
      .filter(row => row.enabled === 1 && row.next_run_at <= now)
      .slice(0, limit)
  }

  async listRuns(pluginId: string, limit = 30) {
    return this.runs
      .filter(row => row.plugin_id === pluginId)
      .slice(-limit)
      .reverse()
  }

  async assertInstalled(pluginId: string) {
    if (!this.installed.has(pluginId)) throw new Error('not installed')
  }

  async save(row: ScriptRow) {
    this.scripts.set(row.plugin_id, { ...row })
  }

  async saveRun(row: ScriptRunRow) {
    this.runs.push({ ...row })
  }

  async advance(pluginId: string, nextRunAt: number, updatedAt: number) {
    const row = this.scripts.get(pluginId)
    if (row) this.scripts.set(pluginId, { ...row, next_run_at: nextRunAt, updated_at: updatedAt })
  }
}

class RecordingSandbox implements PluginSandboxLoader {
  code?: WorkerLoaderWorkerCode
  request?: Request
  result: unknown = { accepted: true }
  error?: Error

  async load(code: WorkerLoaderWorkerCode, request: Request) {
    this.code = code
    this.request = request
    if (this.error) throw this.error
    return Response.json({ result: this.result })
  }
}

const createService = () => {
  const repository = new MemoryScriptRepository()
  const sandbox = new RecordingSandbox()
  let now = 1_000
  let id = 0
  return {
    repository,
    sandbox,
    service: new ServerPluginScriptService(
      repository,
      new DynamicWorkerPluginRunner(sandbox),
      () => ++now,
      () => `run-${++id}`,
    ),
  }
}

describe('server plugin scripts', () => {
  it('configures an installed plugin with a bounded hourly schedule', async () => {
    const { repository, service } = createService()

    const script = await service.save('example.plugin', {
      enabled: true,
      intervalHours: 2,
      nextRunAt: 5_000,
      source: 'return { value: input.value + 1 }',
    })

    expect(script).toMatchObject({
      enabled: true,
      intervalHours: 2,
      nextRunAt: 5_000,
      pluginId: 'example.plugin',
    })
    expect(repository.scripts.get('example.plugin')?.source).toContain('input.value')
  })

  it('runs code with an isolated loader and persists JSON-safe output', async () => {
    const { repository, sandbox, service } = createService()
    await service.save('example.plugin', {
      enabled: false,
      intervalHours: 1,
      source: 'return { value: input.value + 1 }',
    })

    const result = await service.run('example.plugin', { value: 3 }, 'manual')
    const requestBody = await sandbox.request?.json()

    expect(result).toMatchObject({ result: { accepted: true }, status: 'succeeded' })
    expect(requestBody).toMatchObject({
      context: { pluginId: 'example.plugin', trigger: 'manual' },
      input: { value: 3 },
    })
    expect(sandbox.code).toMatchObject({
      globalOutbound: null,
      limits: { cpuMs: 50, subRequests: 0 },
      mainModule: 'plugin.mjs',
    })
    expect(repository.runs).toHaveLength(1)
  })

  it('runs due scripts and advances the next scheduled hour even after a plugin failure', async () => {
    const { repository, sandbox, service } = createService()
    await service.save('example.plugin', {
      enabled: true,
      intervalHours: 3,
      nextRunAt: 2_000,
      source: 'throw new Error("failure")',
    })
    sandbox.error = new Error('sandbox failed')

    await service.runDue(2_000, '0 * * * *')

    expect(repository.runs[0]).toMatchObject({
      error_message: 'sandbox failed',
      status: 'failed',
      trigger: 'scheduled',
    })
    expect(repository.scripts.get('example.plugin')?.next_run_at).toBe(10_802_000)
  })
})