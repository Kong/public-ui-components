<template>
  <slot />
</template>

<script setup lang="ts">
import composables from '../composables'

// because we use `provide` and `inject` to manage the queryBridge and `provide`
// can only be called once per setup, we're using this wrapper to force the
// children of this component to rerender. It only works if we set a `:key` on
// this component that's tied to the state of `useGeneratedData`. The point of
// this is so that we can have a `<DashboardRenderer>` that has a preview toggle
// that allows the user to switch between what it _would_ look like with data
// and what it _actually_ looks like.

const props = defineProps<{
  useGeneratedData: boolean
}>()

if (props.useGeneratedData) {
  composables.useDataGenerator()
} else {
  composables.useRequestQueue()
}
</script>
