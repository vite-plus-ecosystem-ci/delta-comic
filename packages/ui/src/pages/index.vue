<script setup lang="ts">
import { NButton, NLayout, NLayoutContent, NLayoutHeader, NLayoutSider } from 'naive-ui'

import { DcVar } from '@/index'

import { name } from '../../package.json'
</script>

<template>
  <NLayout class="size-full!">
    <NLayoutHeader bordered class="h-16!">
      <div class="ml-4 flex h-full items-center text-2xl font-bold">{{ name }}</div>
    </NLayoutHeader>
    <NLayout has-sider class="h-[calc(100%-4rem)]!">
      <NLayoutSider bordered>
        <div class="flex h-full w-full flex-col">
          <DcVar
            v-for="r of $router
              .getRoutes()
              .filter(v => v.name?.toString().startsWith('//component/'))"
            :value="r.name == $route.name"
            v-slot="{ value: isMe }"
          >
            <NButton
              :type="isMe ? 'primary' : 'default'"
              :disabled="isMe"
              @click="$router.force.push({ name: r.name })"
            >
              {{ r.name }}
            </NButton>
          </DcVar>
        </div>
      </NLayoutSider>
      <NLayoutContent>
        <RouterView />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>