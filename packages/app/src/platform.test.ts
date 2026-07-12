import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import { initializePlatform, isTauriRuntime, setStatusBar } from './platform'

describe('web platform fallback', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('detects a normal browser without Tauri internals', () => {
    vi.stubGlobal('window', { $api: {} })
    expect(isTauriRuntime()).toBe(false)
  })

  it('installs a no-op native UI facade in the browser', async () => {
    const browserWindow = { $api: {} as Record<string, unknown> }
    vi.stubGlobal('window', browserWindow)

    await expect(initializePlatform()).resolves.toBe(false)
    const nativeUi = browserWindow.$api.M3 as {
      getInsets(): Promise<false>
      setBarColor(): Promise<void>
    }
    await expect(nativeUi.getInsets()).resolves.toBe(false)
    await expect(nativeUi.setBarColor()).resolves.toBeUndefined()
    await expect(setStatusBar('dark')).resolves.toBeUndefined()
  })
})