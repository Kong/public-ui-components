<template>
  <div
    ref="dashboardContainer"
    class="kong-ui-public-dashboard-renderer"
    :class="{ 'is-fullscreen': isFullscreen }"
    @fullscreenchange="onFullscreenChange"
  >
    <div
      ref="layoutContainer"
      class="layout"
    >
      <div
        v-if="queryBridge && isFullscreen"
        class="fullscreen-header"
      >
        <slot name="fullscreenHeader" />
      </div>
      <KAlert
        v-if="!queryBridge"
        appearance="danger"
      >
        {{ i18n.t('renderer.noQueryBridge') }}
      </KAlert>
      <div
        v-for="(activeModel, index) in modelRay"
        v-else
        :key="`dash-${index}`"
        class="dashboard-boundary"
        :class="{
          multiple: modelRay.length > 1,
        }"
      >
        <a :id="`dash-${index}`" />
        <div
          v-if="context?.sectionsInfo?.[index]"
          class="boundary-header"
        >
          <div
            v-if="getSectionTitle(index)"
            class="boundary-title"
          >
            {{ getSectionTitle(index) }}
          </div>
          <div
            v-if="getSectionDescription(index)"
            class="boundary-description"
          >
            {{ getSectionDescription(index) }}
          </div>
        </div>
        <DraggableGridLayout
          :key="`layout-${isEditing}`"
          :ref="(el) => setGridLayoutRef(index, el)"
          :columns="activeModel.columns"
          :editable="isEditing"
          :tile-height="activeModel.tile_height"
          :tiles="gridTiles[index]"
          @update-tiles="(tiles: any) => handleUpdateTiles(tiles, index)"
        >
          <template #tile="{ tile, fitToContent }">
            <!-- eslint-disable @kong/eslint-plugin-design-tokens/token-constant-requires-css-var -->
            <div
              v-if="isSlottableTile(tile)"
              class="tile-container slottable-tile"
              :class="{ 'fit-to-content': fitToContent }"
            >
              <slot :name="getSlottableSlotName(tile)" />
            </div>
            <DashboardTile
              v-else
              :key="isFullscreen ? `${tile.id}-tile` : `${tile.id}-tile-fullscreen`"
              v-model:refresh-counter="refreshCounter"
              class="tile-container"
              :context="getContextWithFilters(activeModel)"
              :definition="tile.meta as TileDefinition"
              :fit-to-content="fitToContent"
              :height="tile.layout.size.rows * (activeModel.tile_height || DEFAULT_TILE_HEIGHT) + parseInt(KUI_SPACE_70, 10)"
              :hide-actions="!showTileActions"
              :is-fullscreen="isFullscreen"
              :preview="preview"
              :query-ready="queryReady"
              :tile-id="tile.id"
              :tile-type="tile.type"
              @duplicate-tile="onDuplicateTile(tile, index)"
              @edit-tile="onEditTile(tile)"
              @remove-tile="onRemoveTile(tile, index)"
              @tile-loaded="onTileLoaded(tile)"
              @tile-time-range-zoom="emit('tile-time-range-zoom', $event)"
            />
          </template>
          <!-- eslint-enable @kong/eslint-plugin-design-tokens/token-constant-requires-css-var -->
        </DraggableGridLayout>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardRendererContext, GridTile, TileZoomEvent } from '../types'
