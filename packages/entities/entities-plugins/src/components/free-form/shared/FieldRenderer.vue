<!-- this is a render-less component-->
<!-- eslint-disable-next-line vue/valid-template-root-->
<template></template>

<script lang="ts">
export type Match<TName = string> = (opt: {
  path: TName
  schema: UnionFieldSchema
}) => boolean

export type MatchMap<TName = string> = Map<Match<TName>, Slot<{ name: TName }>>
</script>

<script lang="ts" setup generic="TParentData">
import type { DeepKeys } from './types/util-types'
import { inject, type Slot } from 'vue'
import type { UnionFieldSchema } from '../../../types/plugins/form-schema'
import { FIELD_RENDERER_MATCHERS_MAP } from './composables'

type TName = DeepKeys<TParentData>

const props = defineProps<{
  match: Match
  priority?: number
}>()

const { default: defaultSlot } = defineSlots<Record<string, Slot<{ name: TName }>>>()

const inheritedMatchMap = inject<MatchMap<TName>>(FIELD_RENDERER_MATCHERS_MAP)

if (!inheritedMatchMap) {
  throw new Error(FIELD_RENDERER_MATCHERS_MAP.toString() + 'not provided')
}

if (defaultSlot) {
  inheritedMatchMap.set(props.match, defaultSlot)
}
</script>
