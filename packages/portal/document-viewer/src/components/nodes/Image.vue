<template>
  <img
    :alt="alt"
    :src="url"
    :title="title"
  >
</template>

<script setup lang="ts">
defineProps({
  url: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
img {
  display: inline !important;
}
</style>