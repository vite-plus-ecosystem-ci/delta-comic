import enUS from './en-US'
import type { LocaleShape } from './schema'
import zhCN from './zh-CN'

export const localeMessages = { 'en-US': enUS, 'zh-CN': zhCN }

export type AppLocale = keyof typeof localeMessages
export type AppMessageSchema = LocaleShape<typeof zhCN>