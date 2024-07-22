<template>
  <div class="buggy-component">
    <KongIcon size="64" />
    <p>This component will <b>not</b> crash the page with an unhandled error.</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { KongIcon } from '@kong/icons'

const props = defineProps({
  error: {
    type: Boolean,
    required: true,
    default: false,
  },
})

onMounted(() => {
  if (props.error) {
    // Throw an unhandled error on purpose
    throw new Error('testing')
  }
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
