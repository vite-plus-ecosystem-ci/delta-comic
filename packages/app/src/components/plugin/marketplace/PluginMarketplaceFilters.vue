<script setup lang="ts">
import { NButton, NInput, NSelect, NTag } from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { PluginMarketplaceFilter } from '@/features/pluginMarketplace/model'

defineProps<{ loading: boolean; stale: boolean; total: number }>()
const emit = defineEmits<{ refresh: [] }>()
const query = defineModel<string>('query', { required: true })
const filter = defineModel<PluginMarketplaceFilter>('filter', { required: true })
const { t } = useI18n()

const filterOptions = computed(() => [
  { label: t('plugin.market.filters.all'), value: 'all' },
  { label: t('plugin.market.filters.available'), value: 'available' },
  { label: t('plugin.market.filters.installed'), value: 'installed' },
  { label: t('plugin.market.filters.updates'), value: 'updates' },
])
</script>

<template>
  <section class="marketplace-filters" :aria-label="t('plugin.market.filters.label')">
    <div class="marketplace-filters__heading">
      <div>
        <h1 class="marketplace-filters__title">{{ t('plugin.market.title') }}</h1>
        <p class="marketplace-filters__subtitle">
          {{ t('plugin.market.loadedCount', { count: total }) }}
        </p>
      </div>
      <NTag v-if="stale" type="warning" round>
        {{ t('plugin.market.stale') }}
      </NTag>
    </div>
    <div class="marketplace-filters__controls">
      <NInput
        v-model:value="query"
        clearable
        :placeholder="t('plugin.market.searchPlaceholder')"
        class="marketplace-filters__search"
      />
      <NSelect
        v-model:value="filter"
        :options="filterOptions"
        class="marketplace-filters__select"
      />
      <NButton secondary type="primary" :loading="loading" @click="emit('refresh')">
        {{ t('plugin.market.actions.refresh') }}
      </NButton>
    </div>
  </section>
</template>

<style scoped>
.marketplace-filters {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--dc-border);
  background: var(--dc-surface);
}

.marketplace-filters__heading,
.marketplace-filters__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.marketplace-filters__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
}

.marketplace-filters__subtitle {
  margin: 2px 0 0;
  color: var(--nui-text-color-3);
  font-size: 0.82rem;
}

.marketplace-filters__search {
  min-width: 180px;
  flex: 1;
}

.marketplace-filters__select {
  width: 150px;
}

@media (max-width: 640px) {
  .marketplace-filters__controls {
    flex-wrap: wrap;
  }

  .marketplace-filters__search {
    flex-basis: 100%;
  }

  .marketplace-filters__select {
    min-width: 0;
    flex: 1;
  }
}
</style>