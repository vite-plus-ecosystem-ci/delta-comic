<script setup lang="ts">
import { NButton, NIcon, NInput } from 'naive-ui'
import { onMounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { Icons } from '@/icons'

const query = defineModel<string>({ required: true })
const emit = defineEmits<{ back: []; submit: [] }>()
const { t } = useI18n()
const input = useTemplateRef<InstanceType<typeof NInput>>('input')

onMounted(() => input.value?.focus())
</script>

<template>
  <form class="search-form" action="/" @submit.prevent="emit('submit')">
    <NButton
      class="search-form__back"
      text
      circle
      attr-type="button"
      :aria-label="t('common.actions.back')"
      @click="emit('back')"
    >
      <span aria-hidden="true">‹</span>
    </NButton>
    <NInput
      ref="input"
      v-model:value="query"
      class="search-form__input"
      round
      clearable
      :placeholder="t('search.placeholder.full')"
      :input-props="{ autocomplete: 'off', enterkeyhint: 'search', spellcheck: false }"
    >
      <template #prefix>
        <NIcon size="1.35rem"><Icons.material.SearchFilled /></NIcon>
      </template>
    </NInput>
    <NButton class="search-form__submit" text type="primary" attr-type="submit">
      {{ t('search.actions.search') }}
    </NButton>
  </form>
</template>

<style scoped>
.search-form {
  position: sticky;
  z-index: 10;
  top: 0;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: calc(var(--dc-page-header-height) + var(--safe-area-inset-top));
  padding: var(--safe-area-inset-top) 12px 0;
  border-bottom: 1px solid var(--dc-border);
  background: color-mix(in srgb, var(--dc-surface) 94%, transparent);
  backdrop-filter: blur(16px);
}

.search-form__back {
  font-size: 36px;
  line-height: 1;
}

.search-form__input {
  min-width: 0;
}

.search-form__submit {
  font-size: 16px;
}
</style>