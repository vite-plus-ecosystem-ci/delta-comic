<script setup lang="ts">
import { uni } from '@delta-comic/model'
import { Global } from '@delta-comic/plugin'
import { chunk } from 'es-toolkit'
import { isEmpty } from 'es-toolkit/compat'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { Icons } from '@/icons'

const $router = useRouter()
const hotList = computed(() => Array.from(Global.mainLists.values()).flat())
const topButtons = computed(() => {
  const buttons = Array.from(Global.topButton.values()).flat()
  if (!isEmpty(Global.levelboard)) {
    buttons.unshift({
      bgColor: '#ff9212',
      name: '排行榜',
      icon: Icons.other.HotLevel,
      onClick() {
        const first = Global.levelboard.keys().next().value!
        return $router.force.push({ name: '/hot/[plugin]', params: { plugin: first } })
      },
    })
  }
  return buttons
})

const getItemCard = (contentType: uni.content.ContentType_) =>
  uni.item.Item.itemCards.get(contentType)

const splitItems = (value: unknown) => {
  const items = Array.isArray(value) ? (value as uni.item.Item[]) : []
  return chunk(items, Math.max(1, Math.ceil(items.length / 2)))
}
</script>

<template>
  <NScrollbar class="size-full">
    <div
      class="scrollbar flex h-fit w-full gap-8 overflow-x-auto overflow-y-hidden bg-(--dc-surface) px-4 py-1"
    >
      <div
        class="flex h-full w-fit flex-col items-center justify-around"
        v-for="(btn, buttonIndex) of topButtons"
        :key="`${btn.name}:${buttonIndex}`"
      >
        <button
          type="button"
          class="dc-interactive flex size-12 items-center justify-center rounded-full"
          :aria-label="btn.name"
          :style="{ backgroundColor: btn.bgColor }"
          @click="btn.onClick?.()"
        >
          <NIcon color="white" size="calc(var(--spacing) * 6.5)">
            <component :is="btn.icon" />
          </NIcon>
        </button>
        <div class="text-[13px]!">{{ btn.name }}</div>
      </div>
    </div>
    <div v-for="(block, blockIndex) of hotList" :key="`${block.name}:${blockIndex}`">
      <div class="sticky top-0 z-10 bg-(--dc-background) py-px">
        <div
          class="dc-interactive relative mx-auto my-1 flex h-10 w-[calc(100%-8px)] items-center rounded bg-(--dc-surface)"
          @click="block.onClick?.()"
        >
          <span class="ml-3 text-xl font-bold text-(--nui-primary-color)">{{ block.name }}</span>
          <NIcon class="absolute! right-3" color="var(--dc-text-tertiary)" size="20px">
            <Icons.material.ArrowForwardIosRound />
          </NIcon>
        </div>
      </div>
      <DcVar :value="block.content()" v-slot="{ value }">
        <DcContent :source="{ type: 'query', query: value }">
          <div class="flex gap-1 px-1">
            <div
              class="flex w-full flex-col gap-1"
              v-for="items of splitItems(value.data.value)"
              :key="items[0]?.id ?? 'empty'"
            >
              <component
                v-for="item of items"
                :key="item.id"
                :item
                free-height
                type="small"
                :is="getItemCard(item.contentType)"
              />
            </div>
          </div>
        </DcContent>
      </DcVar>
    </div>
  </NScrollbar>
</template>
<style scoped lang="css">
.scrollbar::-webkit-scrollbar {
  display: none;
}

.scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
</style>