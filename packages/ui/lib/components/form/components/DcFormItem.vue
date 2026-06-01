<script setup lang="ts" generic="T extends FormSingleConfigure">
import type { FormSingleConfigure, FormSingleResult } from '@delta-comic/model'
import { NFormItem } from 'naive-ui'
import type { ModelRef } from 'vue'

import DcFormCheckbox from './DcFormCheckbox.vue'
import DcFormDate from './DcFormDate.vue'
import DcFormDateRange from './DcFormDateRange.vue'
import DcFormNumber from './DcFormNumber.vue'
import DcFormPairs from './DcFormPairs.vue'
import DcFormRadio from './DcFormRadio.vue'
import DcFormString from './DcFormString.vue'
import DcFormSwitch from './DcFormSwitch.vue'

defineProps<{ config: T; path: string }>()
const store: ModelRef<any> = defineModel<FormSingleResult<T>>({ required: true })
</script>

<template>
  <NFormItem :label="config.info" :path :required="config.required ?? true">
    <DcFormSwitch :config v-model="store" v-if="config.type == 'switch'" />
    <DcFormString :config v-model="store" v-else-if="config.type == 'string'" />
    <DcFormNumber :config v-model="store" v-else-if="config.type == 'number'" />
    <DcFormRadio :config v-model="store" v-else-if="config.type == 'radio'" />
    <DcFormCheckbox :config v-model="store" v-else-if="config.type == 'checkbox'" />
    <DcFormDate :config v-model="store" v-else-if="config.type == 'date'" />
    <DcFormDateRange :config v-model="store" v-else-if="config.type == 'dateRange'" />
    <DcFormPairs :config v-model="store" v-else-if="config.type == 'pairs'" />
  </NFormItem>
</template>