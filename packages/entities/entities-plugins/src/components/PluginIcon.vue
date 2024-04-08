<template>
  <img
    ref="img"
    :alt="alt"
    :src="iconSrc"
    :width="size"
    @error="onError"
  >
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getPluginIconURL } from '../definitions/metadata'

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
const iconSrc = getPluginIconURL(props.name)

const onError = () => {
  const defaultIcon = new URL('../assets/images/plugin-icons/missing.png', import.meta.url).href // ? only need to compute it when plugin URL is invalid
  if (img.value) {
    img.value.src = defaultIcon
  }
}
</script>
