import type { PluginArchiveDB } from '@delta-comic/db'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { join } from '@tauri-apps/api/path'
import * as fs from '@tauri-apps/plugin-fs'

import { getPluginFsPath } from './utils'

const progressEvent = 'plugin://install-progress'

const call = <T>(command: string, args: Record<string, unknown>) =>
  invoke<T>(`plugin:plugin|${command}`, args)

export interface NativeInstallProgress {
  current: number
  opId: string
  path?: string
  phase: 'done' | 'extract' | 'start'
  total: number
}

interface NativeLocalFile {
  bytes: number[]
  name: string
}

export const createNativeOperationId = () => crypto.randomUUID()

export const writeNativeTempFile = async (file: File): Promise<string> => {
  const temp = await getPluginFsPath('__temp__')
  await fs.mkdir(temp, { recursive: true })
  const safeName = file.name.replace(/[\\/]/g, '_') || 'plugin.bin'
  const path = await join(temp, `${Date.now()}-${crypto.randomUUID()}-${safeName}`)
  await fs.writeFile(path, new Uint8Array(await file.arrayBuffer()))
  return path
}

export const readLocalFile = async (path: string): Promise<File> => {
  const file = await call<NativeLocalFile>('read_local_file', { path })
  return new File([new Uint8Array(file.bytes)], file.name)
}

export const prepareDevScript = (input: string, code: string) =>
  call<string>('prepare_dev_script', { code, input })

export const decodeDevMeta = (code: string) =>
  call<PluginArchiveDB.Meta>('decode_dev_meta', { code })

export const installDev = (code: string) => call<PluginArchiveDB.Meta>('install_dev', { code })

export const decodeZipMeta = (zipPath: string) =>
  call<PluginArchiveDB.Meta>('decode_zip_meta', { zipPath })

export const installZip = async (
  zipPath: string,
  opId: string,
  onProgress?: (progress: NativeInstallProgress) => void,
) => {
  const unlisten = onProgress
    ? await listen<NativeInstallProgress>(progressEvent, event => {
        if (event.payload.opId === opId) onProgress(event.payload)
      })
    : undefined
  try {
    return await call<PluginArchiveDB.Meta>('install_zip', { opId, zipPath })
  } finally {
    unlisten?.()
  }
}