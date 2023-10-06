<template>
  <div
    class="error-boundary-child-component"
    data-testid="error-boundary-child-component"
  >
    <KongIcon size="64" />
    <h3>{{ computedName }}</h3>
    <p data-testid="normal-text">
      {{ text }}
    </p>
    <button
      data-testid="force-error-button"
      @click="forceError = true"
    >
      Force error
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { KongIcon } from '@kong/icons'

const props = defineProps({
  text: {
    type: String,
    default: 'This component WILL crash the page with an unhandled error',
  },
  error: {
    type: Boolean,
    required: true,
    default: false,
  },
})

const forceError = ref<boolean>(false)

const computedName = computed((): string => {
  if (props.error || forceError.value) {
    throw new Error('computed name error')
  }

  // eslint-disable-next-line no-unreachable
  return 'Test Error Component'
})
</script>

<style lang="scss" scoped>
.error-boundary-child-component {
  border: 1px solid $kui-color-border-primary;
  color: $kui-color-text-primary;
  padding: $kui-space-40;

  p {
    color: $kui-color-text;
  }
}
</style>
