import { pluginI18n, type PluginI18nAdapter, type PluginLocaleMessages } from '@delta-comic/plugin'
import { createI18n } from 'vue-i18n'

import { localeMessages, type AppLocale } from './locales'

const systemLocale = (): AppLocale =>
  globalThis.navigator?.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'

export const resolveAppLocale = (locale: string | undefined): AppLocale => {
  if (locale === 'zh-CN' || locale === 'en-US') return locale
  return systemLocale()
}

export const i18n = createI18n({
  fallbackLocale: 'zh-CN',
  legacy: false,
  locale: systemLocale(),
  messages: localeMessages,
})

const i18nAdapter: PluginI18nAdapter = {
  setLocaleMessage(locale, message) {
    const composer = i18n.global as unknown as PluginI18nAdapter
    composer.setLocaleMessage(locale, message)
  },
}

pluginI18n.install(i18nAdapter, localeMessages as unknown as PluginLocaleMessages)