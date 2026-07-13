<script setup lang="ts">
import { NAlert, NButton, NEmpty, NSpin } from 'naive-ui'
import { useI18n } from 'vue-i18n'

import type { PluginMarketplaceItem } from '@/features/pluginMarketplace/model'

defineProps<{
  error?: Error
  hasMore: boolean
  installingIds: ReadonlySet<string>
  items: PluginMarketplaceItem[]
  loading: boolean
  loadingMore: boolean
}>()
const emit = defineEmits<{
  details: [item: PluginMarketplaceItem]
  install: [item: PluginMarketplaceItem]
  loadMore: []
  retry: []
}>()
const { t } = useI18n()
</script>

<template>
  <NSpin :show="loading" class="marketplace-list__spin">
    <div class="marketplace-list">
      <NAlert v-if="error" type="error" :title="t('plugin.market.errors.title')">
        <div class="marketplace-list__error">
          <span>{{ error.message }}</span>
          <NButton size="small" secondary type="error" @click="emit('retry')">
            {{ t('plugin.market.actions.retry') }}
          </NButton>
        </div>
      </NAlert>

      <NEmpty
        v-if="!loading && items.length === 0 && !error"
        :description="t('plugin.market.empty')"
        class="marketplace-list__empty"
      />

      <TransitionGroup v-else name="marketplace-card" tag="div" class="marketplace-list__grid">
        <PluginMarketplaceCard
          v-for="item in items"
          :key="item.listing.id"
          :item="item"
          :installing="installingIds.has(item.listing.id)"
          @details="emit('details', item)"
          @install="emit('install', item)"
        />
      </TransitionGroup>

      <div v-if="items.length > 0" class="marketplace-list__footer">
        <NButton
          v-if="hasMore"
          secondary
          type="primary"
          :loading="loadingMore"
          @click="emit('loadMore')"
        >
          {{ t('plugin.market.actions.loadMore') }}
        </NButton>
        <span v-else class="marketplace-list__end">{{ t('plugin.market.end') }}</span>
      </div>
    </div>
  </NSpin>
</template>

<style scoped>
.marketplace-list__spin {
  min-height: 100%;
}

.marketplace-list {
  display: grid;
  gap: 14px;
  padding: 14px;
}

.marketplace-list__error,
.marketplace-list__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.marketplace-list__empty {
  min-height: 260px;
  justify-content: center;
}

.marketplace-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 12px;
}

.marketplace-list__footer {
  justify-content: center;
  padding: 8px 0 18px;
}

.marketplace-list__end {
  color: var(--nui-text-color-3);
  font-size: 0.8rem;
}

.marketplace-card-enter-active,
.marketplace-card-leave-active {
  transition: 160ms ease;
}

.marketplace-card-enter-from,
.marketplace-card-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>