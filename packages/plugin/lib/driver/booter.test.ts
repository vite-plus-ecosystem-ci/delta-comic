import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { ref } from 'vue'

const mocks = vi.hoisted(() => ({ booters: [] as any[], plugins: new Map<string, unknown>() }))

vi.mock('./extensions', () => ({ runtimeExtensions: { booters: { values: mocks.booters } } }))
vi.mock('./store', () => ({ usePluginStore: () => ({ plugins: mocks.plugins }) }))

import { bootPlugin } from './booter'

beforeEach(() => {
  mocks.booters.splice(0)
  mocks.plugins.clear()
})

describe('plugin booter pipeline', () => {
  it('runs booters in order and applies string/object progress reports', async () => {
    const first = {
      call: vi.fn(async (_config, report, environment) => {
        environment.token = 'shared'
        report('preparing')
      }),
      name: 'first',
    }
    const second = {
      call: vi.fn(async (_config, report, environment) => {
        expect(environment.token).toBe('shared')
        report({ description: 'ready', name: 'renamed' })
      }),
      name: 'second',
    }
    mocks.booters.push(first, second)
    const config = { name: 'fixture' }
    const progress = ref({
      fixture: {
        progress: { status: 'wait' as const, stepsIndex: 0 },
        steps: [{ description: 'waiting', name: 'waiting' }],
      },
    })

    await bootPlugin(config, progress)

    expect([...mocks.plugins.keys()]).toEqual(['fixture'])
    expect(first.call).toHaveBeenCalledBefore(second.call)
    expect(progress.value.fixture.steps).toEqual([
      { description: 'waiting', name: 'waiting' },
      { description: 'preparing', name: 'first' },
      { description: 'ready', name: 'renamed' },
    ])
    expect(progress.value.fixture.progress).toEqual({ status: 'done', stepsIndex: 2 })
  })

  it('leaves the failing step visible and does not run later booters', async () => {
    const failure = new Error('booter failed')
    mocks.booters.push(
      { call: vi.fn(async () => Promise.reject(failure)), name: 'broken' },
      { call: vi.fn(), name: 'not-reached' },
    )
    const progress = ref({
      fixture: {
        progress: { status: 'wait' as const, stepsIndex: 0 },
        steps: [{ description: 'waiting', name: 'waiting' }],
      },
    })

    await expect(bootPlugin({ name: 'fixture' }, progress)).rejects.toBe(failure)

    expect(mocks.booters[1].call).not.toHaveBeenCalled()
    expect(progress.value.fixture.progress).toEqual({ status: 'process', stepsIndex: 1 })
  })
})