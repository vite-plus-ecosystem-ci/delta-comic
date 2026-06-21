<script setup lang="ts">
import { NButton, NLayout, NInput, NCard } from 'naive-ui'
import { shallowRef } from 'vue'

import { createLoadingMessage, type LoadingInstance } from '@/message'

const messageInst = shallowRef<LoadingInstance>()

const loadingText = shallowRef('加载中')
</script>

<template>
  <NLayout embedded contentClass="p-5">
    <NCard title="创建标准loading">
      <div class="py-4">
        <NButton @click="messageInst = createLoadingMessage(loadingText)">创建</NButton>
        <NInput class="ml-2 max-w-60!" v-model:value="loadingText"></NInput>
      </div>

      <div>操作</div>
      <div class="py-4">
        <NButton @click="messageInst?.success()">成功</NButton>
        <NInput class="ml-2 max-w-60!" v-model:value="loadingText"></NInput>
      </div>
      <div class="py-4">
        <NButton @click="messageInst?.fail()">失败</NButton>
        <NInput class="ml-2 max-w-60!" v-model:value="loadingText"></NInput>
      </div>
      <div class="py-4">
        <NButton @click="messageInst?.destroy()">销毁</NButton>
        <NInput class="ml-2 max-w-60!" v-model:value="loadingText"></NInput>
      </div>
    </NCard>
  </NLayout>
</template>