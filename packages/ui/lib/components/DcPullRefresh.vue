<script setup lang="ts">
import { AnimatePresence } from 'motion-v'

import type { StyleProps } from '@/utils'

const $props = withDefaults(
  defineProps<{ disabled: boolean; refresher: () => Promise<any> } & StyleProps>(),
  { disabled: false },
)
const isRefreshing = defineModel<boolean>({ default: false })

defineSlots<{ default(): any }>()
</script>

<template>
  <AnimatePresence></AnimatePresence>
</template>