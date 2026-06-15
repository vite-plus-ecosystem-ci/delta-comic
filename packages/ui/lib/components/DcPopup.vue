<script setup lang="ts">
import { NDrawer, NModal } from 'naive-ui'
import { computed } from 'vue'

import { usePreventBack, useZIndex } from '@/utils/layout'

import { type StyleProps } from '../utils'

const $props = withDefaults(
  defineProps<
    {
      position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
      overlay?: boolean
      closeOnClickOverlay?: boolean
      /** 显示关闭按钮，center 模式显示 ✕ 图标，其他模式透传 NDrawer closable */
      closeable?: boolean
      round?: boolean
      teleport?: string
      destroyOnClose?: boolean
      /** 关闭前回调，返回 false 阻止关闭 */
      beforeClose?: () => boolean
      /** 首次显示时播放入场过渡动画（仅 center 模式有效） */
      transitionAppear?: boolean
    } & StyleProps
  >(),
  {
    position: 'center',
    overlay: true,
    closeOnClickOverlay: true,
    teleport: '#popups',
    destroyOnClose: true,
  },
)

const isShow = defineModel<boolean>('show', { required: true })
const [zIndex, isLast] = useZIndex(isShow)
usePreventBack(isShow, isLast)

const emit = defineEmits<{ closed: [] }>()
defineSlots<{ default(): void }>()
defineExpose({ zIndex })

/** NDrawer 用 v-if 实现 destroyOnClose */
const drawerShow = computed(() => ($props.destroyOnClose ? isShow.value : true))
const drawerVisible = computed(() => ($props.destroyOnClose ? true : isShow.value))

/** NDrawer 四个方向的 border-radius 映射 */
const drawerContentStyle = computed(() => {
  if (!$props.round) return undefined
  const r = '16px'
  switch ($props.position) {
    case 'bottom':
      return { borderRadius: `${r} ${r} 0 0` }
    case 'top':
      return { borderRadius: `0 0 ${r} ${r}` }
    case 'left':
      return { borderRadius: `0 ${r} ${r} 0` }
    case 'right':
      return { borderRadius: `${r} 0 0 ${r}` }
    default:
      return { borderRadius: r }
  }
})

const closeable = computed(
  () => $props.closeable ?? !$props.destroyOnClose, // NDrawer 默认 closable=true，如不销毁则需保留关闭
)
</script>

<template>
  <!-- Center 模式：自建 overlay + 居中卡片 -->
  <template v-if="position === 'center'" :to="teleport">
    <NModal >
      <slot />
    </NModal>
  </template>

  <!-- 其他方向：NDrawer -->
  <template v-else>
    <NDrawer
      v-if="drawerShow"
      :show="drawerVisible"
      :showMask="overlay"
      :placement="position"
      :to="teleport"
      :z-index="zIndex"
      :mask-closable="closeOnClickOverlay"
      :closable="closeable"
      :content-style="drawerContentStyle"
      :class="$props.class"
      :style="$props.style"
      @after-leave="emit('closed')"
      @update:show="
        (val: boolean) => {
          if (!val && beforeClose && !beforeClose()) return
          isShow = val
        }
      "
    >
      <slot />
    </NDrawer>
  </template>
</template>