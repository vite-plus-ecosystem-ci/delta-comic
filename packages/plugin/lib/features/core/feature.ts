import { defineInnerPlugin } from '../../plugin'

import { coreConfig } from './config'

export { coreConfig } from './config'

export default defineInnerPlugin({
  meta: {
    kind: 'preboot',
    author: 'Delta Comic',
    description: 'Delta Comic 应用核心功能与配置。',
    require: [],
    name: { display: '核心', id: 'core' },
    version: { plugin: '2.3.0', supportCore: '*' },
  },
  enabledByDefault: true,
  config: () => ({ name: 'core', config: [coreConfig] }),
})