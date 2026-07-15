<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import HotSearchPanel from '@/components/search/landing/HotSearchPanel.vue'
import SearchHistoryPanel from '@/components/search/landing/SearchHistoryPanel.vue'
import SearchLandingForm from '@/components/search/landing/SearchLandingForm.vue'
import { useSearchLanding } from '@/features/search/useSearchLanding'

const router = useRouter()
const { t } = useI18n()
const {
  clearHistory,
  history,
  hotSearchSections,
  isLoadingHotSearch,
  query,
  selectHotSearchItem,
  submit,
} = useSearchLanding({ onMissingTarget: () => window.$message.error(t('search.errors.noSource')) })
</script>

<template>
  <div class="search-page">
    <SearchLandingForm v-model="query" @back="router.back()" @submit="submit()" />
    <main class="search-page__content">
      <HotSearchPanel
        :loading="isLoadingHotSearch"
        :sections="hotSearchSections"
        @select="selectHotSearchItem"
      />
      <SearchHistoryPanel :items="history" @clear="clearHistory" @select="value => submit(value)" />
    </main>
  </div>
</template>

<style scoped>
.search-page {
  height: 100%;
  overflow-y: auto;
  background: var(--dc-background);
}

.search-page__content {
  display: grid;
  width: min(100%, 960px);
  gap: 32px;
  margin-inline: auto;
  padding: 24px var(--dc-content-padding) 48px;
}
</style>