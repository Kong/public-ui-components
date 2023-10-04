<template>
  <slot
    v-if="!state.error"
    name="default"
  />
  <slot
    v-else
    :error="state.error"
    name="fallback"
  >
    <div class="kong-ui-public-error-boundary">
      <p>This is the <b>ErrorBoundary</b> fallback content.</p>
    </div>
  </slot>
</template>

<script setup lang="ts">
import { reactive, onErrorCaptured } from 'vue'
import type { ComponentPublicInstance, PropType } from 'vue'

// Inject any parent ErrorBoundary `tags` into the values passed in this instance and combine them
// const injectionKey = 'error-boundary-injection-key' // Probably cannot be a Symbol
// const tagSet = new Set()
// const existingTags = inject(injectionKey, [])

const props = defineProps({
  tags: {
    type: Array as PropType<string[]>,
    required: false,
    default: () => [],
  },
  onError: {
    type: Function as PropType<(error: unknown) => void>,
    required: false,
    default: undefined,
  },
})

const state = reactive({
  error: undefined as any,
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
onErrorCaptured((error: unknown, instance: ComponentPublicInstance | null, info: string) => {
  console.log('onErrorCaptured', error, instance, info)

  state.error = error
  state.error.context = 'custom'

  // Perform provided callback, if present before exiting
  if (typeof props.onError === 'function') {
    props.onError(state.error)
  }

  console.log('after error')

  // We **must** swallow the error in order to prevent a page from breaking
  return false
})
</script>

<style lang="scss" scoped>
.kong-ui-public-error-boundary {
  align-items: center;
  background: $kui-color-background-danger;
  border-radius: $kui-border-radius-40;
  color: $kui-color-text-inverse;
  display: flex;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-regular;
  justify-content: center;
  line-height: $kui-line-height-40;
  max-width: 100%;
  width: 100%;
}
</style>
