<script setup lang="ts">
import { marketplaceListingSource } from '@delta-comic/plugin'
import { NAlert, NButton, NModal, NTag } from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { PluginMarketplaceItem } from '@/features/pluginMarketplace/model'

const props = defineProps<{ item?: PluginMarketplaceItem }>()
const emit = defineEmits<{ install: []; openSource: [url: string] }>()
const show = defineModel<boolean>('show', { required: true })
const { locale, t } = useI18n()

const title = computed(
  () =>
    props.item?.manifest?.name.display ??
    props.item?.listing.repository?.name ??
    props.item?.listing.id,
)
const source = computed(() => (props.item ? marketplaceListingSource(props.item.listing) : ''))
const publishedAt = computed(() => {
  const value = props.item?.listing.release?.publishedAt
  return value
    ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(value))
    : undefined
})
const canInstall = computed(
  () =>
    props.item?.compatibility !== 'incompatible' &&
    (!props.item?.installed || props.item.updateAvailable),
)
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    :title="title"
    class="marketplace-details"
    :bordered="false"
  >
    <div v-if="item" class="marketplace-details__content">
      <p class="marketplace-details__description">
        {{ item.manifest?.description ?? t('plugin.market.noDescription') }}
      </p>
      <dl class="marketplace-details__facts">
        <div>
          <dt>{{ t('plugin.market.details.installId') }}</dt>
          <dd>
            <code>ap:{{ item.listing.id }}</code>
          </dd>
        </div>
        <div>
          <dt>{{ t('plugin.market.details.authors') }}</dt>
          <dd>{{ item.listing.authors.join(', ') }}</dd>
        </div>
        <div v-if="item.listing.release">
          <dt>{{ t('plugin.market.details.release') }}</dt>
          <dd>{{ item.listing.release.version }}</dd>
        </div>
        <div v-if="publishedAt">
          <dt>{{ t('plugin.market.details.publishedAt') }}</dt>
          <dd>{{ publishedAt }}</dd>
        </div>
        <div v-if="item.manifest">
          <dt>{{ t('plugin.market.details.supportCore') }}</dt>
          <dd>{{ item.manifest.version.supportCore }}</dd>
        </div>
        <div>
          <dt>{{ t('plugin.market.details.manifest') }}</dt>
          <dd>
            <NTag size="small" :type="item.manifest ? 'success' : 'default'">
              {{
                item.manifest
                  ? t('plugin.market.details.manifestVerified')
                  : t('plugin.market.details.manifestFallback')
              }}
            </NTag>
          </dd>
        </div>
      </dl>
      <NAlert v-if="item.manifestError" type="warning" :title="t('plugin.market.errors.manifest')">
        {{ item.manifestError }}
      </NAlert>
      <NAlert type="info" :title="t('plugin.market.security.title')">
        {{ t('plugin.market.security.notice') }}
      </NAlert>
      <div class="marketplace-details__actions">
        <NButton secondary @click="emit('openSource', source)">
          {{ t('plugin.market.actions.source') }}
        </NButton>
        <NButton type="primary" :disabled="!canInstall" @click="emit('install')">
          {{
            item.updateAvailable
              ? t('plugin.market.actions.update')
              : t('plugin.market.actions.install')
          }}
        </NButton>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.marketplace-details {
  width: min(92vw, 620px);
}

.marketplace-details__content {
  display: grid;
  gap: 16px;
}

.marketplace-details__description {
  margin: 0;
  color: var(--nui-text-color-2);
}

.marketplace-details__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.marketplace-details__facts > div {
  min-width: 0;
  padding: 10px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--dc-surface) 88%, var(--nui-primary-color));
}

.marketplace-details__facts dt {
  color: var(--nui-text-color-3);
  font-size: 0.75rem;
}

.marketplace-details__facts dd {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}

.marketplace-details__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 520px) {
  .marketplace-details__facts {
    grid-template-columns: 1fr;
  }
}
</style>