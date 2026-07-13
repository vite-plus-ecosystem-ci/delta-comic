import type { LocaleShape } from './schema'
import type zhCN from './zh-CN'

const enUS = {
  plugin: {
    menu: {
      config: 'Settings',
      install: 'Install',
      manage: 'Manage',
      version: 'Version: {version}',
    },
    startup: {
      actions: { safeStart: 'Safe start', start: 'Start' },
      errors: { partialFailure: 'Some plugins failed to load. Check the details.' },
      loading: 'Plugins are already loading',
      prebootLoading: 'Preboot plugins are still loading',
      remember: {
        content: 'Remember this plugin selection and load it automatically next time?',
        negative: 'Not now',
        positive: 'Remember',
        title: 'Remember plugin selection',
      },
    },
  },
} satisfies LocaleShape<typeof zhCN>

export default enUS