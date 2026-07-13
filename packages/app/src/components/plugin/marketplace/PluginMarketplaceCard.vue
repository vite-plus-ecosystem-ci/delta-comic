<script setup lang="ts">
import { NButton, NCard, NTag } from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { PluginMarketplaceItem } from '@/features/pluginMarketplace/model'

const props = defineProps<{ installing: boolean; item: PluginMarketplaceItem }>()
const emit = defineEmits<{ details: []; install: [] }>()
const { t } = useI18n()

const displayName = computed(
  () =>
    props.item.manifest?.name.display ??
    props.item.listing.repository?.name ??
    props.item.listing.id,
)
const version = computed(
  () => props.item.manifest?.version.plugin ?? props.item.listing.release?.version,
)
const actionDisabled = computed(
  () =>
    props.item.compatibility === 'incompatible' ||
    Boolean(props.item.installed && !props.item.updateAvailable),
)
const actionLabel = computed(() => {
  if (props.item.updateAvailable) return t('plugin.market.actions.update')
  if (props.item.installed) return t('plugin.market.states.installed')
  return t('plugin.market.actions.install')
})
const compatibility = computed(() => ({
  label: t(`plugin.market.compatibility.${props.item.compatibility}`),
  type:
    props.item.compatibility === 'compatible'
      ? ('success' as const)
      : props.item.compatibility === 'incompatible'
        ? ('error' as const)
        : ('default' as const),
}))
</script>

<template>
  <NCard class="marketplace-card" content-class="marketplace-card__content">
    <template #header>
      <div class="marketplace-card__header">
        <div class="marketplace-card__identity">
          <span class="marketplace-card__monogram" aria-hidden="true">
            {{ displayName.slice(0, 1).toLocaleUpperCase() }}
          </span>
          <div class="marketplace-card__name-block">
            <strong class="marketplace-card__name">{{ displayName }}</strong>
            <span class="marketplace-card__id">ap:{{ item.listing.id }}</span>
          </div>
        </div>
        <NTag size="small" :type="compatibility.type" round>{{ compatibility.label }}</NTag>
      </div>
    </template>

    <p class="marketplace-card__description">
      {{ item.manifest?.description ?? t('plugin.market.noDescription') }}
    </p>
    <div class="marketplace-card__meta">
      <span>{{ t('plugin.market.authors', { authors: item.listing.authors.join(', ') }) }}</span>
      <span v-if="version">{{ t('plugin.market.version', { version }) }}</span>
    </div>
    <NTag v-if="item.updateAvailable" size="small" type="info" round>
      {{ t('plugin.market.states.updateAvailable') }}
    </NTag>

    <template #action>
      <div class="marketplace-card__actions">
        <NButton secondary @click="emit('details')">
          {{ t('plugin.market.actions.details') }}
        </NButton>
        <NButton
          type="primary"
          :disabled="actionDisabled"
          :loading="installing"
          @click="emit('install')"
        >
          {{ actionLabel }}
        </NButton>
      </div>
    </template>
  </NCard>
</template>

<style scoped>
.marketplace-card {
  height: 100%;
  border: 1px solid color-mix(in srgb, var(--nui-primary-color) 14%, var(--dc-border));
  background: color-mix(in srgb, var(--dc-surface) 96%, var(--nui-primary-color));
}

.marketplace-card__header,
.marketplace-card__identity,
.marketplace-card__actions,
.marketplace-card__meta {
  display: flex;
  align-items: center;
}

.marketplace-card__header,
.marketplace-card__actions {
  justify-content: space-between;
  gap: 10px;
}

.marketplace-card__identity {
  min-width: 0;
  gap: 10px;
}

.marketplace-card__monogram {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--nui-primary-color) 16%, transparent);
  color: var(--nui-primary-color);
  font-weight: 800;
}

.marketplace-card__name-block {
  display: grid;
  min-width: 0;
}

.marketplace-card__name,
.marketplace-card__id {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.marketplace-card__id,
.marketplace-card__meta {
  color: var(--nui-text-color-3);
  font-size: 0.75rem;
}

.marketplace-card__description {
  display: -webkit-box;
  min-height: 3em;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: var(--nui-text-color-2);
}

.marketplace-card__meta {
  flex-wrap: wrap;
  gap: 4px 12px;
  margin: 10px 0;
}
</style>