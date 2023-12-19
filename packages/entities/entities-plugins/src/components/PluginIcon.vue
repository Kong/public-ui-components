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
import { ref } from 'vue'
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

const defaultIcon = ref('')
const src = ref('')
const img = ref<HTMLImageElement>()

try {
  defaultIcon.value = new URL('../assets/images/plugin-icons/missing.png', import.meta.url).href
} catch (err) {
  defaultIcon.value = ''
}

try {
  src.value = composables.getPluginIconURL(props.name)
} catch (err) {
  src.value = defaultIcon.value
}

const onError = (): void => {
  if (img.value && defaultIcon.value) {
    img.value.src = defaultIcon.value
  }
}
</script>
