<script setup lang="ts">
import { NScrollbar } from 'naive-ui'
</script>

<template>
  <NScrollbar class="size-full!">
    <div class="ml-4 py-6 text-lg font-bold">{{ $route.name }}</div>
    <RouterView />
  </NScrollbar>
</template>