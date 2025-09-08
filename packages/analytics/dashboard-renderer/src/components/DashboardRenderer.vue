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
      <component
        :is="context.editable && !isFullscreen ? DraggableGridLayout : GridLayout"
        v-else
        ref="gridLayoutRef"
        :tile-height="model.tile_height"
        :tiles="gridTiles"
        @update-tiles="handleUpdateTiles"
      >
        <template #tile="{ tile }">
          <div
            v-if="tile.meta.chart.type === 'slottable'"
            class="tile-container slottable-tile"
          >
            <slot :name="tile.meta.chart.id" />
          </div>
          <DashboardTile
            v-else
            :key="isFullscreen ? `${tile.id}-tile` : `${tile.id}-tile-fullscreen`"
            class="tile-container"
            :context="mergedContext"
            :definition="tile.meta"
            :height="tile.layout.size.rows * (model.tile_height || DEFAULT_TILE_HEIGHT) + parseInt(KUI_SPACE_70, 10)"
            :is-fullscreen="isFullscreen"
            :query-ready="queryReady"
            :refresh-counter="refreshCounter"
            :tile-id="tile.id"
            @duplicate-tile="onDuplicateTile(tile)"
            @edit-tile="onEditTile(tile)"
            @remove-tile="onRemoveTile(tile)"
            @tile-time-range-zoom="emit('tile-time-range-zoom', $event)"
          />
        </template>
      </component>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardRendererContext, DashboardRendererContextInternal, GridTile, TileZoomEvent } from '../types'
import type {
  AllFilters,
  AnalyticsBridge,
  DashboardConfig,
  SlottableOptions,
  TileConfig,
  TileDefinition,
  TimeRangeV4,
} from '@kong-ui-public/analytics-utilities'
import DashboardTile from './DashboardTile.vue'
import type { ComponentPublicInstance } from 'vue'
import { computed, getCurrentInstance, inject, nextTick, ref } from 'vue'
import composables from '../composables'
import GridLayout from './layout/GridLayout.vue'
import type { DraggableGridLayoutExpose } from './layout/DraggableGridLayout.vue'
import DraggableGridLayout from './layout/DraggableGridLayout.vue'
import {
  DEFAULT_TILE_HEIGHT,
  DEFAULT_TILE_REFRESH_INTERVAL_MS,
  FULLSCREEN_LONG_REFRESH_INTERVAL_MS,
  FULLSCREEN_SHORT_REFRESH_INTERVAL_MS,
  INJECT_QUERY_PROVIDER,
  TIMEFRAME_TOKEN,
} from '../constants'
import { useAnalyticsConfigStore } from '@kong-ui-public/analytics-config-store'
import { KUI_SPACE_70 } from '@kong/design-tokens'

const props = defineProps<{
  context: DashboardRendererContext
}>()

const emit = defineEmits<{
  (e: 'edit-tile', tile: GridTile<TileDefinition>): void
  (e: 'tile-time-range-zoom', newTimeRange: TileZoomEvent): void
}>()

const model = defineModel<DashboardConfig>({ required: true })

const { i18n } = composables.useI18n()
const refreshCounter = ref(0)
const gridLayoutRef = ref<ComponentPublicInstance<DraggableGridLayoutExpose<TileDefinition>> | null>(null)

const dashboardContainer = ref()
const layoutContainer = ref()
const scale = ref('scale(1)')

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

const configStore = useAnalyticsConfigStore()

const timeSpec = computed<TimeRangeV4>(() => {
  if (props.context.timeSpec) {
    return props.context.timeSpec
  }

  return {
    type: 'relative',
    time_range: configStore.defaultQueryTimeForOrg,
  }
})

const queryReady = computed<boolean>(() => {
  // In the future, this will need to be determined on a per-tile basis to support pipelining.
  // For now, it's fine for it to only be global.

  // We're ready to issue queries if we know the time spec.
  // We know the timespec if we were given the timespec, or if the config store has loaded the org's retention
  // and we're able to calculate a timespec.
  return !!props.context.timeSpec || !configStore.loading
})

const tileSortFn = (a: TileConfig, b: TileConfig) => {
  const rowDiff = a.layout.position.row - b.layout.position.row
  if (rowDiff !== 0) {
    return rowDiff
  }
  return a.layout.position.col - b.layout.position.col
}

