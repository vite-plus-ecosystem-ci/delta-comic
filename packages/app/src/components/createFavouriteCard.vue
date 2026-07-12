<script setup lang="ts">
import { FavouriteDB } from '@delta-comic/db'
import {
  NButton,
  NDrawer,
  NForm,
  NFormItem,
  NInput,
  NSwitch,
  type FormInst,
  type FormRules,
  useMessage,
} from 'naive-ui'
import { reactive, shallowRef, useTemplateRef } from 'vue'

interface FavouriteFormData {
  title: string
  description: string
  isPrivate: boolean
}

const createEmptyFormData = (): FavouriteFormData => ({
  title: '',
  description: '',
  isPrivate: true,
})

const show = shallowRef(false)
const submitting = shallowRef(false)
const $message = useMessage()
const formRef = useTemplateRef<FormInst>('form')
const formData = reactive(createEmptyFormData())
const formRules: FormRules = {
  title: [{ required: true, message: '请填写名称', trigger: ['input', 'blur'] }],
}

const resetForm = (value: Partial<FavouriteFormData> = {}) => {
  Object.assign(formData, createEmptyFormData(), value)
  formRef.value?.restoreValidation()
}

const create = (defaultValue: Partial<FavouriteFormData> = {}) => {
  if (show.value) {
    $message.warning('正在创建中')
    return
  }
  resetForm(defaultValue)
  show.value = true
}

const cancel = () => {
  resetForm()
  show.value = false
}

const { createCard } = FavouriteDB.useCreateCard()

const onSubmit = async () => {
  if (submitting.value) return
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    await createCard({
      card: {
        title: formData.title,
        description: formData.description,
        private: formData.isPrivate,
        createAt: Date.now(),
      },
    })
    cancel()
  } finally {
    submitting.value = false
  }
}

defineExpose({ create })
</script>

<template>
  <NDrawer v-model:show="show" placement="bottom" @after-leave="cancel">
    <div class="my-2 flex h-8 w-full items-center pl-5 font-semibold">创建收藏夹</div>
    <form @submit.prevent="onSubmit">
      <DcCellGroup inset>
        <NForm
          ref="form"
          :model="formData"
          :rules="formRules"
          label-placement="left"
          label-width="70"
          class="px-4 pt-4"
        >
          <NFormItem label="名称" path="title">
            <NInput v-model:value="formData.title" placeholder="名称" />
          </NFormItem>
          <NFormItem label="简介" path="description">
            <NInput
              v-model:value="formData.description"
              type="textarea"
              placeholder="可选的"
              :autosize="{ minRows: 2, maxRows: 5 }"
            />
          </NFormItem>
          <NFormItem label="私密的" path="isPrivate">
            <NSwitch v-model:value="formData.isPrivate" />
          </NFormItem>
        </NForm>
      </DcCellGroup>
      <NButton
        class="m-5! w-30!"
        strong
        secondary
        attr-type="submit"
        type="primary"
        size="large"
        :loading="submitting"
      >
        提交
      </NButton>
    </form>
  </NDrawer>
</template>