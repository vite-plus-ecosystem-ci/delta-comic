<script setup lang="ts">
defineProps<{ title?: string; inset?: boolean; border?: boolean }>()

defineSlots<{ title(): any; default(): any }>()
</script>

<template>
  <template v-if="title || $slots.title">
    <div :class="{ 'dc-cell-group__title--inset': inset }" class="dc-cell-group__title">
      <slot v-if="$slots.title" name="title" />
      <template v-else>{{ title }}</template>
    </div>
  </template>
  <div
    :class="{ 'dc-cell-group--inset': inset, 'van-hairline--top-bottom': border && !inset }"
    class="dc-cell-group"
  >
    <slot />
  </div>
</template>

<style>
:root,
:host {
  --van-cell-group-background: var(--van-background-2);
  --van-cell-group-title-color: var(--van-text-color-2);
  --van-cell-group-title-padding: var(--van-padding-md) var(--van-padding-md);
  --van-cell-group-title-font-size: var(--van-font-size-md);
  --van-cell-group-title-line-height: 16px;
  --van-cell-group-inset-padding: 0 var(--van-padding-md);
  --van-cell-group-inset-radius: var(--van-radius-lg);
  --van-cell-group-inset-title-padding: var(--van-padding-md) var(--van-padding-md);
}

.dc-cell-group {
  background: var(--van-cell-group-background);
}

.dc-cell-group--inset {
  margin: var(--van-cell-group-inset-padding);
  border-radius: var(--van-cell-group-inset-radius);
  overflow: hidden;
}

.dc-cell-group__title {
  padding: var(--van-cell-group-title-padding);
  color: var(--van-cell-group-title-color);
  font-size: var(--van-cell-group-title-font-size);
  line-height: var(--van-cell-group-title-line-height);
}

.dc-cell-group__title--inset {
  padding: var(--van-cell-group-inset-title-padding);
}
</style>