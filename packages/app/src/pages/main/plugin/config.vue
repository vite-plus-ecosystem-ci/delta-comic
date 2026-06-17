<script setup lang="ts">
import { useConfig } from '@delta-comic/plugin'
import { NDynamicInput } from 'naive-ui'

const cfg = useConfig().$loadApp()
</script>

<template>
  <NScrollbar class="size-full">
    <div class="mb-2 ml-4 text-lg font-semibold">下载源覆写</div>
    <NDynamicInput
      v-model:value="cfg.data.value.installOverride"
      :on-create="() => ({ key: '', value: '' })"
    >
      <template #default="{ value }">
        <div class="flex w-[calc(100%-var(--spacing)*25)] items-center">
          <NInput v-model:value="value.key" class="w-2/3!" type="text" placeholder="插件ID" />
          <NInput v-model:value="value.value" type="text" class="my-2" placeholder="下载语句" />
        </div>
      </template>
    </NDynamicInput>
  </NScrollbar>
</template>