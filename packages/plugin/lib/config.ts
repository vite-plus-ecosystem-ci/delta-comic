import { useNativeStore } from '@delta-comic/db'
import type { FormResult, FormSingleConfigure } from '@delta-comic/model'
import { fromPairs } from 'es-toolkit/compat'
import { defineStore } from 'pinia'
import { computed, shallowReactive, type Ref } from 'vue'

export type ConfigDescription = Record<
  string,
  Required<Pick<FormSingleConfigure, 'defaultValue'>> & FormSingleConfigure
>
export class ConfigPointer<T extends ConfigDescription = ConfigDescription> {
  constructor(
    public pluginName: string,
    public config: T,
    public configName: string,
  ) {
    this.key = Symbol.for(`config:${pluginName}`)
  }
  public readonly key: symbol
}

export const appConfig = new ConfigPointer(
  'core',
  {
    recordHistory: { type: 'switch', defaultValue: true, info: '记录历史记录' },
    showAIProject: { type: 'switch', defaultValue: true, info: '展示AI作品' },
    darkMode: {
      type: 'radio',
      defaultValue: 'system',
      info: '暗色模式配置',
      comp: 'select',
      selects: [
        { label: '浅色', value: 'light' },
        { label: '暗色', value: 'dark' },
        { label: '跟随系统', value: 'system' },
      ],
    },
    easilyTitle: { type: 'switch', defaultValue: false, info: '简化标题(实验性功能)' },
    githubToken: {
      type: 'string',
      defaultValue: '',
      info: 'github的token',
      placeholder: '仅用于解除api访问限制',
    },
    receivePerReleaseUpdate: {
      type: 'switch',
      defaultValue: false,
      info: '接受预发布版本更新(可能不稳定)',
    },
  },
  '核心',
)

export type ConfigSave<T> = { form: ConfigDescription; value: Ref<T>; name: string }

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

  const isSystemDark = matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = computed(() => {
    if (!$isExistConfig(appConfig)) return isSystemDark
    const cfg = $load(appConfig).value.value
    switch (cfg.darkMode) {
      case 'light':
        return false
      case 'dark':
        return true
      case 'system':
        return isSystemDark
      default:
        return false
    }
  })
  const $isExistConfig = helper.action(
    (pointer: ConfigPointer) => configDescription.has(pointer.key),
    'isExistConfig',
  )
  const $resignerConfig = helper.action((pointer: ConfigPointer) => {
    const cfg = useConfig()
    const store = useNativeStore(
      pointer.pluginName,
      'config',
      fromPairs(Object.entries(pointer.config).map(([name, desc]) => [name, desc.defaultValue])),
    )
    cfg.form.set(pointer.key, { form: pointer.config, value: store, name: pointer.pluginName })
  }, 'resignerConfig')
  return { isDark, form: configDescription, $load, $isExistConfig, $resignerConfig }
})