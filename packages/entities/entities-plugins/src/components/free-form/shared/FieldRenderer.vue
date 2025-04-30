<!-- this is a render-less component-->
<!-- eslint-disable-next-line vue/valid-template-root-->
<template></template>

<script lang="ts" setup>
import { inject, type Slot } from 'vue'
import type { UnionFieldSchema } from '../../../types/plugins/form-schema'
import { FIELD_RENDERER_MATCHERS_MAP } from './composables'

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

const inheritedMatchMap = inject<MatchMap>(FIELD_RENDERER_MATCHERS_MAP)

if (!inheritedMatchMap) {
  throw new Error(FIELD_RENDERER_MATCHERS_MAP.toString() + 'not provided')
}

if (defaultSlot) {
  inheritedMatchMap.set(props.match, defaultSlot)
}
</script>
