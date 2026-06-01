<script setup lang="ts">
import { useTemp } from '@delta-comic/core'
import { uni } from '@delta-comic/model'
import { computedAsync } from '@vueuse/core'
import { isString } from 'es-toolkit/compat'
import { type ImageProps, NImage } from 'naive-ui'
import {
  type ImgHTMLAttributes,
  type StyleValue,
  computed,
  nextTick,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue'

import { cn } from '@/utils'

import DcLoading from './DcLoading.vue'
import DcVar from './DcVar.vue'
const $props = withDefaults(
  defineProps<{
    src?: uni.image.Image_
    alt?: string
    previewable?: boolean
    retryMax?: number
    round?: boolean
    fit?: ImageProps['objectFit']
    class?: any
    hideLoading?: boolean
    hideError?: boolean
    inline?: boolean
    style?: StyleValue
    imgProp?: ImgHTMLAttributes
    cacheList?: { loaded: Set<string>; error: Set<string> }
    fetchpriority?: 'high' | 'low' | 'auto'
    fallback?: uni.image.Image_
  }>(),
  { fetchpriority: 'auto', retryMax: 4 },
)
const src = computedAsync(async () => {
  try {
    if (!$props.src) return ''
    if (isString($props.src)) return $props.src
    return await $props.src.getUrl()
  } catch (error) {
    console.warn(error)
  }
  return ''
}, '')

const $emit = defineEmits<{ load: any[]; click: [e: Event]; error: [] }>()

let reloadTime = 0
let isForkEmpty = false
const handleFail = async () => {
  if (isForkEmpty) {
    images.error.add(src.value)
    return $emit('error')
  }
  reloadTime++
  show.value = false
  if (reloadTime > $props.retryMax) {
    if (!uni.resource.Resource.is($props.src)) {
      isForkEmpty = true
      handleFail()
      return
    }
    if (!$props.src.localChangeFork()) {
      isForkEmpty = true
      handleFail()
      return
    }
  }
  await nextTick()
  show.value = true
}

const temp = useTemp().$apply('imageState', () => ({
  loaded: new Set<string>(),
  error: new Set<string>(),
}))
const images = $props.cacheList ?? temp
const show = shallowRef(true)
const beginReload = () => {
  isForkEmpty = false
  reloadTime = 0
  handleFail()
}
watch(src, beginReload)
defineSlots<{ loading?(): any; fail?(): any }>()
const isLoaded = computed(() => images.loaded.has(src.value))
const fallbackSrc = computedAsync(async () => {
  try {
    if (!$props.fallback) return ''
    if (isString($props.fallback)) return $props.fallback
    return await $props.fallback.getUrl()
  } catch (error) {
    console.error(error)
  }
  return ''
}, '')

const handleClickImage = (e: Event) => $emit('click', e)

const handleImageLoad = (...e: Event[]) => {
  $emit('load', ...e)
  images.loaded.add(src.value)
}
const img = useTemplateRef('img')
defineExpose({ isLoaded, imageEl: computed(() => img.value?.imageRef), imageIns: img })
const NImg = window.$api.NImage as typeof NImage
</script>

<template>
  <DcVar
    :value="cn(round && 'rounded-full!', inline ? 'inline-flex' : 'flex', $props.class)"
    v-slot="{ value: cls }"
  >
    <NImg
      :="$props"
      @error="handleFail"
      :objectFit="fit"
      :previewDisabled="!previewable"
      :alt
      ref="img"
      :imgProps="{
        ...imgProp,
        class: cn(imgProp?.class, 'w-full'),
        fetchpriority: $props.fetchpriority,
      }"
      :class="cls"
      :style
      v-show="!images.error.has(src) && images.loaded.has(src)"
      v-if="show"
      @load="handleImageLoad"
      @click="handleClickImage"
      :src
    >
    </NImg>
    <div
      v-if="!images.loaded.has(src) && !images.error.has(src) && !hideLoading"
      :class="cn('items-center justify-center', cls)"
      :style
      @click="$emit('click', $event)"
    >
      <slot name="loading" v-if="$slots.loading"></slot>
      <DcLoading v-else />
    </div>
    <template v-if="images.error.has(src) && !hideError">
      <NImg
        v-if="fallback"
        :="$props"
        @error="handleFail"
        :objectFit="fit"
        previewDisabled
        :alt
        :imgProps="{
          ...imgProp,
          class: cn(imgProp?.class, 'w-full'),
          fetchpriority: $props.fetchpriority,
        }"
        :class="cls"
        :style
        :src="fallbackSrc"
      />
      <div
        v-else
        @click.stop="
          () => {
            images.error.delete(src)
            beginReload()
          }
        "
        :class="cn('flex-col items-center justify-center', cls)"
      >
        <slot name="loading" v-if="$slots.loading"></slot>
        <template v-else>
          <NIcon size="2.5rem" color="var(--van-text-color-2)">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 32 32"
            >
              <path
                d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 26a12 12 0 1 1 12-12a12 12 0 0 1-12 12z"
                fill="currentColor"
              ></path>
              <path d="M15 8h2v11h-2z" fill="currentColor"></path>
              <path
                d="M16 22a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 16 22z"
                fill="currentColor"
              ></path>
            </svg>
          </NIcon>
          <div class="text-sm text-(--van-text-color-2)">点击重试</div>
        </template>
      </div>
    </template>
  </DcVar>
</template>