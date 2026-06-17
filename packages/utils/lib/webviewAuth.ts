import { invoke } from '@tauri-apps/api/core'

const call = <T>(command: string, args: Record<string, unknown> = {}) =>
  invoke<T>(`plugin:utils|${command}`, args)

export interface OpenWebviewPageOptions {
  url: string
  label?: string
  title?: string
  css?: string
  js?: string
  callbackName?: string
  allFrames?: boolean
  visible?: boolean
  width?: number
  height?: number
  userAgent?: string
  incognito?: boolean
  devtools?: boolean
}

export interface OpenedWebviewPage {
  label: string
  url: string
}

export interface InjectWebviewCodeOptions {
  label?: string
  css?: string
  js?: string
  callbackName?: string
}

export interface StorageEntry {
  key: string
  value: string
}

export interface AuthCallbackSnapshot {
  value: unknown
  href: string
  title: string
  cookie: string
  localStorage: StorageEntry[]
  sessionStorage: StorageEntry[]
  collectedAt: number
}

export interface WebStorageSnapshot {
  frameId: string
  reason: string
  top: boolean
  href: string
  origin: string
  title: string
  cookie: string
  localStorage: StorageEntry[]
  sessionStorage: StorageEntry[]
  callback?: AuthCallbackSnapshot | null
  errors: string[]
  collectedAt: number
}

export interface InaccessibleFrame {
  index: number
  src: string
  error: string
}

export interface WebviewCookie {
  name: string
  value: string
  domain?: string | null
  path?: string | null
  secure?: boolean | null
  httpOnly?: boolean | null
  sameSite?: string | null
  expires?: string | null
  source: string
}

export interface WebviewAuthData {
  label: string
  url: string
  cookies: WebviewCookie[]
  storage: WebStorageSnapshot
  frames: WebStorageSnapshot[]
  inaccessibleFrames: InaccessibleFrame[]
}

export const openWebviewPage = (options: OpenWebviewPageOptions) =>
  call<OpenedWebviewPage>('webview_open_page', { options })

export const injectWebviewCode = (options: InjectWebviewCodeOptions) =>
  call<void>('webview_inject_code', { options })

export const closeCurrentWebviewPage = () => call<void>('webview_close_current_page')

export const closeWebviewPage = (label: string) => call<void>('webview_close_page', { label })

export const getCurrentWebviewAuthData = () => call<WebviewAuthData>('webview_auth_data_current')

export const getWebviewAuthData = (label: string) =>
  call<WebviewAuthData>('webview_auth_data', { label })

export const getAllWebviewAuthData = () => call<WebviewAuthData[]>('webview_auth_data_all')

export const getWebviewIframeAuthData = (label: string, waitMs?: number) =>
  call<WebviewAuthData>('webview_iframe_auth_data', { label, waitMs })

export const storageEntriesToRecord = (entries: StorageEntry[]) =>
  Object.fromEntries(entries.map(entry => [entry.key, entry.value])) as Record<string, string>