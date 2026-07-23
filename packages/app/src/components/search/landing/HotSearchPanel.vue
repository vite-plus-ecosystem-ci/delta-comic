<script setup lang="ts">
import type { Search } from '@delta-comic/plugin'
import { useI18n } from 'vue-i18n'

import type { ResolvedHotSearchSection } from '@/features/search/useSearchLanding'

defineProps<{ loading: boolean; sections: readonly ResolvedHotSearchSection[] }>()
const emit = defineEmits<{
  select: [section: ResolvedHotSearchSection, item: Search.HotSearchItem]
}>()
const { t } = useI18n()
</script>

<template>
  <section class="hot-search" :aria-busy="loading">
    <div v-if="loading && sections.length === 0" class="hot-search__loading">
      <NSkeleton v-for="index in 6" :key="index" height="44px" :sharp="false" />
    </div>
    <NEmpty
      v-else-if="sections.length === 0"
      class="hot-search__empty"
      :description="t('search.hot.empty')"
    />
    <template v-else>
      <section v-for="section in sections" :key="section.id" class="hot-search__section">
        <h2 class="hot-search__title">{{ section.title }}</h2>
        <div class="hot-search__grid">
          <button
            v-for="item in section.items"
            :key="`${item.value ?? item.text}:${item.text}`"
            type="button"
            class="dc-interactive hot-search__item"
            @click="emit('select', section, item)"
          >
            <span class="dc-ellipsis">{{ item.text }}</span>
            <span
              v-if="item.badge"
              class="hot-search__badge"
              :class="`hot-search__badge--${item.badge.tone ?? 'accent'}`"
            >
              {{ item.badge.text }}
            </span>
          </button>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.hot-search {
  display: grid;
  gap: 24px;
}

.hot-search__section {
  display: grid;
  gap: 10px;
}

.hot-search__title {
  margin: 0;
  color: var(--dc-text);
  font-size: 20px;
  font-weight: 700;
}

.hot-search__grid,
.hot-search__loading {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
}

.hot-search__item {
  display: flex;
  min-width: 0;
  height: 44px;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
  border: 0;
  background: transparent;
  color: var(--dc-text);
  font: inherit;
  font-size: 16px;
  text-align: left;
}

.hot-search__badge {
  flex: none;
  padding: 1px 5px;
  border-radius: 5px;
  color: white;
  font-size: 11px;
}

.hot-search__badge--accent {
  background: var(--p-color);
}

.hot-search__badge--warning {
  background: #f0a020;
}

.hot-search__empty {
  padding-block: 36px 12px;
}

@media (min-width: 720px) {
  .hot-search__grid,
  .hot-search__loading {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>