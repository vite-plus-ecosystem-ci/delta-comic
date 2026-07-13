import { ConfigPointer } from '../../configPointer'

export const coreConfig = new ConfigPointer(
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
    cloudEnabled: { type: 'switch', defaultValue: false, info: '启用云服务' },
    cloudServerUrl: {
      type: 'string',
      defaultValue: '',
      info: '云服务地址',
      placeholder: '默认关闭，启用后填写云服务地址',
    },
    installOverride: { type: 'pairs', defaultValue: [], info: '安装源覆盖配置', required: true },
  },
  '核心',
)