<!-- this is a render-less component-->
<!-- eslint-disable-next-line vue/valid-template-root-->
<template></template>

<script lang="ts" setup>
import type { Slot } from 'vue'
import { useFormShared } from './composables'
import type { Match } from './types'

const props = defineProps<{
  match: Match
  priority?: number
}>()

const { default: defaultSlot } = defineSlots<Record<string, Slot<{ name: string }>>>()

const { fieldRendererRegistry } = useFormShared()

if (defaultSlot) {
  fieldRendererRegistry.set(props.match, defaultSlot)
}
</script>
