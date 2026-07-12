import type { PluginArchiveDB } from '@delta-comic/db'

import { builtInPluginRegistry } from '../../../features/registry'
import type { PluginConfigFactory } from '../../../plugin'
import { BUILT_IN_PLUGIN_LOADER } from '../../builtIn'
import { PluginLoader } from '../utils'

export default new (class extends PluginLoader {
  public override name = BUILT_IN_PLUGIN_LOADER

  public override async load(
    pluginMeta: PluginArchiveDB.Archive,
  ): Promise<PluginConfigFactory | undefined> {
    return builtInPluginRegistry.get(pluginMeta.pluginName)?.config
  }

  public override async install(): Promise<PluginArchiveDB.Meta> {
    throw new Error('built-in plugins are shipped with the application')
  }

  public override canInstall(): boolean {
    return false
  }

  public override async decodeMeta(): Promise<PluginArchiveDB.Meta> {
    throw new Error('built-in plugins do not have an external manifest')
  }

  public override async decodeMetaFile(): Promise<PluginArchiveDB.Meta> {
    throw new Error('built-in plugins do not have an external manifest')
  }

  public override isMetaFile(): boolean {
    return false
  }
})()