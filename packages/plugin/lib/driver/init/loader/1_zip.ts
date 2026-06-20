import type { PluginArchiveDB } from '@delta-comic/db'
import { convertFileSrc } from '@tauri-apps/api/core'
import { join } from '@tauri-apps/api/path'
import * as fs from '@tauri-apps/plugin-fs'
import JSZip from 'jszip'

import type { PluginConfigFactory } from '@/plugin'

import { createNativeOperationId, decodeZipMeta, installZip, writeNativeTempFile } from '../native'
import { PluginLoader, type PluginLoaderInstallContext } from '../utils'
import { getPluginFsPath } from '../utils'

export default new (class extends PluginLoader {
  public override name = 'zip'
  public override async install(
    file: File,
    context?: PluginLoaderInstallContext,
  ): Promise<PluginArchiveDB.Meta> {
    console.log('[loader zip] begin:', file)
    const zipPath = await writeNativeTempFile(file)
    console.log('[loader zip] temp:', zipPath)
    const opId = createNativeOperationId()
    return await installZip(zipPath, opId, progress => {
      const percent = progress.total > 0 ? (progress.current / progress.total) * 90 : 0
      context?.report({
        description: progress.path ? `解压: ${progress.path}` : '解压插件',
        progress: percent,
      })
    })
  }
  public override canInstall(file: File): boolean {
    return file.name.endsWith('.zip')
  }

  public override async load(
    pluginMeta: PluginArchiveDB.Archive,
  ): Promise<PluginConfigFactory | undefined> {
    if (!pluginMeta.meta.entry) throw new Error('not found entry')
    const baseDir = await getPluginFsPath(pluginMeta.pluginName)
    console.log('[loader zip] baseDir:', baseDir, pluginMeta.meta.entry)
    const src = decodeURIComponent(
      convertFileSrc(await join(baseDir, pluginMeta.meta.entry.jsPath), 'local'),
    )
    const config = await import(/* @vite-ignore */ src)
    const result = config.default as PluginConfigFactory | undefined

    if (!pluginMeta.meta.entry?.cssPath) return result
    const cssPath = pluginMeta.meta.entry.cssPath

    if (cssPath == 'auto') {
      var filePath = ''
      // take first
      const files = await fs.readDir(baseDir)
      for (const file of files) {
        if (file.name.endsWith('.css')) {
          var filePath = file.name
          break
        }
      }
    } else var filePath = cssPath

    const style = document.createElement('link')
    style.addEventListener('error', err => {
      throw err
    })
    style.rel = 'stylesheet'
    style.href = decodeURIComponent(convertFileSrc(await join(baseDir, filePath), 'local'))
    document.head.appendChild(style)

    return result
  }
  public override async decodeMeta(file: File): Promise<PluginArchiveDB.Meta> {
    return await decodeZipMeta(await writeNativeTempFile(file))
  }

  public override isMetaFile(file: File): boolean {
    return file.name.endsWith('.zip') || file.name == 'manifest.json'
  }
  public override async decodeMetaFile(file: File): Promise<PluginArchiveDB.Meta | string> {
    if (file.name == 'manifest.json') return JSON.parse(await file.text())
    const jszip = new JSZip()
    const zip = await jszip.loadAsync(file)
    const mFile = await zip.filter(p => p == 'manifest.json')[0].async('text')
    return JSON.parse(mFile)
  }
})()