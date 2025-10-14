<!-- this is a render-less component-->
<!-- eslint-disable-next-line vue/valid-template-root-->
<template></template>

<script lang="ts" setup>
import type { Slot } from 'vue'
import type { UnionFieldSchema } from '../../../types/plugins/form-schema'
import { useFreeformStore } from './composables'

export type Match = (opt: {
  path: string
  schema: UnionFieldSchema
}) => boolean

export type MatchMap = Map<Match, Slot<{ name: string }>>

const props = defineProps<{
  match: Match
  priority?: number
}>()

const { default: defaultSlot } = defineSlots<Record<string, Slot<{ name: string }>>>()

const { fieldRendererRegistry } = useFreeformStore()

if (defaultSlot) {
  fieldRendererRegistry.set(props.match, defaultSlot)
}
</script>
