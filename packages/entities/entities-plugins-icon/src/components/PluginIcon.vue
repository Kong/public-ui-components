<template>
  <img
    ref="img"
    :alt="alt"
    :height="size"
    :src="iconSrc"
    :width="size"
    @error="onError"
  >
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { getPluginIconURL } from '../definitions/metadata'

export type Props = {
  name: string
  size?: number
  alt?: string
}

const {
  name,
  size = 32,
  alt = '',
} = defineProps<Props>()

const img = useTemplateRef('img')

const iconSrc = computed(() => getPluginIconURL(name))

const onError = () => {
  const defaultIcon = new URL('../assets/missing.png', import.meta.url).href // only need to compute it when icon URL is invalid
  if (img.value && img.value.src !== defaultIcon) {
    img.value.src = defaultIcon
  }
}
</script>
