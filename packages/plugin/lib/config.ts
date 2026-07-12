import { useConfig as useDbConfig } from '@delta-comic/db'
import type { FormResult } from '@delta-comic/model'
import { defineStore } from 'pinia'
import { computed, shallowReactive, type Ref } from 'vue'

import type { ConfigDescription, ConfigPointer } from './configPointer'
import { coreConfig } from './features/core/feature'

export * from './configPointer'

export type ConfigSave<T> = {
  form: ConfigDescription
  data: Ref<T>
  name: string
  ready: Promise<void>
}

export const useConfig = defineStore('config', helper => {
  const configDescription = shallowReactive(new Map<symbol, ConfigSave<any>>())

  const $load = helper.action(
    <T extends ConfigPointer>(pointer: T): ConfigSave<FormResult<T['config']>> => {
      const v = configDescription.get(pointer.key)
      if (!v) throw new Error(`not found config by plugin "${pointer.pluginName}"`)
      return v
    },
    'load',
  )

  const $loadApp = helper.action(() => $load(coreConfig), 'loadApp')

  const isSystemDark = matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = computed(() => {
    if (!$isExistConfig(coreConfig)) return isSystemDark
    const cfg = $load(coreConfig).data.value
    switch (cfg.darkMode) {
      case 'light':
        return false
      case 'dark':
        return true
      case 'system':
      default:
        return isSystemDark
    }
  })
  const $isExistConfig = helper.action(
    (pointer: ConfigPointer) => configDescription.has(pointer.key),
    'isExistConfig',
  )
  const $registerConfig = helper.action((pointer: ConfigPointer) => {
    const registered = configDescription.get(pointer.key)
    if (registered) return registered

    const store = useDbConfig(pointer.pluginName, pointer.config)
    const saved: ConfigSave<any> = {
      form: pointer.config,
      data: store,
      name: pointer.pluginName,
      ready: (store as typeof store & { ready: Promise<void> }).ready,
    }
    configDescription.set(pointer.key, saved)
    return saved
  }, 'registerConfig')
  /** @deprecated Use `$registerConfig`. */
  const $resignerConfig = $registerConfig
  const $unregisterConfig = helper.action((pointer: ConfigPointer) => {
    configDescription.delete(pointer.key)
  }, 'unregisterConfig')

  // Core settings remain available when the built-in core runtime is disabled.
  $registerConfig(coreConfig)

  return {
    isDark,
    form: configDescription,
    $loadApp,
    $load,
    $isExistConfig,
    $registerConfig,
    $resignerConfig,
    $unregisterConfig,
  }
})