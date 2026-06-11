import type { PluginArchiveDB } from '@delta-comic/db'

import { readLocalFile } from '../native'
import { PluginInstaller, type PluginInstallerDescription } from '../utils'

export class _PluginInstallByLocal extends PluginInstaller {
  public override description: PluginInstallerDescription = {
    title: '安装本地插件',
    description: '输入以: "local:"开头，后接全路径的文本',
  }
  public override name = 'local'
  private async installer(input: string): Promise<File> {
    const path = decodeURIComponent(input.replace(/^local:/, ''))
    return await readLocalFile(path)
  }
  public override async download(input: string): Promise<File> {
    const file = await this.installer(input)
    return file
  }
  public override async update(pluginMeta: PluginArchiveDB.Archive): Promise<File> {
    const file = await this.installer(pluginMeta.installInput)
    return file
  }
  public override isMatched(input: string): boolean {
    return input.startsWith('local:')
  }
}

export default new _PluginInstallByLocal()