<template>
  <component
    :is="tag"
    :class="{ 'has-task-items': hasTaskItems}"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
const props = defineProps({
  isOrdered: {
    type: Boolean,
    default: false,
  },
  hasTaskItems: {
    type: Boolean,
    default: false,
  },
})

const tag = props.isOrdered ? 'ol' : 'ul'
</script>

<style scoped lang="scss">
ul, ol {
  font-size: 14px;
  margin-bottom: var(--spacing-sm, 12px);
  margin-left: 16px;
  padding: 0;
}

ol {
  list-style: decimal;
}

ul {
  list-style: disc;
}

.has-task-items {
  margin-left: unset;

  :deep(li) {
    list-style: none;
  }
}
</style>
