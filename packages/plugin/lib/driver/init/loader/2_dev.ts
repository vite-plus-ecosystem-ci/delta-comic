import type { PluginArchiveDB } from '@delta-comic/db'
import { join } from '@tauri-apps/api/path'
import * as fs from '@tauri-apps/plugin-fs'

import type { PluginConfigFactory } from '@/plugin'

import { decodeDevMeta, installDev } from '../native'
import { PluginLoader } from '../utils'
import { getPluginFsPath } from '../utils'

export default new (class extends PluginLoader {
  public override name = 'dev'

  public override async install(file: File): Promise<PluginArchiveDB.Meta> {
    const code = await file.text()
    return await installDev(code)
  }
  public override canInstall(file: File): boolean {
    return file.name.endsWith('.js')
  }

  public override async load(
    pluginMeta: PluginArchiveDB.Archive,
  ): Promise<PluginConfigFactory | undefined> {
    const code = await fs.readTextFile(
      await join(await getPluginFsPath(pluginMeta.pluginName), 'us.js'),
    )
    const lastIndex = code.lastIndexOf(';') + 1

    const blob = new Blob([code.slice(0, lastIndex)], { type: 'text/javascript' })

    const url = URL.createObjectURL(blob)
    const mod: { default: any } = await import(/* @vite-ignore */ url)
    return mod.default as PluginConfigFactory | undefined
  }
  public override async decodeMeta(file: File): Promise<PluginArchiveDB.Meta> {
    const code = await file.text()
    return await decodeDevMeta(code)
  }

  public override isMetaFile(file: File): boolean {
    return file.name.endsWith('.js')
  }
  public override async decodeMetaFile(file: File): Promise<PluginArchiveDB.Meta | string> {
    return this.decodeMeta(file)
  }
})()