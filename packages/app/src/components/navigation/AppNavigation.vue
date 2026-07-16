<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useI18n } from 'vue-i18n'

import { Icons } from '@/icons'

import AppNavigationItem from './AppNavigationItem.vue'

defineProps<{ active: string }>()
defineEmits<{ create: [] }>()
const { t } = useI18n()

const items = computed<Array<{ icon: Component; key: string; label: string; to: string }>>(() => [
  { icon: Icons.other.HomeTab, key: 'home', label: t('navigation.home'), to: '/main/home' },
  {
    icon: Icons.other.SubscribeTab,
    key: 'subscribe',
    label: t('navigation.subscribe'),
    to: '/main/subscribe',
  },
  {
    icon: Icons.material.ShoppingBagOutlined,
    key: 'plugin',
    label: t('navigation.plugin'),
    to: '/main/plugin',
  },
  { icon: Icons.other.UserTab, key: 'user', label: t('navigation.user'), to: '/main/user' },
])
</script>

<template>
  <nav class="app-navigation" :aria-label="t('navigation.aria.main')">
    <div class="app-navigation__brand" aria-hidden="true">Δ</div>
    <AppNavigationItem
      v-for="item in items"
      :key="item.key"
      :active="active === item.key"
      :icon="item.icon"
      :label="item.label"
      :to="item.to"
      :class="`app-navigation__item--${item.key}`"
    />
    <button
      class="app-navigation__create"
      type="button"
      :aria-label="t('navigation.aria.createFork')"
      @click="$emit('create')"
    >
      <NIcon size="36"><Icons.material.PlusFilled /></NIcon>
    </button>
  </nav>
</template>

<style scoped>
.app-navigation {
  position: fixed;
  z-index: 100;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  height: calc(var(--dc-navigation-height) + var(--safe-area-inset-bottom));
  padding: 5px max(8px, var(--safe-area-inset-right)) var(--safe-area-inset-bottom)
    max(8px, var(--safe-area-inset-left));
  border-top: 1px solid var(--dc-border);
  background: color-mix(in srgb, var(--dc-surface) 94%, transparent);
  box-shadow: 0 -8px 30px rgb(0 0 0 / 8%);
  backdrop-filter: blur(22px) saturate(140%);
}

.app-navigation__brand {
  display: none;
}

.app-navigation :deep(.app-navigation-item) {
  grid-row: 1;
}

.app-navigation__item--home {
  grid-column: 1;
}

.app-navigation__item--subscribe {
  grid-column: 2;
}

.app-navigation__item--plugin {
  grid-column: 4;
}

.app-navigation__item--user {
  grid-column: 5;
}

.app-navigation__create {
  display: grid;
  grid-row: 1;
  grid-column: 3;
  width: 58px;
  height: 58px;
  margin: -10px auto 0;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 21px;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--p-color) 84%, white),
    var(--p-color)
  );
  box-shadow:
    0 10px 24px color-mix(in srgb, var(--p-color) 32%, transparent),
    inset 0 1px 0 rgb(255 255 255 / 28%);
  color: white;
  cursor: pointer;
  transition:
    transform 160ms ease,
    filter 160ms ease;
}

.app-navigation__create:hover {
  filter: brightness(1.04);
}

.app-navigation__create:active {
  transform: scale(0.94);
}

.app-navigation__create:focus-visible {
  outline: 2px solid var(--p-color);
  outline-offset: 3px;
}

@media (min-width: 960px) {
  .app-navigation {
    position: relative;
    grid-template-columns: 1fr;
    grid-template-rows: 64px repeat(2, 64px) 72px repeat(2, 64px) 1fr;
    width: var(--dc-desktop-navigation-width);
    height: 100%;
    padding: 12px 10px;
    border-top: 0;
    border-right: 1px solid var(--dc-border);
  }

  .app-navigation__brand {
    display: grid;
    width: 44px;
    height: 44px;
    margin: 0 auto;
    place-items: center;
    border-radius: 15px;
    background: var(--p-color);
    color: white;
    font-size: 24px;
    font-weight: 800;
  }

  .app-navigation :deep(.app-navigation-item) {
    grid-column: 1;
  }

  .app-navigation__item--home {
    grid-row: 2;
  }

  .app-navigation__item--subscribe {
    grid-row: 3;
  }

  .app-navigation__item--plugin {
    grid-row: 5;
  }

  .app-navigation__item--user {
    grid-row: 6;
  }

  .app-navigation__create {
    grid-row: 4;
    grid-column: 1;
    width: 52px;
    height: 52px;
    margin: auto;
    border-radius: 18px;
  }
}
</style>