<template>
  <a
    class="noZensmooth"
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
/* stylelint-disable @kong/design-tokens/token-var-usage */
a {
  color: var(--kong-ui-document-viewer-link-color, $kui-color-text-primary);
  text-decoration: none;
}

a:hover {
  color: var(--kong-ui-document-viewer-link-hover-color, $kui-color-text-primary-strong);
  text-decoration: underline;
}
</style>
