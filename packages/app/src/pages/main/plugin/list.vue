<script setup lang="ts">
import { PluginArchiveDB } from '@delta-comic/db'
import { Install, usePluginStore } from '@delta-comic/plugin'
import { memoize } from 'es-toolkit'
import type { DropdownOption } from 'naive-ui'
import semver from 'semver'
import { shallowReactive, watch } from 'vue'

import { Icons } from '@/icons'

import pkg from '../../../../package.json'

const updating = shallowReactive(new Set<string>())
const updatePlugin = async (plugin: PluginArchiveDB.Archive) => {
  if (updating.has(plugin.pluginName)) throw new Error('已经在更新')
  updating.add(plugin.pluginName)
  try {
    await Install.updatePlugin(plugin)
  } finally {
    updating.delete(plugin.pluginName)
  }
}

const checkIsSupport = memoize((supportCore: string) => semver.satisfies(pkg.version, supportCore))

const getCardClass = (plugin: PluginArchiveDB.Archive) => {
  if (!plugin.enable)
    return 'bg-(--nui-icon-color-disabled)/20! border-(--nui-icon-color-pressed)/20!'
  if (checkIsSupport(plugin.meta.version.supportCore))
    return 'border-(--nui-primary-color)/20! bg-(--nui-primary-color-hover)/10!'
  return 'border-(--nui-warning-color)/20! bg-(--nui-warning-color-hover)/10!'
}

const { toggle } = PluginArchiveDB.useToggleEnable()
const { setKind } = PluginArchiveDB.useSetKind()

const codeArchives = PluginArchiveDB.useQuery(
  db => db.selectAll().execute(),
  [],
  () => [],
)
const pluginStore = usePluginStore()
watch(pluginStore.revision, () => codeArchives.refetch())
const isBuiltIn = (plugin: PluginArchiveDB.Archive) => plugin.loaderName === 'builtin'
const actionsFor = (plugin: PluginArchiveDB.Archive): DropdownOption[] => {
  const actions: DropdownOption[] = [{ key: 'toggle', label: plugin.enable ? '禁用' : '启用' }]
  if (isBuiltIn(plugin)) return actions
  return actions.concat(
    {
      key: 'kind-normal',
      label: '设为普通插件',
      disabled: (plugin.meta.kind ?? 'normal') === 'normal',
    },
    { key: 'kind-preboot', label: '设为预启动插件', disabled: plugin.meta.kind === 'preboot' },
    { key: 'update', label: '从下载源更新', disabled: updating.has(plugin.pluginName) },
    { key: 'remove', label: '删除' },
  )
}

const handleAction = async (plugin: PluginArchiveDB.Archive, key: string) => {
  switch (key) {
    case 'toggle':
      await toggle({ keys: [plugin.pluginName] })
      break
    case 'kind-normal':
      await setKind({ kind: 'normal', pluginName: plugin.pluginName })
      break
    case 'kind-preboot':
      await setKind({ kind: 'preboot', pluginName: plugin.pluginName })
      break
    case 'update':
      await updatePlugin(plugin)
      break
    case 'remove':
      await Install.uninstallPlugin(plugin.pluginName)
      await codeArchives.refetch()
  }
}
</script>

<template>
  <DcContent
    :source="{ type: 'query', query: codeArchives }"
    class="size-full"
    v-slot="{ data: query }"
  >
    <NScrollbar class="size-full">
      <TransitionGroup tag="ul" name="list">
        <NCard
          v-for="plugin of query"
          :key="plugin.pluginName"
          :title="plugin.meta.name.display ?? plugin.pluginName"
          header-class="pt-1! pb-0! px-3!"
          content-class="pb-1! px-3!"
          :class="[getCardClass(plugin)]"
          class="mx-auto mt-1 w-[calc(100%-6px)]! duration-100!"
        >
          <template #header-extra>
            <!-- n-base-select-menu__empty -->
            <NTag
              class="ml-2"
              size="small"
              :type="plugin.meta.kind === 'preboot' ? 'warning' : 'default'"
            >
              {{ isBuiltIn(plugin) ? '内置 · ' : ''
              }}{{ plugin.meta.kind === 'preboot' ? '预启动' : '普通' }}
            </NTag>
            <span class="ml-2 font-light text-(--nui-text-color-3) italic">
              {{ plugin.enable ? '已启用' : '未启用' }}
            </span>
            <NDropdown
              :options="actionsFor(plugin)"
              placement="bottom-end"
              @select="(key: string | number) => handleAction(plugin, String(key))"
            >
              <NButton circle quaternary class="ml-3!" aria-label="插件操作">
                <template #icon>
                  <NIcon><Icons.material.MenuRound /></NIcon>
                </template>
              </NButton>
            </NDropdown>
          </template>
          <span
            class="mr-3 font-bold text-(--nui-text-color-disabled) italic"
            v-if="plugin.meta.version"
          >
            {{ semver.valid(semver.coerce(plugin.meta.version.plugin ?? 'v0')) }}
          </span>
          <span class="text-(--nui-text-color-3)">{{ plugin.meta.description }}</span>
          <div class="w-full text-xs text-(--nui-text-color-disabled)">
            适应核心版本: {{ plugin.meta.version.supportCore }}
          </div>
          <div
            v-if="plugin.meta.kind === 'preboot'"
            class="mt-1 text-xs text-(--nui-warning-color)"
          >
            预启动类型和启用状态将在下次重启时应用
          </div>
          <div
            class="mt-1 flex w-full items-center gap-1 text-sm! font-bold"
            v-if="!checkIsSupport(plugin.meta.version.supportCore)"
          >
            <NIcon color="var(--nui-warning-color)" size="1.2rem">
              <Icons.material.WarningRound />
            </NIcon>
            插件不支持当前核心版本
          </div>
        </NCard>
      </TransitionGroup>
    </NScrollbar>
  </DcContent>
</template>