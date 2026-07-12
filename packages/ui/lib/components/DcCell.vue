<script setup lang="ts">
import { computed, getCurrentInstance, useSlots } from 'vue'

import { cn } from '@/utils'

const $props = withDefaults(
  defineProps<{
    tag?: string
    icon?: string
    size?: 'normal' | 'large'
    title?: string | number
    value?: string | number
    label?: string | number
    center?: boolean
    isLink?: boolean
    border?: boolean
    iconPrefix?: string
    valueClass?: any
    labelClass?: any
    titleClass?: any
    titleStyle?: string | Record<string, any>
    arrowDirection?: 'up' | 'down' | 'left' | 'right'
    required?: boolean | 'auto'
    clickable?: boolean | null
    /** vue-router 路由跳转 */
    to?: any
    url?: string
    replace?: boolean
    class?: any
    style?: any
  }>(),
  { tag: 'div', border: true, required: undefined, clickable: undefined },
)
const emit = defineEmits<{ click: [event: MouseEvent] }>()

const slots = useSlots()
const vm = getCurrentInstance()!.proxy!

function navigate() {
  if ($props.to && vm.$router) {
    vm.$router[$props.replace ? 'replace' : 'push']($props.to)
  } else if ($props.url) {
    if ($props.replace) {
      location.replace($props.url)
    } else {
      location.href = $props.url
    }
  }
}

function handleClick(event: MouseEvent) {
  navigate()
  emit('click', event)
}

const isClickable = computed(() => ($props.clickable != null ? $props.clickable : $props.isLink))

const bem = (mods?: Record<string, boolean | undefined>) => {
  const base = 'dc-cell'
  if (!mods) return base
  const classes = [base]
  for (const [k, v] of Object.entries(mods)) {
    if (v) classes.push(`${base}--${k}`)
  }
  return classes.join(' ')
}

const renderArrowIcon = computed(() => {
  if (!$props.isLink) return ''
  const dir = $props.arrowDirection
  if (!dir || dir === 'right') return '›'
  if (dir === 'left') return '‹'
  if (dir === 'up') return '⌃'
  return '⌄'
})
</script>

<template>
  <component
    :is="tag"
    :class="
      cn(
        bem({
          center,
          required: !!required,
          clickable: isClickable,
          borderless: !border,
          [size || '']: !!size,
        }),
        $props.class,
      )
    "
    :style="$props.style"
    :role="isClickable ? 'button' : undefined"
    :tabindex="isClickable ? 0 : undefined"
    @click="handleClick"
  >
    <!-- left icon -->
    <div v-if="slots.icon || icon" class="dc-cell__left-icon">
      <slot v-if="slots.icon" name="icon" />
      <span
        v-else
        class="dc-cell__icon"
        :class="[iconPrefix, icon]"
        :aria-label="icon"
        role="img"
      />
    </div>

    <!-- title area -->
    <div :class="cn('dc-cell__title', titleClass)" :style="titleStyle">
      <slot v-if="slots.title" name="title" />
      <span v-else-if="title != null">{{ title }}</span>
      <div v-if="slots.label || label != null" :class="cn('dc-cell__label', labelClass)">
        <slot v-if="slots.label" name="label" />
        <template v-else>{{ label }}</template>
      </div>
    </div>

    <!-- value area -->
    <div
      v-if="slots.value || slots.default || value != null"
      :class="cn('dc-cell__value', valueClass)"
    >
      <slot v-if="slots.value" name="value" />
      <slot v-else-if="slots.default" />
      <span v-else>{{ value }}</span>
    </div>

    <!-- right icon -->
    <div v-if="slots['right-icon'] || isLink" class="dc-cell__right-icon">
      <slot v-if="slots['right-icon']" name="right-icon" />
      <span v-else class="dc-cell__arrow">{{ renderArrowIcon }}</span>
    </div>

    <!-- extra slot -->
    <slot v-if="slots.extra" name="extra" />
  </component>
</template>

