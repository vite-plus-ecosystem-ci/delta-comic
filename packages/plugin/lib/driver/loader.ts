import { db, type PluginArchiveDB } from '@delta-comic/db'
import { Mutex } from 'es-toolkit'
import { sortBy } from 'es-toolkit/compat'
import { ref, type Ref } from 'vue'

import type { PluginConfigFactory } from '@/plugin'

import { bootPlugin } from './booter'
import type { PluginLoader } from './init/utils'
import { formatPluginLoadPlanError, planPluginLoadOrder } from './loadPlan'

const rawLoaders = import.meta.glob<PluginLoader>('./init/loader/*_*.ts', {
  eager: true,
  import: 'default',
})
export const loaders = sortBy(Object.entries(rawLoaders), ([fname]) =>
  // oxlint-disable-next-line no-useless-escape
  Number(fname.match(/[\d\.]+(?=_)/)?.[0]),
).map(v => v[1])

const loadLocks = <Record<string, Mutex>>{}
const getLoadLock = (pluginName: string) => (loadLocks[pluginName] ??= new Mutex())

/** 加载单个插件：获取 config factory → bootPlugin，全程在锁内 */
const bootConfig = async (
  configFactory: PluginConfigFactory,
  info: Ref<Record<string, PluginLoadingInfo>>,
) => {
  const cfg = configFactory({ safe: true })
  info.value[cfg.name] = {
    progress: { status: 'wait', stepsIndex: 0 },
    steps: [{ name: '等待', description: '插件载入中' }],
  }
  await bootPlugin(cfg, info)
}

export const loadPlugin = async (
  meta: PluginArchiveDB.Archive,
  info: Ref<Record<string, PluginLoadingInfo>>,
) => {
  console.log(`[plugin bootPlugin] booting name "${meta.pluginName}"`)
  const lock = getLoadLock(meta.pluginName)

  const loader = loaders.find(v => v.name === meta.loaderName)
  if (!loader) throw new Error(`未找到加载器 "${meta.loaderName}"，插件: ${meta.pluginName}`)

  try {
    await lock.acquire()
    const configFactory = await loader.load(meta)
    if (configFactory) await bootConfig(configFactory, info)
  } finally {
    lock.release()
  }
  console.log(`[plugin bootPlugin] boot name done "${meta.pluginName}"`)
}

export type PluginLoadingInfo = {
  steps: { name: string; description: string }[]
  progress: {
    errorReason?: string
    stepsIndex: number
    status: 'wait' | 'process' | 'error' | 'done'
  }
}

export const loadAllPlugins = () => {
  const progress = ref<Record<string, PluginLoadingInfo>>({})

  const promise = (async () => {
    const plugins = await db.selectFrom('plugin').where('enable', 'is', true).selectAll().execute()

    // 1. 通过 Kahn 拓扑排序将插件分层
    const loadPlan = planPluginLoadOrder(plugins)

    // 2. 检测无效依赖，输出具体路径
    const planError = formatPluginLoadPlanError(loadPlan)
    if (planError) {
      throw new Error(planError)
    }

    // 3. 按层级加载，失败时终止后续
    for (const level of loadPlan.levels) {
      const results = await Promise.allSettled(level.map(p => loadPlugin(p, progress)))

      for (const [i, r] of results.entries()) {
        if (r.status === 'rejected') {
          const pluginName = level[i].pluginName
          const reason = r.reason instanceof Error ? r.reason.message : String(r.reason)
          console.error(`[plugin] 加载失败: ${pluginName}`, r.reason)

          progress.value[pluginName].progress = {
            ...progress.value[pluginName].progress,
            errorReason: reason,
            status: 'error',
          }
        }
      }
    }

    console.log('[plugin bootPlugin] all load done')
  })()

  return Object.assign(promise, progress)
}