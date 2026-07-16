<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ items: readonly string[] }>()
const emit = defineEmits<{ clear: []; select: [value: string] }>()
const { t } = useI18n()
</script>

<template>
  <section class="search-history">
    <header class="search-history__header">
      <h2 class="search-history__title">{{ t('search.history.title') }}</h2>
      <NButton
        v-if="items.length > 0"
        text
        size="small"
        :aria-label="t('search.actions.clearHistory')"
        @click="emit('clear')"
      >
        {{ t('search.actions.clearHistory') }}
      </NButton>
    </header>
    <div v-if="items.length > 0" class="search-history__items">
      <button
        v-for="item in items"
        :key="item"
        type="button"
        class="dc-interactive dc-ellipsis search-history__item"
        @click="emit('select', item)"
      >
        {{ item }}
      </button>
    </div>
    <p v-else class="search-history__empty">{{ t('search.history.empty') }}</p>
  </section>
</template>

<style scoped>
.search-history {
  display: grid;
  gap: 14px;
}

.search-history__header {
  display: flex;
  min-height: 32px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.search-history__title {
  margin: 0;
  color: var(--dc-text);
  font-size: 20px;
  font-weight: 700;
}

.search-history__items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-history__item {
  max-width: min(100%, 240px);
  padding: 8px 14px;
  border: 0;
  border-radius: 7px;
  background: var(--dc-gray-1);
  color: var(--dc-text);
  font: inherit;
}

.search-history__empty {
  margin: 0;
  color: var(--dc-text-tertiary);
}
</style>