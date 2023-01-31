<template>
  <component :is="tag">
    <slot />
  </component>
</template>

<script setup lang="ts">
const props = defineProps({
  isOrdered: {
    type: Boolean,
    default: false,
  },
})

const tag = props.isOrdered ? 'ol' : 'ul'
</script>

<style scoped>
ul, ol {
  font-size: 14px;
  margin-left: 16px;
  padding: 0;
  margin-bottom: var(--spacing-sm, 12px);
}

ol {
  list-style: decimal;
}

ul {
  list-style: disc;
}
</style>
