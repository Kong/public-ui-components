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

<style scoped lang="scss">
a {
  color: var(--document-viewer-link-color, $kui-color-text-primary);
  text-decoration: none;
}

a:hover {
  color: var(--document-viewer-link-hover-color, $kui-color-text-primary-strong);
  text-decoration: underline;
}
</style>
