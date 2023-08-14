<template>
  <img
    ref="img"
    :alt="alt"
    :src="composables.getPluginIconURL(name)"
    :width="size"
    @error="onError"
  >
</template>

<script setup lang="ts">
import { ref } from 'vue'
import composables from '../composables'

const defaultIcon = new URL('../assets/images/plugin-icons/missing.png', import.meta.url).href

defineProps({
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

const onError = () => {
  if (img.value) {
    img.value.src = defaultIcon
  }
}
</script>