import type {
  AllFilters,
  AnalyticsBridge,
  ChartTileDefinition,
  DashboardConfig,
  SlottableOptions,
  TileConfig,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'
import { useInteractionCoordinator } from '@kong-ui-public/analytics-utilities/coordination'
import DashboardTile from './DashboardTile.vue'
import type { ComponentPublicInstance } from 'vue'
import { computed, inject, nextTick, provide, ref } from 'vue'
import composables from '../composables'
import type { DraggableGridLayoutExpose } from './layout/DraggableGridLayout.vue'
import DraggableGridLayout from './layout/DraggableGridLayout.vue'
import {
  DEFAULT_TILE_HEIGHT,
  INJECT_DASHBOARD_COORDINATOR,
  INJECT_QUERY_PROVIDER,
} from '../constants'
import { duplicateChartTile } from '../utils/duplicate-tile'
import { tileDescription } from '../utils/tile-definition'
import { KUI_SPACE_70 } from '@kong/design-tokens'

const {
  context,
  preview = false,
} = defineProps<{
  context: DashboardRendererContext
  preview?: boolean
}>()

if (context.disableCoordination !== true) {
  const coordinator = useInteractionCoordinator()
  provide(INJECT_DASHBOARD_COORDINATOR, coordinator)
}

const emit = defineEmits<{
  (e: 'edit-tile', tile: GridTile<TileDefinition>): void
  (e: 'tile-time-range-zoom', newTimeRange: TileZoomEvent): void
  (e: 'tiles-loaded', done: boolean): void
}>()

const models = defineModel<DashboardConfig | DashboardConfig[]>({ required: true })

const getModelByIndex = (index: number): DashboardConfig => {
  if (Array.isArray(models.value)) {
    return models.value[index]
  }

  return models.value
}

/**
 * a helper that coerces our v-model into an array, used only for vue rendering
 */
const modelRay = computed<DashboardConfig[]>(() => {
  if (Array.isArray(models.value)) {
    return models.value
  }

  return [models.value]
})

const nonSlottableTileCount = computed<number>(() => {
  const tiles: TileConfig[] = Array.isArray(models.value)
    ? models.value.reduce((acc, currModel) => {
      return [
        ...acc,
        ...currModel.tiles,
      ]
    }, [] as TileConfig[])
    : models.value.tiles

  const isSlottableConfig = (tile: TileConfig): boolean => tile.type === 'slottable'
    || ('definition' in tile && (tile.definition as ChartTileDefinition)?.chart?.type === 'slottable')

  return tiles.filter((tile) => !isSlottableConfig(tile)).length
})

const { i18n } = composables.useI18n()
const refreshCounter = ref(0)
const gridLayoutRefs: Array<ComponentPublicInstance<DraggableGridLayoutExpose<TileDefinition>> | null> = []

const setGridLayoutRef = (index: number, el: Element | ComponentPublicInstance | null) => {
  gridLayoutRefs[index] = el as ComponentPublicInstance<DraggableGridLayoutExpose<TileDefinition>> | null
}

const dashboardContainer = ref()
const layoutContainer = ref<HTMLElement>()
const scale = ref('scale(1)')

// Track which tiles (except for slottable tiles) have completed their queries.
const loadedTileIds = new Set<string>()

// Note: queryBridge is not directly used by the DashboardRenderer component.  It is required by many of the
// subcomponents that get rendered in the dashboard, however.  Check for its existence here in order to catch
// programming errors early.
const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

if (!queryBridge) {
  console.warn('Analytics dashboards require a query bridge supplied via provide / inject.')
  console.warn("Please ensure your application has a query bridge provided under the key 'analytics-query-provider', as described in")
  console.warn('https://github.com/Kong/public-ui-components/blob/main/packages/analytics/dashboard-renderer/README.md#requirements')
}

// Enable a request queue on the query bridge for all subcomponents.
composables.useRequestQueue()

const { exportPdf, exportState: pdfExportState } = composables.useExportPdf(layoutContainer)

const onTileLoaded = (tile: GridTile<TileDefinition>) => {
  loadedTileIds.add((tile.id as string))

  if (loadedTileIds.size >= nonSlottableTileCount.value) {
    emit('tiles-loaded', true)
  }
}

const timeframeLabel = computed<string>(() => {
  const timeSpecKey = timeSpec.value.type === 'absolute'
    ? 'custom'
    : timeSpec.value.time_range

  const key = `renderer.trendRange.${timeSpecKey}`

  // Right now, we basically only support 2 ranges: 24 hours and 30 days.
  // In case of a misconfiguration, don't render a translation at all.
  // @ts-ignore: dynamic i18n key
  if (i18n.te(key)) {
    // @ts-ignore: dynamic i18n key
    return i18n.t(key)
  }

  return ''
})

const tileSortFn = (a: TileConfig, b: TileConfig) => {
  const rowDiff = a.layout.position.row - b.layout.position.row
  if (rowDiff !== 0) {
    return rowDiff
  }
  return a.layout.position.col - b.layout.position.col
}

const getTiles = (config: DashboardConfig): Array<GridTile<TileDefinition>> => {
  return config.tiles.map((tile: TileConfig) => {
    if (editable.value && !tile.id) {
      console.warn(
        'No id provided for tile. One will be generated automatically,',
        'however tracking changes to this tile may not work as expected.',
        tile,
      )
    }

    if (tile.type === 'slottable') {
      return {
        layout: tile.layout,
        type: tile.type,
        id: tile.id ?? crypto.randomUUID(),
      }
    }

    let tileMeta = tile.definition
    const tileType = tile.type ?? 'chart'

    const description = tileDescription(tileMeta, timeframeLabel.value)

    if (description !== tileMeta.header_description) {
      tileMeta = {
        ...tileMeta,
        header_description: description,
      } as TileDefinition
    }

    return {
      layout: tile.layout,
      meta: tileMeta,
      type: tileType,
      // Add a unique key to each tile internally.
      id: tile.id ?? crypto.randomUUID(),
    }
  })
}

const gridTiles = computed<Array<Array<GridTile<TileDefinition>>>>(() => modelRay.value.map(getTiles))

// Right now, tiles don't have unique keys.  Perhaps in the future they will,
// and we can use that instead of `index` as the fragment key.

const onEditTile = (tile: GridTile<TileDefinition>) => {
  emit('edit-tile', tile)
}

const isSlottableTile = (tile: GridTile<TileDefinition>): boolean => {
  if (tile.type === 'slottable') {
    return true
  }

  return (tile.meta as ChartTileDefinition)?.chart.type === 'slottable'
}

const isSlottable = (chart: any): chart is SlottableOptions => {
  return chart.type === 'slottable'
}

const getSlottableSlotName = (tile: GridTile<TileDefinition>): string | undefined => {
  if (tile.type === 'slottable') {
    return tile.id as string
  }

  const chart = (tile.meta as ChartTileDefinition)?.chart

  return chart && isSlottable(chart) ? chart.id : undefined
}

const onDuplicateTile = (tile: GridTile<TileDefinition>, index: number) => {
  const model = getModelByIndex(index)
  try {
    const newTile = duplicateChartTile(tile)

    // deep cloning to avoid duplicated references
    model.tiles.push(JSON.parse(JSON.stringify(newTile)))
  } catch (e) {
    // this shouldn't happen, but we should always wrap JSON.parse/stringify in try catch
    console.warn(e)
  }
}

const onRemoveTile = (tile: GridTile<TileDefinition>, index: number) => {
  gridLayoutRefs[index]?.removeWidget(tile.id)
  loadedTileIds.delete((tile.id as string))
}

const refreshTiles = () => {
  loadedTileIds.clear()
  refreshCounter.value++
}

const handleUpdateTiles = (tiles: Array<GridTile<TileDefinition>>, index: number) => {
  const model = getModelByIndex(index)

  const updatedTiles = tiles.map(tile => {
    if (tile.type === 'slottable') {
      return {
        id: tile.id,
        type: tile.type,
        layout: tile.layout,
      } as TileConfig
    }

    return {
      id: tile.id,
      type: tile.type,
      layout: tile.layout,
      definition: tile.meta as TileDefinition,
    } as TileConfig
  })

  model.tiles = updatedTiles.sort(tileSortFn)
}

const updateScale = async () => {
  // reset to 1 so we recalculate correctly
  scale.value = 'scale(1)'
  // wait for the header and scale to render before calculating heights
  await nextTick()

  if (layoutContainer.value) {
    const { availWidth: screenWidth, availHeight: screenHeight } = window.screen
    const { width, height } = layoutContainer.value.getBoundingClientRect()
    const newScale = Math.min(screenHeight / height, screenWidth / width)
    scale.value = `scale(${newScale})`
  }
}

const toggleFullscreen = () => {
  if (dashboardContainer.value) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      dashboardContainer.value.requestFullscreen()
    }
  }
}

