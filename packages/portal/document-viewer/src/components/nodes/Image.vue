<template>
  <figure>
    <img
      :alt="alt"
      :src="url"
      :title="title"
    >
    <figcaption>
      <slot />
    </figcaption>
  </figure>
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
