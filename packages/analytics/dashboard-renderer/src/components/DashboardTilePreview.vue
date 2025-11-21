<template>
  <div
    ref="root"
    data-testid="dashboard-tile-preview-root"
  >
    <DashboardTile
      v-model:refresh-counter="refreshCounter"
      :context="{
        ...internalContext,
        editable: false,
      }"
      :definition="definition"
      :height="height"
      hide-actions
      :query-ready="queryReady"
      show-refresh
      :tile-id="randomId"
      @tile-bounds-change="onBoundsChange"
      @tile-time-range-zoom="onZoom"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, toRef, ref, useTemplateRef, onMounted, onUnmounted } from 'vue'
import type { DashboardRendererContext, TileBoundsChangeEvent, TileZoomEvent } from '../types'
import DashboardTile from './DashboardTile.vue'
import type {
  AllFilters,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'
import composables from '../composables'
import { useAnalyticsConfigStore } from '@kong-ui-public/analytics-config-store'
import { DEFAULT_TILE_HEIGHT } from '../constants'

const root = useTemplateRef('root')
const randomId = crypto.randomUUID()

const {
  context,
  definition,
  globalFilters = [],
} = defineProps<{
  context: DashboardRendererContext
  definition: TileDefinition
  globalFilters?: AllFilters[]
}>()

const emit = defineEmits<{
  (e: 'tile-time-range-zoom', newTimeRange: TileZoomEvent): void
  (e: 'tile-bounds-change', bounds: TileBoundsChangeEvent): void
}>()

const onZoom = (e: TileZoomEvent) => {
  emit('tile-time-range-zoom', e)
}

const onBoundsChange = (e: TileBoundsChangeEvent) => {
  emit('tile-bounds-change', e)
}

const { internalContext } = composables.useDashboardInternalContext({
  globalFilters: toRef(() => globalFilters),
  context: toRef(() => context),
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

const refreshCounter = ref(0)
const refresh = () => {
  refreshCounter.value++
}
defineExpose({
  refresh,
})
</script>