const isFullscreen = ref(false)

const isEditing = computed<boolean>(() => editable.value && !isFullscreen.value)

const onFullscreenChange = () => {
  isFullscreen.value = document.fullscreenElement !== null
  if (isFullscreen.value) {
    updateScale()
  }
}

// All of these are the same regardless of which model(s) is used, with the
// exception of enrichedContext.filters, which is handled in `getContextWithFilters`
// below.
const {
  editable,
  enrichedContext,
  queryReady,
  showTileActions,
  timeSpec,
} = composables.useDashboardContext({
  globalFilters: computed(() => []),
  context: computed(() => context),
  isFullscreen,
  preview: computed(() => preview),
})

const getContextWithFilters = (config: DashboardConfig) => {
  return {
    ...enrichedContext.value,
    filters: [
      ...(context.filters ?? []),
      ...(config.preset_filters as AllFilters[] ?? []),
    ],
  }
}

const getSectionTitle = (index: number) => {
  if (enrichedContext.value.sectionsInfo
    && enrichedContext.value.sectionsInfo[index]
    && enrichedContext.value.sectionsInfo[index].title) {
    return enrichedContext.value.sectionsInfo[index].title
  }
}

const getSectionDescription = (index: number) => {
  if (enrichedContext.value.sectionsInfo
    && enrichedContext.value.sectionsInfo[index]
    && enrichedContext.value.sectionsInfo[index].description) {
    return enrichedContext.value.sectionsInfo[index].description
  }
}

