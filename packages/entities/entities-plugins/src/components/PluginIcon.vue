<template>
  <img
    ref="img"
    :alt="alt"
    :src="iconSrc || defaultIcon"
    :width="size"
    @error="onError"
  >
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import composables from '../composables'

const defaultIcon = new URL('../assets/images/plugin-icons/missing.png', import.meta.url).href

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    default: 32,
    required: false,
  },
  alt: {
    type: String,
    default: '',
    required: false,
  },
})

const img = ref<HTMLImageElement>()
const iconSrc = computed((): string => props.name ? composables.getPluginIconURL(props.name) : '')

const onError = () => {
  if (img.value) {
    img.value.src = defaultIcon
  }
}
</script>
