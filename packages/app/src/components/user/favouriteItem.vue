<script setup lang="ts">
import { uni } from '@delta-comic/model'
import { computed } from 'vue'

import { Icons } from '@/icons'
const $props = defineProps<{ item: uni.item.RawItem; ep: uni.ep.Ep['id'] }>()

const item = computed(() => uni.item.Item.create($props.item))
</script>

<template>
  <component :is="uni.item.Item.itemCards.get(item.contentType)" :item>
    <div class="dc-ellipsis flex flex-nowrap items-center *:text-nowrap">
      <NIcon color="var(--dc-text-secondary)" size="14px">
        <Icons.antd.UserOutlined />
      </NIcon>
      <span v-for="author of item.author" class="dc-interactive mr-2">{{ author.label }}</span>
    </div>
  </component>
</template>