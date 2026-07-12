<script setup lang="ts">
import { pluginRuntime, type PluginLoadingInfo } from '@delta-comic/plugin'
import {
  type MenuOption,
  NDrawer,
  NIcon,
  NMenu,
  NSpin,
  NTabPane,
  NTabs,
  useMessage,
} from 'naive-ui'
import { type Component, h, ref, shallowRef, watch } from 'vue'

import { Icons } from '@/icons'
import Config from '@/pages/main/plugin/config.vue'
import Download from '@/pages/main/plugin/download.vue'
import List from '@/pages/main/plugin/list.vue'

import pkg from '../../../package.json'

import ActionButtonGroup from './actionButtonGroup.vue'
import LoadList from './loadList.vue'

const show = defineModel<boolean>('show', { required: true })
const isBooted = defineModel<boolean>('isBooted', { required: true })
const renderIcon = (icon: Component) => () => h(NIcon, null, { default: () => h(icon) })

const pluginPages = [
  {
    label: '管理',
    key: 'list',
    icon: renderIcon(Icons.material.AutoAwesomeMosaicOutlined),
    comp: List,
  },
  {
    label: '安装',
    key: 'download',
    icon: renderIcon(Icons.material.FileDownloadOutlined),
    comp: Download,
  },
  { label: '配置', key: 'config', icon: renderIcon(Icons.antd.SettingOutlined), comp: Config },
] as const

const menuOptions: MenuOption[] = [
  ...pluginPages,
  { label: `版本: ${pkg.version}`, key: 'version', disabled: true },
]
const pageSelect = shallowRef<(typeof pluginPages)[number]['key']>('list')

const bootingSteps = ref<Record<string, PluginLoadingInfo>>()
const boot = async (safe = false) => {
  if (bootingSteps.value || isBooted.value) return $message.warning('正在启动中')
  window.$$safe$$ = safe
  const { operation, progress } = pluginRuntime.loadNormal()
  const watcher = watch(progress, steps => (bootingSteps.value = steps), {
    immediate: true,
    deep: true,
  })
  try {
    await operation
    isBooted.value = true
    show.value = false
  } finally {
    watcher.stop()
    bootingSteps.value = undefined
  }
}

const $message = useMessage()
</script>

<template>
  <NDrawer v-model:show="show" placement="bottom">
    <NSpin :show="!!bootingSteps" class="relative size-full" contentClass="size-full">
      <div class="flex size-full flex-col overflow-hidden">
        <NMenu
          v-model:value="pageSelect"
          mode="horizontal"
          :options="menuOptions"
          responsive
          class="shrink-0"
        />
        <!-- content pages -->
        <NTabs v-model:value="pageSelect" animated class="plugin-tabs min-h-0 flex-1">
          <NTabPane
            v-for="page in pluginPages"
            :key="page.key"
            :name="page.key"
            :tab="page.label"
            display-directive="show:lazy"
            class="size-full!"
          >
            <component :is="page.comp" />
          </NTabPane>
        </NTabs>
      </div>
      <!-- boot button group -->
      <ActionButtonGroup
        :actions="[
          { title: '安全启动', icon: Icons.antd.SafetyOutlined, onClick: () => boot(true) },
          { title: '启动', icon: Icons.material.CheckRound, onClick: () => boot(false) },
        ]"
      />
      <template #description>
        <AnimatePresence>
          <LoadList :bootingSteps v-if="bootingSteps" />
        </AnimatePresence>
      </template>
    </NSpin>
  </NDrawer>
</template>

<style scoped>
.plugin-tabs :deep(.n-tabs-nav) {
  display: none;
}

.plugin-tabs :deep(.n-tabs-pane-wrapper),
.plugin-tabs :deep(.n-tab-pane) {
  height: 100%;
}

.plugin-tabs :deep(.n-tab-pane) {
  padding: 0;
}
</style>