<script setup lang="ts">
import type { HistoryDB, ItemStoreDB } from '@delta-comic/db'
import { uni } from '@delta-comic/model'
import dayjs from 'dayjs'
import { computed } from 'vue'

import { Icons } from '@/icons'
import { createDateString } from '@/utils/date'
const $props = defineProps<{ item: ItemStoreDB.StoredItem & HistoryDB.Item }>()

const instance = computed(() => uni.item.Item.create($props.item.item))
</script>

<template>
  <DcVar v-if="item" :value="item?.item" v-slot="{ value }">
    <component :item="instance" :is="uni.item.Item.itemCards.get(instance.contentType)">
      <div class="dc-ellipsis flex flex-nowrap items-center *:text-nowrap">
        <NIcon color="var(--dc-text-secondary)" size="14px">
          <Icons.antd.UserOutlined />
        </NIcon>
        <span v-for="author of value.author" class="dc-interactive mr-2">{{ author.label }}</span>
      </div>
      <div class="dc-ellipsis flex flex-nowrap items-center *:text-nowrap">
        <NIcon color="var(--dc-text-secondary)" size="14px">
          <Icons.material.PhoneAndroidOutlined />
        </NIcon>
        <span class="dc-interactive mr-2">{{ createDateString(dayjs(item.timestamp)) }}</span>
      </div>
    </component>
  </DcVar>
</template>