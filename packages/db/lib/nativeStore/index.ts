import { SourcedValue } from '@delta-comic/model'
import { invoke } from '@tauri-apps/api/core'
import { ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

const saveKey = new SourcedValue<[namespace: string, key: string]>()
const call = <T>(command: string, args: Record<string, unknown>) =>
  invoke<T>(`plugin:db|${command}`, args)

const getNativeStore = (namespace: string, key: string) =>
  call<string | null>('native_store_get', { key, namespace })

const setNativeStore = (namespace: string, key: string, value: string) =>
  call<void>('native_store_set', { key, namespace, value })

const cloneDefault = <T extends object>(defaultValue: MaybeRefOrGetter<T>): T => {
  const value = toValue(defaultValue)
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

const legacyValue = (namespace: string, key: string) => {
  try {
    return globalThis.localStorage?.getItem(saveKey.toString([namespace, key])) ?? null
  } catch {
    return null
  }
}

const parseValue = <T extends object>(
  value: string | null,
  defaultValue: MaybeRefOrGetter<T>,
): T => {
  if (value === null) return cloneDefault(defaultValue)
  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.warn('[db] failed to parse native store value', error)
    return cloneDefault(defaultValue)
  }
}

export const useNativeStore = <T extends object>(
  namespace: string,
  key: MaybeRefOrGetter<string>,
  defaultValue: MaybeRefOrGetter<T>,
) => {
  const state = ref(cloneDefault(defaultValue)) as Ref<T>
  let version = 0
  let hydrated = false
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  const persist = (resolvedKey: string, value: T) => {
    if (saveTimer) clearTimeout(saveTimer)
    const encoded = JSON.stringify(value)
    saveTimer = setTimeout(() => {
      void setNativeStore(namespace, resolvedKey, encoded).catch(error => {
        console.warn('[db] failed to persist native store value', error)
      })
    }, 100)
  }

  const load = async () => {
    const current = ++version
    const resolvedKey = toValue(key)
    hydrated = false
    try {
      const nativeValue = await getNativeStore(namespace, resolvedKey)
      const storedValue = nativeValue ?? legacyValue(namespace, resolvedKey)
      if (current !== version) return
      state.value = parseValue(storedValue, defaultValue)
      hydrated = true
      if (nativeValue === null) persist(resolvedKey, state.value)
    } catch (error) {
      console.warn('[db] failed to load native store value', error)
      if (current !== version) return
      state.value = cloneDefault(defaultValue)
      hydrated = true
    }
  }

  watch(
    () => toValue(key),
    () => void load(),
    { immediate: true },
  )
  watch(
    state,
    value => {
      if (!hydrated) return
      persist(toValue(key), value)
    },
    { deep: true },
  )

  return state
}