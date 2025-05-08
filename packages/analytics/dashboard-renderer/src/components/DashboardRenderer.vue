<template>
  <div class="kong-ui-public-dashboard-renderer">
    <KAlert
      v-if="!queryBridge"
      appearance="danger"
    >
      {{ i18n.t('renderer.noQueryBridge') }}
    </KAlert>
    <component
      :is="context.editable ? DraggableGridLayout : GridLayout"
      v-else
      ref="gridLayoutRef"
      :grid-size="model.gridSize"
      :tile-height="model.tileHeight"
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
          class="tile-container"
          :context="mergedContext"
          :definition="tile.meta"
          :height="tile.layout.size.rows * (model.tileHeight || DEFAULT_TILE_HEIGHT) + parseInt(KUI_SPACE_70, 10)"
          :query-ready="queryReady"
          :refresh-counter="refreshCounter"
          :tile-id="tile.id"
          @duplicate-tile="onDuplicateTile(tile)"
          @edit-tile="onEditTile(tile)"
          @remove-tile="onRemoveTile(tile)"
          @zoom-time-range="emit('zoom-time-range', $event)"
        />
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import type { DashboardRendererContext, DashboardRendererContextInternal, GridTile } from '../types'
import type { AbsoluteTimeRangeV4, DashboardConfig, TileConfig, SlottableOptions, TileDefinition } from '@kong-ui-public/analytics-utilities'
import DashboardTile from './DashboardTile.vue'
import { computed, inject, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import composables from '../composables'
import GridLayout from './layout/GridLayout.vue'
import DraggableGridLayout from './layout/DraggableGridLayout.vue'
import type { DraggableGridLayoutExpose } from './layout/DraggableGridLayout.vue'
import type { AnalyticsBridge, TimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import {
  DEFAULT_TILE_HEIGHT,
  DEFAULT_TILE_REFRESH_INTERVAL_MS,
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
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()

const model = defineModel<DashboardConfig>({ required: true })

const { i18n } = composables.useI18n()
const refreshCounter = ref(0)
const gridLayoutRef = ref<ComponentPublicInstance<DraggableGridLayoutExpose<TileDefinition>> | null>(null)

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

const gridTiles = computed(() => {
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
      // Add a unique key to each tile internally.
      id: tile.id ?? crypto.randomUUID(),
    } as GridTile<TileDefinition>
  })
})

const mergedContext = computed<DashboardRendererContextInternal>(() => {
  let { tz, refreshInterval, editable } = props.context

  if (!tz) {
    tz = (new Intl.DateTimeFormat()).resolvedOptions().timeZone
  }

  // Check explicitly against undefined because 0 is a valid refresh interval.
  if (refreshInterval === undefined) {
    refreshInterval = DEFAULT_TILE_REFRESH_INTERVAL_MS
  }

  if (editable === undefined) {
    editable = false
  }

  return {
    ...props.context,
    tz,
    timeSpec: timeSpec.value,
    refreshInterval,
    editable,
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
      chartTitle: tile.meta.chart.chartTitle ? `Copy of ${tile.meta.chart.chartTitle}` : '',
    }

  const newTile: TileConfig = {
    id: crypto.randomUUID(),
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

const handleUpdateTiles = (tiles: GridTile<TileDefinition>[]) => {
  const updatedTiles = tiles.map(tile => {
    return {
      id: tile.id,
      layout: tile.layout,
      definition: tile.meta,
    } as TileConfig
  })

  // Update `rows` to match the number of tiles we've placed.
  // `columns` remains fixed; this is set by design requirements rather than the number of tiles.
  model.value.gridSize.rows = Math.max(1, ...updatedTiles.map(t => t.layout.position.row + t.layout.size.rows))
  model.value.tiles = updatedTiles.sort(tileSortFn)
}

defineExpose({ refresh: refreshTiles })

</script>

<style lang="scss" scoped>
.kong-ui-public-dashboard-renderer {
  .tile-container {
    background: var(--kui-color-background-transparent, $kui-color-background-transparent);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    height: 100%;

    &.slottable-tile {
      padding: var(--kui-space-60, $kui-space-60);
    }
  }
}
</style>
