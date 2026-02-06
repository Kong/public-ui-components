<template>
  <component
    :is="tag"
    :class="{ 'has-task-items': hasTaskItems }"
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
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  margin-bottom: var(--kui-space-50, $kui-space-50);
  margin-left: var(--kui-space-60, $kui-space-60);
  padding: var(--kui-space-0, $kui-space-0);
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