<style>
:root,
:host {
  --dc-cell-font-size: var(--dc-font-size-md);
  --dc-cell-line-height: var(--dc-line-height-md);
  --dc-cell-vertical-padding: 10px;
  --dc-cell-horizontal-padding: var(--dc-space-4);
  --dc-cell-text-color: var(--dc-color-text);
  --dc-cell-background: var(--dc-color-surface);
  --dc-cell-border-color: var(--dc-color-border);
  --dc-cell-active-color: var(--dc-color-active);
  --dc-cell-required-color: var(--dc-color-danger);
  --dc-cell-label-color: var(--dc-color-text-secondary);
  --dc-cell-label-font-size: var(--dc-font-size-sm);
  --dc-cell-label-line-height: var(--dc-line-height-sm);
  --dc-cell-label-margin-top: var(--dc-space-1);
  --dc-cell-value-color: var(--dc-color-text-secondary);
  --dc-cell-value-font-size: inherit;
  --dc-cell-icon-size: 16px;
  --dc-cell-right-icon-color: var(--dc-color-icon);
  --dc-cell-large-vertical-padding: var(--dc-space-3);
  --dc-cell-large-title-font-size: var(--dc-font-size-lg);
  --dc-cell-large-label-font-size: var(--dc-font-size-md);
  --dc-cell-large-value-font-size: inherit;
}

.dc-cell {
  position: relative;
  display: flex;
  box-sizing: border-box;
  width: 100%;
  padding: var(--dc-cell-vertical-padding) var(--dc-cell-horizontal-padding);
  overflow: hidden;
  color: var(--dc-cell-text-color);
  font-size: var(--dc-cell-font-size);
  line-height: var(--dc-cell-line-height);
  background: var(--dc-cell-background);
}

.dc-cell::after {
  position: absolute;
  box-sizing: border-box;
  content: ' ';
  pointer-events: none;
  right: var(--dc-space-4);
  bottom: 0;
  left: var(--dc-space-4);
  border-bottom: 1px solid var(--dc-cell-border-color);
  transform: scaleY(0.5);
}

.dc-cell:last-child::after,
.dc-cell--borderless::after {
  display: none;
}

.dc-cell__label {
  margin-top: var(--dc-cell-label-margin-top);
  color: var(--dc-cell-label-color);
  font-size: var(--dc-cell-label-font-size);
  line-height: var(--dc-cell-label-line-height);
}

.dc-cell__title,
.dc-cell__value {
  flex: 1;
}

.dc-cell__value {
  position: relative;
  overflow: hidden;
  color: var(--dc-cell-value-color);
  font-size: var(--dc-cell-value-font-size);
  text-align: right;
  vertical-align: middle;
  word-wrap: break-word;
}

.dc-cell__left-icon,
.dc-cell__right-icon {
  height: var(--dc-cell-line-height);
  font-size: var(--dc-cell-icon-size);
  line-height: var(--dc-cell-line-height);
}

.dc-cell__left-icon {
  margin-right: var(--dc-space-1);
}

.dc-cell__right-icon {
  margin-left: var(--dc-space-1);
  color: var(--dc-cell-right-icon-color);
}

.dc-cell__icon {
  display: inline-flex;
  width: 1em;
  height: 1em;
  align-items: center;
  justify-content: center;
  font-style: normal;
}

.dc-cell--clickable {
  cursor: pointer;
}

.dc-cell--clickable:active {
  background-color: var(--dc-cell-active-color);
}

.dc-cell--required {
  overflow: visible;
}

.dc-cell--required::before {
  position: absolute;
  left: var(--dc-space-2);
  color: var(--dc-cell-required-color);
  font-size: var(--dc-cell-font-size);
  content: '*';
}

.dc-cell--center {
  align-items: center;
}

.dc-cell--large {
  padding-top: var(--dc-cell-large-vertical-padding);
  padding-bottom: var(--dc-cell-large-vertical-padding);
}

.dc-cell--large .dc-cell__title {
  font-size: var(--dc-cell-large-title-font-size);
}

.dc-cell--large .dc-cell__label {
  font-size: var(--dc-cell-large-label-font-size);
}

.dc-cell--large .dc-cell__value {
  font-size: var(--dc-cell-large-value-font-size);
}

.dc-cell__arrow {
  font-size: 18px;
  font-weight: 200;
}
</style>