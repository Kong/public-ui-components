<!-- this is a render-less component-->
<!-- eslint-disable-next-line vue/valid-template-root-->
<template></template>

<script lang="ts" setup>
import { toRef, type Component, type Slot } from 'vue'
import { useFormShared } from '../composables'
import type { Match } from '../types'

const props = defineProps<{
  match: Match
  /** Render the component directly so it receives the field's props, events and named slots. */
  component?: Component
  priority?: number
}>()

const { default: defaultSlot } = defineSlots<Record<string, Slot<{ name: string }>>>()

const { fieldRendererRegistry } = useFormShared()

if (defaultSlot || props.component) {
  fieldRendererRegistry.set(props.match, defaultSlot ?? toRef(() => props.component))
}
</script>
