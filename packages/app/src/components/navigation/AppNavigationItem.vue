<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ active: boolean; icon: Component; label: string; to: string }>()
</script>

<template>
  <RouterLink
    :aria-current="active ? 'page' : undefined"
    :class="{ 'app-navigation-item--active': active }"
    :to="to"
    class="app-navigation-item"
  >
    <NIcon class="app-navigation-item__icon" size="26">
      <component :is="icon" />
    </NIcon>
    <span class="app-navigation-item__label">{{ label }}</span>
  </RouterLink>
</template>

<style scoped>
.app-navigation-item {
  display: flex;
  min-width: 0;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--dc-text-tertiary);
  text-decoration: none;
  transition:
    color 160ms ease,
    transform 160ms ease;
}

.app-navigation-item__icon {
  flex: none;
  transition: transform 160ms ease;
}

.app-navigation-item__label {
  overflow: hidden;
  max-width: 100%;
  font-size: 12px;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-navigation-item:hover,
.app-navigation-item--active {
  color: var(--p-color);
}

.app-navigation-item:active {
  transform: scale(0.94);
}

.app-navigation-item--active .app-navigation-item__icon {
  transform: translateY(-1px) scale(1.06);
}

@media (min-width: 960px) {
  .app-navigation-item {
    height: 58px;
    border-radius: 16px;
  }

  .app-navigation-item:hover,
  .app-navigation-item--active {
    background: color-mix(in srgb, var(--p-color) 10%, transparent);
  }
}
</style>