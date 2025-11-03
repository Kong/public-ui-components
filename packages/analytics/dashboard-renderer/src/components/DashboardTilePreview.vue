<template>
  <div ref="root">
    <DashboardTile
      clean
      :context="{
        ...internalContext,
        editable: false,
      }"
      :definition="definition"
      :height="height"
      :is-fullscreen="false"
      :query-ready="queryReady"
      :refresh-counter="0"
      :tile-id="randomId"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, toRef, ref, useTemplateRef, onMounted, onUnmounted } from 'vue'
import type { DashboardRendererContext } from '../types'
import DashboardTile from './DashboardTile.vue'
import type {
  DashboardConfig,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'
import composables from '../composables'
import { useAnalyticsConfigStore } from '@kong-ui-public/analytics-config-store'
import { DEFAULT_TILE_HEIGHT } from '../constants'

const root = useTemplateRef('root')
const randomId = crypto.randomUUID()

const {
  config,
  context,
  definition,
} = defineProps<{
  config: DashboardConfig
  context: DashboardRendererContext
  definition: TileDefinition
}>()

const { internalContext } = composables.useDashboardInternalContext({
  context: toRef(() => context),
  config: toRef(() => config),
})

const configStore = useAnalyticsConfigStore()
const queryReady = computed<boolean>(() => {
  return !!context.timeSpec || !configStore.loading
})

const height = ref<number>(DEFAULT_TILE_HEIGHT)
let observer: ResizeObserver | undefined

onMounted(() => {
  const parent = root.value?.parentElement
  if (!parent) return

  height.value = parent.getBoundingClientRect().height

  observer = new ResizeObserver(([entry]) => {
    const { height: parentHeight } = entry.contentRect
    height.value = parentHeight
  })

  observer.observe(parent)
})

onUnmounted(() => observer?.disconnect())
</script>