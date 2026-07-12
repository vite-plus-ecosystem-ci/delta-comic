import { describe, expect, it } from 'vite-plus/test'

import type { BuiltInPluginDefinition } from '../plugin'

import { BUILT_IN_PLUGIN_LOADER, builtInDefinitionToArchive, isBuiltInPlugin } from './builtIn'

const definition: BuiltInPluginDefinition = {
  meta: {
    author: 'Delta Comic',
    description: 'core',
    kind: 'preboot',
    name: { display: '核心', id: 'core' },
    require: [],
    version: { plugin: '1.0.0', supportCore: '*' },
  },
  config: () => ({ name: 'core' }),
}

describe('built-in plugin archive', () => {
  it('uses the dedicated loader and default enable state', () => {
    const archive = builtInDefinitionToArchive(definition)
    expect(archive).toMatchObject({
      enable: true,
      loaderName: BUILT_IN_PLUGIN_LOADER,
      pluginName: 'core',
    })
    expect(isBuiltInPlugin(archive)).toBe(true)
  })

  it('preserves an explicitly disabled state', () => {
    expect(builtInDefinitionToArchive(definition, false).enable).toBe(false)
  })
})