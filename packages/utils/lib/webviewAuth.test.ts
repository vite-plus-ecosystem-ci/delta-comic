import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import './test/setup'

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }))

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }))

const storage = (entries: Record<string, string>) =>
  Object.entries(entries).map(([key, value]) => ({ key, value }))

const snapshot = (callback: unknown = null) => ({
  callback,
  collectedAt: 1,
  cookie: 'fallback=1',
  errors: [],
  frameId: 'top',
  href: 'https://auth.test/login',
  localStorage: storage({ fallbackLocal: '1' }),
  origin: 'https://auth.test',
  reason: 'snapshot',
  sessionStorage: storage({ fallbackSession: '1' }),
  title: 'Login',
  top: true,
})

describe('webviewAuth', () => {
  beforeEach(() => {
    mocks.invoke.mockReset()
  })

  it('calls the utils plugin command wrapper with camelCase options', async () => {
    const page = { label: 'delta-auth-1', url: 'https://auth.test/login' }
    mocks.invoke.mockResolvedValue(page)

    const { openWebviewPage } = await import('./webviewAuth')
    const result = await openWebviewPage({
      callbackName: 'authCallback',
      css: 'body { color: red; }',
      js: 'callback(true)',
      title: 'Login',
      url: page.url,
    })

    expect(result).toBe(page)
    expect(mocks.invoke).toHaveBeenCalledWith('plugin:utils|webview_open_page', {
      options: {
        callbackName: 'authCallback',
        css: 'body { color: red; }',
        js: 'callback(true)',
        title: 'Login',
        url: page.url,
      },
    })
  })

  it('opens a page, waits for callback data, normalizes storage, and closes the page', async () => {
    Object.defineProperty(window, '__TAURI_INTERNALS__', { configurable: true, value: {} })
    let reads = 0
    mocks.invoke.mockImplementation(async (command: string) => {
      if (command === 'plugin:utils|webview_open_page') {
        return { label: 'delta-auth-1', url: 'https://auth.test/login' }
      }
      if (command === 'plugin:utils|webview_auth_data') {
        reads += 1
        return {
          cookies: [],
          frames: [],
          inaccessibleFrames: [],
          label: 'delta-auth-1',
          storage:
            reads === 1
              ? snapshot()
              : snapshot({
                  collectedAt: 2,
                  cookie: 'sid=1',
                  href: 'https://auth.test/callback',
                  localStorage: storage({ token: 'abc' }),
                  sessionStorage: storage({ nonce: 'xyz' }),
                  title: 'Done',
                  value: { ok: true },
                }),
          url: 'https://auth.test/login',
        }
      }
      if (command === 'plugin:utils|webview_close_page') return undefined
      throw new Error(`unexpected command: ${command}`)
    })

    const { PageWebviewAuth } = await import('./webviewAuth')
    const auth = new PageWebviewAuth<{ ok: boolean }>(
      'https://auth.test/login',
      { css: '', js: 'callback({ ok: true })' },
      { pollInterval: 0, title: 'Login' },
    )
    const onDone = vi.fn()
    auth.onDone(onDone)

    const result = await auth.mount()

    expect(result).toEqual({
      callbackValue: { ok: true },
      cookie: 'sid=1',
      href: 'https://auth.test/callback',
      localStorage: { token: 'abc' },
      sessionStorage: { nonce: 'xyz' },
      title: 'Done',
    })
    expect(onDone).toHaveBeenCalledWith(result)
    expect(mocks.invoke).toHaveBeenCalledWith('plugin:utils|webview_open_page', {
      options: expect.objectContaining({
        allFrames: true,
        callbackName: 'authCallback',
        title: 'Login',
        url: 'https://auth.test/login',
      }),
    })
    expect(mocks.invoke).toHaveBeenCalledWith('plugin:utils|webview_close_page', {
      label: 'delta-auth-1',
    })
  })

  it('uses a popup and postMessage callback in a normal browser', async () => {
    let messageListener: ((event: MessageEvent) => void) | undefined
    const popup = { close: vi.fn(), closed: false }
    const browserWindow = {
      $api: {},
      addEventListener: vi.fn((type: string, listener: (event: MessageEvent) => void) => {
        if (type === 'message') messageListener = listener
      }),
      open: vi.fn(() => popup),
      removeEventListener: vi.fn(),
    }
    Object.defineProperty(globalThis, 'window', { configurable: true, value: browserWindow })

    const { PageWebviewAuth } = await import('./webviewAuth')
    const auth = new PageWebviewAuth<{ ok: boolean }>(
      'https://auth.test/login',
      { css: '', js: '' },
      { pollInterval: 1, title: 'Login' },
    )
    const result = auth.mount()
    await vi.waitFor(() => expect(messageListener).toBeTypeOf('function'))
    messageListener?.({
      data: { type: 'delta-comic:auth-callback', value: { ok: true } },
      source: popup,
    } as unknown as MessageEvent)

    await expect(result).resolves.toMatchObject({
      callbackValue: { ok: true },
      href: 'https://auth.test/login',
      title: 'Login',
    })
    expect(popup.close).toHaveBeenCalledOnce()
  })

  it('injects code into a same-origin iframe and resolves when authCallback is called', async () => {
    class FakeStorage {
      private readonly entries: [string, string][]

      constructor(data: Record<string, string>) {
        this.entries = Object.entries(data)
      }

      public get length() {
        return this.entries.length
      }

      public key(index: number) {
        return this.entries[index]?.[0] ?? null
      }

      public getItem(key: string) {
        return this.entries.find(entry => entry[0] === key)?.[1] ?? null
      }
    }

    const head = { append: vi.fn() }
    const frameDocument = {
      cookie: 'sid=1',
      createElement: vi.fn((_tag?: string) => ({ setAttribute: vi.fn(), textContent: '' })),
      documentElement: { append: vi.fn() },
      head,
      title: 'Iframe Login',
    }
    const frameWindow = {
      callback: undefined as ((result: unknown) => unknown) | undefined,
      localStorage: new FakeStorage({ token: 'abc' }),
      location: { href: 'https://auth.test/iframe' },
      sessionStorage: new FakeStorage({ state: 'ready' }),
    } as unknown as Window & {
      callback?: (result: unknown) => unknown
      eval: (code: string) => unknown
    }
    frameWindow.eval = vi.fn((code: string) => {
      const run = new Function('authCallback', 'callback', 'window', code)
      return run(frameWindow.authCallback, frameWindow.callback, frameWindow)
    })

    let loadListener: (() => void) | undefined
    const iframe = {
      addEventListener: vi.fn((type: string, listener: () => void) => {
        if (type === 'load') loadListener = listener
      }),
      contentDocument: frameDocument,
      contentWindow: frameWindow,
      remove: vi.fn(),
      src: '',
      style: {},
    }
    const parentElement = { append: vi.fn(() => loadListener?.()) }
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        body: parentElement,
        createElement: vi.fn((tag: string) => {
          if (tag === 'iframe') return iframe
          return frameDocument.createElement(tag)
        }),
      },
    })

    const { IframeWebviewAuth } = await import('./webviewAuth')
    const auth = new IframeWebviewAuth<{ ok: boolean }>('https://auth.test/iframe', {
      css: 'body { color: red; }',
      js: 'authCallback({ ok: true })',
    })

    const result = await auth.mount(parentElement as unknown as Element)

    expect(result).toEqual({
      callbackValue: { ok: true },
      cookie: 'sid=1',
      href: 'https://auth.test/iframe',
      localStorage: { token: 'abc' },
      sessionStorage: { state: 'ready' },
      title: 'Iframe Login',
    })
    expect(parentElement.append).toHaveBeenCalledWith(iframe)
    expect(head.append).toHaveBeenCalled()
    expect(iframe.remove).toHaveBeenCalled()
  })
})