const gridTiles = computed<Array<GridTile<TileDefinition>>>(() => {
  return model.value.tiles.map((tile: TileConfig) => {
    let tileMeta = tile.definition

    if ('description' in tileMeta.chart) {
      // Replace tokens in tile descriptions
      const description = tileMeta.chart.description?.replace(TIMEFRAME_TOKEN, () => {
        const timeSpecKey = timeSpec.value.type === 'absolute' ? 'custom' : timeSpec.value.time_range
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

      tileMeta = {
        ...tileMeta,
        chart: {
          ...tileMeta.chart,
          description,
        },
      }
    }

    if (props.context.editable && !tile.id) {
      console.warn(
        'No id provided for tile. One will be generated automatically,',
        'however tracking changes to this tile may not work as expected.',
        tile,
      )
    }

    return {
      layout: tile.layout,
      meta: tileMeta,
      type: tile.type,
      // Add a unique key to each tile internally.
      id: tile.id ?? crypto.randomUUID(),
    }
  })
})

const mergedContext = computed<DashboardRendererContextInternal>(() => {
  let { tz, refreshInterval, editable } = props.context
  const filters = [...(props.context.filters ?? []), ...(model.value.preset_filters ?? [])] as AllFilters[]

  if (!tz) {
    tz = (new Intl.DateTimeFormat()).resolvedOptions().timeZone
  }

  // Check explicitly against undefined because 0 is a valid refresh interval.
  if (refreshInterval === undefined) {
    refreshInterval = DEFAULT_TILE_REFRESH_INTERVAL_MS
  }

  if (isFullscreen.value) {
    // when we're fullscreen, we want to refresh automatically, regardless of
    // what the configured refreshInterval is.
    let isShort = false
    if (timeSpec.value.type === 'relative') {
      isShort = ['15m', '1h', '6h', '12h', '24h'].includes(timeSpec.value.time_range)
    } else {
      const start = timeSpec.value.start.getTime()
      const end = timeSpec.value.end.getTime()
      const diffMs = Math.abs(end - start)
      isShort = diffMs <= 86400000 // less than or equal to 24 hours
    }

    const now = new Date().getTime()
    const isPast = timeSpec.value.type === 'absolute'
      && timeSpec.value.end.getTime() < now

    if (isPast) {
      // if the timerange is in the past there's no need to refresh
      refreshInterval = 0
    } else if (isShort) {
      // if the timerange is 24 hours or less, refresh more frequently
      refreshInterval = FULLSCREEN_SHORT_REFRESH_INTERVAL_MS
    } else {
      // otherwise, refresh less frequently
      refreshInterval = FULLSCREEN_LONG_REFRESH_INTERVAL_MS
    }
  }

  if (editable === undefined) {
    editable = false
  }

  // Check if the host app has provided an event handler for zooming.
  // If there's no handler, disable zooming -- it won't do anything.
  const zoomable = !!getCurrentInstance()?.vnode?.props?.onTileTimeRangeZoom

  return {
    filters,
    tz,
    timeSpec: timeSpec.value,
    refreshInterval,
    editable,
    zoomable,
  }
})

// Right now, tiles don't have unique keys.  Perhaps in the future they will,
// and we can use that instead of `index` as the fragment key.

const onEditTile = (tile: GridTile<TileDefinition>) => {
  emit('edit-tile', tile)
}

const isSlottable = (chart: any): chart is SlottableOptions => {
  return chart.type === 'slottable'
}

const onDuplicateTile = (tile: GridTile<TileDefinition>) => {
  const chart = isSlottable(tile.meta.chart)
    ? { ...tile.meta.chart }
    : {
      ...tile.meta.chart,
      chart_title: tile.meta.chart.chart_title ? `Copy of ${tile.meta.chart.chart_title}` : '',
    }

  const newTile: TileConfig = {
    id: crypto.randomUUID(),
    type: 'chart',
    definition: {
      ...tile.meta,
      chart,
    },
    layout: {
      position: {
        col: 0,
        row: 0,
      },
      size: tile.layout.size,
    },
  }

  model.value.tiles.push(newTile)
}

const onRemoveTile = (tile: GridTile<TileDefinition>) => {
  if (gridLayoutRef.value) {
    gridLayoutRef.value.removeWidget(tile.id)
  }
}

const refreshTiles = () => {
  refreshCounter.value++
}

const handleUpdateTiles = (tiles: Array<GridTile<TileDefinition>>) => {
  const updatedTiles = tiles.map(tile => {
    return {
      id: tile.id,
      type: tile.type,
      layout: tile.layout,
      definition: tile.meta,
    } as TileConfig
  })

  model.value.tiles = updatedTiles.sort(tileSortFn)
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
const onFullscreenChange = () => {
  isFullscreen.value = document.fullscreenElement !== null
  if (isFullscreen.value) {
    updateScale()
  }
}

defineExpose({
  refresh: refreshTiles,
  toggleFullscreen,
})
</script>

<style lang="scss" scoped>
.kong-ui-public-dashboard-renderer {
  position: relative;

  .tile-container {
    background: var(--kui-color-background-transparent, $kui-color-background-transparent);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    height: 100%;

    &.slottable-tile {
      padding: var(--kui-space-60, $kui-space-60);
    }
  }

  &.is-fullscreen {
    background-color: white;

    .fullscreen-header {
      margin-bottom: $kui-space-60;
    }

    .layout {
      background-color: white;
      padding: $kui-space-60;
      transform: v-bind(scale);
      transform-origin: top;
    }

    .fullscreen-control {
      right: 16px;
    }
  }

  .fullscreen-control {
    align-items: center;
    background-color: $kui-color-background-decorative-purple-weakest;
    border-radius: 4px;
    bottom: -10px;
    color: $kui-color-text-decorative-purple-strong;
    cursor: pointer;
    display: inline-flex;
    font-size: 10px;
    gap: $kui-space-10;
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
