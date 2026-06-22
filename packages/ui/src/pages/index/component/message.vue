<script setup lang="ts">
import { NButton, NInput, NCard } from 'naive-ui'
import { shallowRef } from 'vue'

import { createLoadingMessage, type LoadingInstance } from '@/message'

const messageInst = shallowRef<LoadingInstance>()

const loadingText = shallowRef('加载中')
const successText = shallowRef('成功！')
const failText = shallowRef('失败！')
</script>

<template>
  <NCard title="创建标准loading" class="m-5">
    <div class="py-4">
      <NButton @click="messageInst = createLoadingMessage(loadingText)">创建</NButton>
      <NInput class="ml-2 max-w-60!" v-model:value="loadingText"></NInput>
    </div>

    <div>操作</div>
    <div class="py-4">
      <NButton @click="messageInst?.success(successText)">成功</NButton>
      <NInput class="ml-2 max-w-60!" v-model:value="successText"></NInput>
    </div>
    <div class="py-4">
      <NButton @click="messageInst?.fail(failText)">失败</NButton>
      <NInput class="ml-2 max-w-60!" v-model:value="failText"></NInput>
    </div>
    <div class="py-4">
      <NButton @click="messageInst?.destroy()">销毁</NButton>
    </div>
  </NCard>
</template>