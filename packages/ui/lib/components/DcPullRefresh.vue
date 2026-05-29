<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import { cn, type StyleProps } from '../utils'

import DcLoading from './DcLoading.vue'

const $props = withDefaults(
  defineProps<
    { disabled: boolean; refresher: () => Promise<any>; pullDistance?: number } & StyleProps
  >(),
  { disabled: false, pullDistance: 50 },
)

const isRefreshing = defineModel<boolean>('refreshing', { default: false })
const isPulling = defineModel<boolean>('pulling', { default: false })
defineSlots<{ default(): any }>()

// ── state machine ──
type PullState = 'idle' | 'pulling' | 'ready' | 'refreshing'
const pullState = ref<PullState>('idle')

// Sync pulling v-model with pullState
watch(pullState, s => {
  isPulling.value = s !== 'idle'
})

// ── drag tracking ──
const distance = ref(0)
const startY = ref(0)
const transitioning = ref(false) // true during spring-back / settle animation
const containerRef = ref<HTMLElement>()
const startScrollTop = ref(0)

const threshold = computed(() => $props.pullDistance)

function canPull(): boolean {
  const el = containerRef.value
  if (!el) return false
  // Allow pull when the container is scrolled to the top
  return el.scrollTop <= 0
}

// ── touch handlers ──
function onTouchStart(e: TouchEvent) {
  if ($props.disabled || isRefreshing.value || transitioning.value) return
  if (!canPull()) return

  startY.value = e.touches[0].clientY
  startScrollTop.value = containerRef.value!.scrollTop
}

function onTouchMove(e: TouchEvent) {
  if (!startY.value || $props.disabled || isRefreshing.value || transitioning.value) return

  const delta = e.touches[0].clientY - startY.value

  // Not pulling down or no longer at top
  if (delta <= 0) {
    distance.value = 0
    pullState.value = 'idle'
    return
  }

  // Re-check scroll position in case user scrolled up during touch
  if (!canPull()) {
    distance.value = 0
    pullState.value = 'idle'
    return
  }

  // Prevent page scrolling when actively pulling down
  e.preventDefault()

  // Dampen the drag for natural resistance
  const d = delta * 0.4
  distance.value = d
  pullState.value = d >= threshold.value ? 'ready' : 'pulling'
}

function onTouchEnd() {
  if (!startY.value || $props.disabled || isRefreshing.value || transitioning.value) return

  startY.value = 0

  if (pullState.value === 'ready') {
    doRefresh()
  } else if (distance.value > 0) {
    springBack(0)
  }
}

// ── animation ──
function springBack(target: number) {
  transitioning.value = true
  distance.value = target
  if (target === 0) pullState.value = 'idle'
  // Match CSS transition duration
  setTimeout(() => {
    transitioning.value = false
  }, 350)
}

async function doRefresh() {
  pullState.value = 'refreshing'
  isRefreshing.value = true
  transitioning.value = true
  distance.value = threshold.value

  // Let the transition settle before starting the async work
  await new Promise(r => setTimeout(r, 250))
  transitioning.value = false

  try {
    await $props.refresher()
  } finally {
    isRefreshing.value = false
    springBack(0)
  }
}

// Reset when disabled changes
watch(
  () => $props.disabled,
  v => {
    if (v) {
      distance.value = 0
      pullState.value = 'idle'
      transitioning.value = false
      startY.value = 0
    }
  },
)

// ── lifecycle: ensure touchmove is non-passive ──
onMounted(() => {
  containerRef.value?.addEventListener('touchmove', onTouchMove, { passive: false })
})

onUnmounted(() => {
  containerRef.value?.removeEventListener('touchmove', onTouchMove)
})

// ── derived styles ──
const arrowRotation = computed(() => (pullState.value === 'ready' ? 180 : 0))

const contentStyle = computed(() => ({
  transform: `translateY(${distance.value}px)`,
  transition: transitioning.value ? 'transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
  willChange: transitioning.value ? undefined : 'transform',
}))

const indicatorStyle = computed(() => ({
  height: `${distance.value}px`,
  opacity: pullState.value !== 'idle' ? 1 : 0,
  transition: pullState.value === 'idle' && distance.value === 0 ? 'opacity 0.2s ease' : 'none',
}))
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative overflow-x-hidden overflow-y-auto', $props.class)"
    :style="$props.style"
    @touchstart.passive="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- Pull indicator area -->
    <div
      class="absolute top-0 right-0 left-0 flex items-end justify-center overflow-hidden"
      :style="indicatorStyle"
    >
      <div class="flex items-center gap-2 pb-2 text-sm" style="color: var(--van-gray-5)">
        <!-- Arrow icon -->
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :style="{ transform: `rotate(${arrowRotation}deg)`, transition: 'transform 0.2s ease' }"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>

        <!-- Refreshing: show spinner -->
        <template v-if="pullState === 'refreshing'">
          <DcLoading size="16px" />
          <span>正在刷新...</span>
        </template>

        <!-- Pulling / ready: show text -->
        <template v-else>
          <span v-if="pullState === 'ready'">释放刷新</span>
          <span v-else>下拉刷新</span>
        </template>
      </div>
    </div>

    <!-- Content area -->
    <div :style="contentStyle">
      <slot />
    </div>
  </div>
</template>