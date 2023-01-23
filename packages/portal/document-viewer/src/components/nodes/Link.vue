<template>
  <a
    :href="href"
    rel="noreferrer noopener nofollow"
    :title="title"
  >
    <slot />
  </a>
</template>

<script setup lang="ts">
defineProps({
  href: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
a {
  color: var(--document-viewer-link-color, #1155cb);
  text-decoration: none;
}

a:hover {
  color: var(--document-viewer-link-hover-color, #5e8adc);
  text-decoration: underline;
}
</style>
