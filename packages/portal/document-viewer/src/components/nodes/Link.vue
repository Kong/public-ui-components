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
a {
  color: var(--kui-color-text-primary, $kui-color-text-primary);
  text-decoration: none;
}

a:hover {
  color: var(--kui-color-text-primary-strong, $kui-color-text-primary-strong);
  text-decoration: underline;
}
</style>
