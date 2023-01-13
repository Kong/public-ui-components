<!-- This is a global stub for the <router-link> component used in several packages -->
<template>
  <slot v-if="custom" />
  <a
    v-else
    class="router-link"
    href="#"
  >
    <slot />
  </a>
</template>

<script setup lang="ts">
defineProps({
  // accept the native router-link prop to prevent an anchor tag from rendering
  custom: {
    type: Boolean,
  },
  // Add this prop so the tests don't complain
  to: {
    type: [String, Object],
    default: '',
  },
})
</script>