defineExpose({
  refresh: refreshTiles,
  toggleFullscreen,
  exportPdf,
  pdfExportState,
})
</script>

<style lang="scss" scoped>
.kong-ui-public-dashboard-renderer {
  position: relative;

  .tile-container {
    background: var(--kui-color-background, $kui-color-background);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-40, $kui-border-radius-40);

    &:not(.fit-to-content) {
      height: 100%;
    }

    &.slottable-tile {
      padding: var(--kui-space-60, $kui-space-60);
    }
  }

  &.is-fullscreen {
    background-color: var(--kui-color-background, $kui-color-background);

    .fullscreen-header {
      margin-bottom: var(--kui-space-60, $kui-space-60);
    }

    .layout {
      background-color: var(--kui-color-background, $kui-color-background);
      padding: var(--kui-space-60, $kui-space-60);
      transform: v-bind(scale);
      transform-origin: top;
    }

    .fullscreen-control {
      right: 16px;
    }
  }

  .dashboard-boundary.multiple {
    background: linear-gradient(
      var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker),
      var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest)) padding-box;
    border: 1px solid var(--kui-color-border-neutral-weaker, $kui-color-border-neutral-weaker);
    border-radius: var(--kui-border-radius-50, $kui-border-radius-50);
    margin-top: var(--kui-space-60, $kui-space-60);
    padding: 2px;

    &:first-of-type {
      margin-top: 0;
    }

    .boundary-header {
      padding: var(--kui-space-30, $kui-space-30) 0;
    }

    .boundary-title {
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      padding-bottom: 2px;
      padding-left: var(--kui-space-50, $kui-space-50);
    }

    .boundary-description {
      color: var(--kui-color-text-neutral-weak, $kui-color-text-neutral-weak);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
      padding-bottom: 2px;
      padding-left: var(--kui-space-50, $kui-space-50);
    }
  }

  .fullscreen-control {
    align-items: center;
    background-color: var(--kui-color-background-decorative-purple-weakest, $kui-color-background-decorative-purple-weakest);
    border-radius: 4px;
    bottom: -10px;
    color: var(--kui-color-text-decorative-purple-strong, $kui-color-text-decorative-purple-strong);
    cursor: pointer;
    display: inline-flex;
    font-size: 10px;
    gap: var(--kui-space-10, $kui-space-10);
    line-height: 0;
    margin: 0;
    opacity: 0.5;
    padding: 3px 5px;
    position: absolute;
    right: 0;
    transition: opacity 0.1s ease-in;
    user-select: none;

    &:hover {
      opacity: 1;
    }
  }
}
</style>
