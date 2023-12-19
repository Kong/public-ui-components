<template>
  <img
    v-if="src"
    ref="img"
    :alt="alt"
    :src="src"
    :width="size"
    @error="onError"
  >
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import composables from '../composables'

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

const defaultIcon = computed((): string => {
  try {
    return new URL('../assets/images/plugin-icons/missing.png', import.meta.url).href
  } catch (err) {
    return ''
  }
})
const img = ref<HTMLImageElement>()
const src = computed((): string => {
  try {
    return composables.getPluginIconURL(props.name)
  } catch (err) {
    return defaultIcon.value
  }
})

const onError = (): void => {
  if (img.value && defaultIcon.value) {
    img.value.src = defaultIcon.value
  }
}
</script>
