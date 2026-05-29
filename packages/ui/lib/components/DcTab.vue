<script
  setup
  lang="ts"
  generic="T extends { name: string; title: string; route?: RouteLocationRaw }"
>
import { useResizeObserver } from '@vueuse/core'
import { Mutex } from 'es-toolkit'
import { motion } from 'motion-v'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

import { cn } from '@/utils'

import type { StyleProps } from '../utils'

const active = defineModel<string>()

const $props = withDefaults(
  defineProps<
    {
      /**
       * 基于路由的name匹配
       */
      items: T[]
      mode?: 'replace' | 'push'
      /** 是否使用路由模式，为 false 时使用 v-model 控制选中项 */
      router?: boolean
      /** 标签宽度自适应内容 */
      shrink?: boolean
      /** 是否启用手势滑动切换 */
      swipeable?: boolean
    } & StyleProps
  >(),
  { mode: 'replace', router: true, shrink: true, swipeable: false },
)

const $route = useRoute()
const $router = useRouter()

const selecting = computed<string | undefined>(() => {
  if ($props.router) {
    const item = $props.items.find(v => {
      if (!v.route) return false
      const route = $router.resolve(v.route)
      return route.path == $route.path
    })
    return item?.name ?? $props.items.at(0)?.name
  }
  // 非路由模式：使用 v-model
  if (active.value && $props.items.some(v => v.name === active.value)) {
    return active.value
  }
  return $props.items.at(0)?.name
})

const routeLock = new Mutex()
const handleRoute = async (aimName: string) => {
  if (routeLock.isLocked) return false
  try {
    const item = $props.items.find(v => v.name == aimName)
    if (!item) throw new Error('Not found item in <DcTab>, name: ' + aimName)

    if ($props.router) {
      if (!item.route) throw new Error('Missing route in item <DcTab>, name: ' + aimName)
      await $router.force[$props.mode](item.route)
    } else {
      active.value = aimName
    }
    return true
  } finally {
    routeLock.release()
  }
}

// ============ 下划线动画 ============
const scrollRef = useTemplateRef('scrollRef')
const listRef = useTemplateRef('listRef')
const tabRefs = ref<Record<string, HTMLElement>>({})

const indicatorX = ref(0)
const indicatorWidth = ref(0)
/** 首次渲染不显示下划线，避免从0位置闪动到目标 */
const indicatorReady = ref(false)

function setTabRef(name: string) {
  return (el: unknown) => {
    if (el instanceof HTMLElement) {
      tabRefs.value[name] = el
      // 首个标签出现后标记就绪
      if (!indicatorReady.value) indicatorReady.value = true
    }
  }
}

function updateIndicator() {
  const name = selecting.value
  if (!name) return
  const el = tabRefs.value[name]
  if (!el || !scrollRef.value) return
  const scrollRect = scrollRef.value.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  indicatorX.value = elRect.left - scrollRect.left + scrollRef.value.scrollLeft
  indicatorWidth.value = elRect.width
}

// 选中项变化时更新
watch(selecting, () => requestAnimationFrame(updateIndicator))
// items 数量变化时更新（动态 tab）
watch(
  () => $props.items.length,
  () => requestAnimationFrame(updateIndicator),
)
// 容器尺寸变化时更新
useResizeObserver(listRef, updateIndicator)

// ============ 手势滑动切换 ============
const selectedIndex = computed(() => $props.items.findIndex(v => v.name === selecting.value))

const onSwipeEnd = (_evt: unknown, info?: { offset: { x: number } }) => {
  if (!info || !$props.swipeable) return
  const threshold = 60
  if (info.offset.x < -threshold && selectedIndex.value < $props.items.length - 1) {
    handleRoute($props.items[selectedIndex.value + 1].name)
  } else if (info.offset.x > threshold && selectedIndex.value > 0) {
    handleRoute($props.items[selectedIndex.value - 1].name)
  }
}

defineSlots<{ left(): any; right(): any; bottom(): any }>()
</script>

<template>
  <div :class="cn('dc-tabs w-full', $props.class)" :style="style">
    <div class="dc-tabs__nav">
      <slot name="left" />
      <div ref="scrollRef" class="dc-tabs__scroll">
        <motion.div
          ref="listRef"
          :class="cn('dc-tabs__list', shrink && 'dc-tabs__list--shrink')"
          :drag="swipeable ? 'x' : false"
          :drag-constraints="swipeable ? { left: -120, right: 120 } : undefined"
          :drag-elastic="0.1"
          :drag-momentum="false"
          :on-drag-end="onSwipeEnd"
        >
          <div
            v-for="item of items"
            :key="item.name"
            :ref="setTabRef(item.name)"
            class="dc-tabs__tab"
            :class="{ 'dc-tabs__tab--active': selecting === item.name }"
            @click="handleRoute(item.name)"
          >
            <span class="dc-tabs__tab-text">{{ item.title }}</span>
          </div>
        </motion.div>
        <motion.div
          v-show="indicatorReady"
          class="dc-tabs__indicator"
          :animate="{ x: indicatorX, width: indicatorWidth }"
          :transition="{ type: 'spring', stiffness: 400, damping: 28, mass: 0.8 }"
          :initial="false"
        />
      </div>
      <slot name="right" />
    </div>
    <slot name="bottom" />
  </div>
</template>

<style scoped>
.dc-tabs__nav {
  display: flex;
  align-items: center;
  height: var(--van-tabs-line-height, 44px);
  padding-bottom: var(--van-tabs-padding-bottom, 15px);
  background: var(--van-background-2);
}

.dc-tabs__scroll {
  flex: 1;
  overflow-x: auto;
  position: relative;
  height: 100%;
  scrollbar-width: none;
}

.dc-tabs__scroll::-webkit-scrollbar {
  display: none;
}

.dc-tabs__list {
  display: flex;
  height: 100%;
  align-items: center;
  min-width: 100%;
}

.dc-tabs__list--shrink {
  display: inline-flex;
  min-width: auto;
}

.dc-tabs__tab {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  padding: 0 12px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.dc-tabs__list--shrink .dc-tabs__tab {
  flex: none;
  min-width: 0;
}

.dc-tabs__tab-text {
  font-size: 14px;
  color: var(--van-text-color-2);
  white-space: nowrap;
  transition:
    color 0.2s,
    font-weight 0.2s;
}

.dc-tabs__tab--active .dc-tabs__tab-text {
  color: var(--van-text-color);
  font-weight: 500;
}

.dc-tabs__indicator {
  position: absolute;
  bottom: var(--van-tabs-padding-bottom, 15px);
  left: 0;
  height: 3px;
  border-radius: 3px;
  background: var(--van-tabs-bottom-bar-color, var(--p-color, #1989fa));
  pointer-events: none;
}
</style>