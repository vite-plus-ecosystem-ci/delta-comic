import JSZip from 'jszip'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import {
  decodeDevMetaFromCode,
  digestPluginBytes,
  installDevCode,
  installZipFile,
  listPluginFiles,
  readPluginText,
} from './storage'

const meta = {
  author: 'Delta Comic',
  description: 'web plugin',
  name: { display: 'Web plugin', id: 'web-plugin' },
  require: [],
  version: { plugin: '1.0.0', supportCore: '*' },
}

const code = `// ==UserScript==
// @description ${JSON.stringify(meta)}
// ==/UserScript==
export default () => ({ name: 'web-plugin' })`

const createCode = (pluginId: string, version: string) => {
  const pluginMeta = {
    ...meta,
    name: { display: pluginId, id: pluginId },
    version: { ...meta.version, plugin: version },
  }
  return `// ==UserScript==
// @description ${JSON.stringify(pluginMeta)}
// ==/UserScript==
export default ${JSON.stringify(version)}`
}

type FailureEvent = 'abort' | 'error'

const createControlledIndexedDb = (storedKeys: IDBValidKey[] = []) => {
  let putCount = 0
  let requestCount = 0
  let transaction: (Omit<IDBTransaction, 'error'> & { error: DOMException | null }) | undefined

  const createRequest = <T>(result: T): IDBRequest<T> => {
    const request = { error: null, result } as IDBRequest<T>
    requestCount += 1
    queueMicrotask(() => request.onsuccess?.(new Event('success')))
    return request
  }

  const store = {
    delete: () => createRequest(undefined),
    get: () => createRequest(undefined),
    getAllKeys: () => createRequest(storedKeys),
    openKeyCursor: () => createRequest<IDBCursor | null>(null),
    put: () => {
      putCount += 1
      return createRequest(undefined)
    },
  } as unknown as IDBObjectStore

  const database = {
    close: vi.fn(),
    transaction: () => {
      transaction = {
        abort: () => transaction?.onabort?.(new Event('abort')),
        error: null,
        objectStore: () => store,
      } as unknown as Omit<IDBTransaction, 'error'> & { error: DOMException | null }
      return transaction
    },
  } as unknown as IDBDatabase

  const factory = {
    open: () => {
      const request = { error: null } as IDBOpenDBRequest
      queueMicrotask(() => {
        Object.defineProperty(request, 'result', { value: database })
        request.onsuccess?.(new Event('success'))
      })
      return request
    },
  } as unknown as IDBFactory

  vi.stubGlobal('indexedDB', factory)

  return {
    complete: () => transaction?.oncomplete?.(new Event('complete')),
    fail: (event: FailureEvent) => {
      if (!transaction) throw new Error('transaction has not started')
      transaction.error = new DOMException(`test transaction ${event}`, event)
      transaction[`on${event}`]?.(new Event(event))
    },
    get putCount() {
      return putCount
    },
    get requestCount() {
      return requestCount
    },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('browser plugin storage', () => {
  it('fingerprints plugin bytes through Rust WASM or the Web Crypto fallback', async () => {
    const bytes = new TextEncoder().encode('delta-comic-plugin')
    const first = await digestPluginBytes(bytes)
    const second = await digestPluginBytes(bytes)

    expect(['blake3', 'sha256']).toContain(first.algorithm)
    expect(first.digest).toMatch(/^[a-f\d]{64}$/)
    expect(second).toEqual(first)
  })

  it('decodes userscript metadata without native IPC', () => {
    expect(decodeDevMetaFromCode(code)).toEqual(meta)
  })

  it('stores development plugins in the browser fallback', async () => {
    await installDevCode(code)

    expect(await readPluginText('web-plugin', 'us.js')).toBe(code)
  })

  it('rejects plugin ids that could escape their storage namespace', async () => {
    const invalid = code.replace('"web-plugin"', '"../outside"')
    expect(() => decodeDevMetaFromCode(invalid)).not.toThrow()
    await expect(installDevCode(invalid)).rejects.toThrow('invalid plugin id')
  })

  it('does not expose a zip update when staging an entry fails', async () => {
    const pluginId = 'zip-staging-plugin'
    const previousCode = createCode(pluginId, '1.0.0')
    await installDevCode(previousCode)

    const archive = new JSZip()
    const nextMeta = decodeDevMetaFromCode(createCode(pluginId, '2.0.0'))
    archive.file('manifest.json', JSON.stringify(nextMeta))
    archive.file('index.mjs', 'export default 2')
    const loaded = await JSZip.loadAsync(await archive.generateAsync({ type: 'uint8array' }))
    vi.spyOn(loaded.file('index.mjs')!, 'async').mockRejectedValue(new Error('extract failed'))
    vi.spyOn(JSZip, 'loadAsync').mockResolvedValue(loaded)

    await expect(installZipFile(new File([], 'plugin.zip'))).rejects.toThrow('extract failed')
    expect(await readPluginText(pluginId, 'us.js')).toBe(previousCode)
    expect(await listPluginFiles(pluginId)).toEqual(['us.js'])
  })

  it('waits for the IndexedDB transaction to commit before publishing an update', async () => {
    const pluginId = 'commit-wait-plugin'
    const controlled = createControlledIndexedDb()
    let resolved = false
    const installation = installDevCode(createCode(pluginId, '1.0.0')).then(() => {
      resolved = true
    })

    await vi.waitFor(() => expect(controlled.putCount).toBe(1))
    await Promise.resolve()
    expect(resolved).toBe(false)

    controlled.complete()
    await installation
    expect(resolved).toBe(true)
  })

  it.each<FailureEvent>(['abort', 'error'])(
    'keeps the previous version when an IndexedDB transaction emits %s',
    async failureEvent => {
      const pluginId = `atomic-${failureEvent}-plugin`
      const previousCode = createCode(pluginId, '1.0.0')
      const nextCode = createCode(pluginId, '2.0.0')
      vi.stubGlobal('indexedDB', undefined)
      await installDevCode(previousCode)

      const controlled = createControlledIndexedDb()
      const installation = installDevCode(nextCode)
      const rejection = expect(installation).rejects.toThrow(`test transaction ${failureEvent}`)
      await vi.waitFor(() => expect(controlled.putCount).toBe(1))
      controlled.fail(failureEvent)
      await rejection

      vi.stubGlobal('indexedDB', undefined)
      expect(await readPluginText(pluginId, 'us.js')).toBe(previousCode)
    },
  )

  it('waits for readonly transactions to complete after their request succeeds', async () => {
    const controlled = createControlledIndexedDb(['readonly-plugin/index.mjs'])
    let resolved = false
    const files = listPluginFiles('readonly-plugin').then(result => {
      resolved = true
      return result
    })

    await vi.waitFor(() => expect(controlled.requestCount).toBeGreaterThan(0))
    await Promise.resolve()
    expect(resolved).toBe(false)

    controlled.complete()
    await expect(files).resolves.toEqual(['index.mjs'])
  })
})