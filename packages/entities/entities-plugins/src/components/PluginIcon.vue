<template>
  <img
    v-if="src"
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

const src = ref(composables.getPluginIconURL(props.name))

const onError = (): void => {
  src.value = ''
}
</script>
