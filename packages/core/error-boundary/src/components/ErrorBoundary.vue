<template>
  <slot
    v-if="!capturedErrorContext?.error"
    name="default"
  />
  <slot
    v-else
    :context="capturedErrorContext.context"
    :error="capturedErrorContext.error"
    name="fallback"
  />
</template>

<script setup lang="ts">
import { provide, inject, computed, ref, unref, onErrorCaptured } from 'vue'
import type { ComponentPublicInstance, PropType } from 'vue'
import {
  KONG_UI_ERROR_BOUNDARY_ON_ERROR_INJECTION_KEY,
  KONG_UI_ERROR_BOUNDARY_TAGS_INJECTION_KEY,
} from '../constants'
import type { ErrorBoundaryCallbackParams } from '../types'

const props = defineProps({
  /**
   * An optional array of strings to pass along to the context
   */
  tags: {
    type: Array as PropType<string[]>,
    required: false,
    default: () => [],
    // Ensure the value is an object, not a string
    validator: (value: any): boolean => typeof value === 'object',
  },
  /**
   * An optional callback function to execute when an error is captured.
   * This prop will take precedence over a plugin-provided onError callback.
   */
  onError: {
    type: Function as PropType<(params: ErrorBoundaryCallbackParams) => void>,
    required: false,
    default: undefined,
  },
})

// Attempt to grab the `onError` callback from the Vue plugin options, if it exists; otherwise, fallback to `props.onError`
const vuePluginOnErrorCallback = inject(KONG_UI_ERROR_BOUNDARY_ON_ERROR_INJECTION_KEY, props.onError)
// Attempt to grab any ancestor ErrorBoundary component tags that were injected
const ancestorErrorBoundaryTags: string[] = inject(KONG_UI_ERROR_BOUNDARY_TAGS_INJECTION_KEY, [])

// A ref to store the captured error object and UI context
const capturedErrorContext = ref<ErrorBoundaryCallbackParams>()

// Compute all tags
const allTags = computed((): string[] => {
  // Create a Set to store all tags
  const errorTags: Set<string> = new Set()

  // Add all ancestor tags and props.tags to the Set
  // Using `unref` to ensure if the injected value is a ref it is unwrapped
  for (const tag of [...unref(ancestorErrorBoundaryTags), ...props.tags]) {
    errorTags.add(tag)
  }

  return Array.from(errorTags)
})

// Provide the reactive ref (not the ref.value)
provide(KONG_UI_ERROR_BOUNDARY_TAGS_INJECTION_KEY, allTags)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
onErrorCaptured((error: unknown, instance: ComponentPublicInstance | null, info: string) => {
  // Store the error and context to the ref
  capturedErrorContext.value = {
    error,
    context: {
      componentName: instance?.$options?.__name || '',
      info, // See here for codes returned in production: https://github.com/vuejs/core/blob/b8fc18c0b23be9a77b05dc41ed452a87a0becf82/packages/runtime-core/src/errorHandling.ts#L27
      source: 'ErrorBoundary', // The name of this ErrorBoundary component
      tags: allTags.value,
    },
  }

  // Perform provided callback, if present before exiting
  // Note: component `props.onError` will override the global Vue plugin `options.onError`
  if (typeof props.onError === 'function') {
    props.onError(capturedErrorContext.value)
  } else if (typeof vuePluginOnErrorCallback === 'function') {
    vuePluginOnErrorCallback(capturedErrorContext.value)
  }

  // We **must** return `false` to swallow the error in order to prevent the
  // rest of the page from breaking in some scenarios
  return false
})
</script>
