import { mockIPC } from '@tauri-apps/api/mocks'
import { describe, expect, it, vi } from 'vite-plus/test'
import { nextTick } from 'vue'

import { useNativeStore } from './index'
import '../test/setup'

type NativeStorePayload = { key: string; namespace: string; value?: string }

const nativeStoreKey = ({ key, namespace }: NativeStorePayload) => `${namespace}:${key}`

const flushNativeStore = async () => {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
}

const mockNativeStore = (initialValues: Array<[string, string]> = []) => {
  const values = new Map(initialValues)
  const calls: Array<{ command: string; payload: NativeStorePayload }> = []

  mockIPC((command, payload) => {
    const nativeStorePayload = payload as NativeStorePayload
    calls.push({ command, payload: nativeStorePayload })

    if (command === 'plugin:db|native_store_get') {
      return values.get(nativeStoreKey(nativeStorePayload)) ?? null
    }
    if (command === 'plugin:db|native_store_set') {
      values.set(nativeStoreKey(nativeStorePayload), nativeStorePayload.value ?? '')
      return null
    }
    if (command === 'plugin:db|native_store_remove') {
      values.delete(nativeStoreKey(nativeStorePayload))
      return null
    }
    throw new Error(`unexpected IPC command: ${command}`)
  })

  return { calls, values }
}

describe('useNativeStore', () => {
  it('hydrates state from native storage and persists deep changes', async () => {
    vi.useFakeTimers()
    const { calls, values } = mockNativeStore([
      ['settings:theme', JSON.stringify({ mode: 'dark' })],
    ])

    const state = useNativeStore('settings', 'theme', { mode: 'light' })

    await flushNativeStore()

    expect(state.value).toEqual({ mode: 'dark' })

    state.value.mode = 'blue'
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)

    expect(JSON.parse(values.get('settings:theme') ?? '{}')).toEqual({ mode: 'blue' })
    expect(calls.map(({ command }) => command)).toEqual([
      'plugin:db|native_store_get',
      'plugin:db|native_store_set',
    ])
  })

  it('uses legacy localStorage when native storage is missing and migrates the value', async () => {
    vi.useFakeTimers()
    globalThis.localStorage.setItem('settings:theme', JSON.stringify({ mode: 'legacy' }))
    const { calls, values } = mockNativeStore()

    const state = useNativeStore('settings', 'theme', { mode: 'light' })

    await flushNativeStore()
    await vi.advanceTimersByTimeAsync(100)

    expect(state.value).toEqual({ mode: 'legacy' })
    expect(JSON.parse(values.get('settings:theme') ?? '{}')).toEqual({ mode: 'legacy' })
    expect(calls.map(({ command }) => command)).toEqual([
      'plugin:db|native_store_get',
      'plugin:db|native_store_set',
    ])
  })

  it('falls back to a cloned default value when stored JSON is invalid', async () => {
    const defaultValue = { mode: 'light' }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockNativeStore([['settings:theme', '{bad json']])

    const state = useNativeStore('settings', 'theme', defaultValue)

    await flushNativeStore()

    expect(state.value).toEqual(defaultValue)
    expect(state.value).not.toBe(defaultValue)
    expect(warn).toHaveBeenCalledWith(
      '[db] failed to parse native store value',
      expect.any(SyntaxError),
    )
  })
})