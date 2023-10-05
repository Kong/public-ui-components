<template>
  <div class="buggy-component">
    <KongIcon size="64" />
    <p>{{ computedName }}</p>
    <p>This component <b>WILL</b> crash the page with an unhandled error.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KongIcon } from '@kong/icons'

const props = defineProps({
  error: {
    type: Boolean,
    required: true,
    default: false,
  },
})

const computedName = computed((): string => {
  if (props.error) {
    throw new Error('computed error')
  }

  // eslint-disable-next-line no-unreachable
  return 'Buggy Component'
})
</script>

<style lang="scss" scoped>
.buggy-component {
  border: 1px solid $kui-color-border;
  color: $kui-color-text-primary;
  padding: $kui-space-40;

  p {
    color: $kui-color-text;
  }
}
</style>
