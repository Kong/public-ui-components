<template>
  <div class="kong-ui-public-dashboard-renderer">
    <KAlert
      v-if="!queryBridge"
      appearance="danger"
    >
      {{ i18n.t('renderer.noQueryBridge') }}
    </KAlert>
    <GridLayout
      v-else
      :grid-size="config.gridSize"
      :tile-height="config.tileHeight"
      :tiles="gridTiles"
    >
      <template #tile="{ tile }">
        <div
          v-if="tile.meta.chart.type === ChartTypes.Slottable"
          class="tile-container"
        >
          <slot :name="tile.meta.chart.id" />
        </div>
        <DashboardTile
          v-else
          class="tile-container"
          :context="mergedContext"
          :definition="tile.meta"
          :fit-to-content="tile.layout.size.fitToContent"
          :height="tile.layout.size.rows * (config.tileHeight || DEFAULT_TILE_HEIGHT) + parseInt(KUI_SPACE_70, 10)"
        />
      </template>
    </GridLayout>
  </div>
</template>

<script setup lang="ts">
import { ChartTypes } from '../types'
import type { GridTile, TileConfig, DashboardConfig, DashboardRendererContext, TileDefinition } from '../types'
import DashboardTile from './DashboardTile.vue'
import { computed, inject } from 'vue'
import composables from '../composables'
import GridLayout from './layout/GridLayout.vue'
import type { AnalyticsBridge } from '@kong-ui-public/analytics-utilities'
import { DEFAULT_TILE_HEIGHT, INJECT_QUERY_PROVIDER } from '../constants'
import { KUI_SPACE_70 } from '@kong/design-tokens'

const props = defineProps<{
  context: DashboardRendererContext,
  config: DashboardConfig,
}>()

const { i18n } = composables.useI18n()

// Note: queryBridge is not directly used by the DashboardRenderer component.  It is required by many of the
// subcomponents that get rendered in the dashboard, however.  Check for its existence here in order to catch
// programming errors early.
const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

if (!queryBridge) {
  console.warn('Analytics dashboards require a query bridge supplied via provide / inject.')
  console.warn("Please ensure your application has a query bridge provided under the key 'analytics-query-provider', as described in")
  console.warn('https://github.com/Kong/public-ui-components/blob/main/packages/analytics/dashboard-renderer/README.md#requirements')
}

const gridTiles = computed(() => {
  return props.config.tiles.map((tile: TileConfig, i: number) => {
    return {
      layout: tile.layout,
      meta: tile.definition,
      // Add a unique key to each tile internally.
      id: i,
    } as GridTile<TileDefinition>
  })
})

const mergedContext = computed(() => {
  if (props.context.tz) {
    return props.context
  }

  return {
    ...props.context,
    tz: (new Intl.DateTimeFormat()).resolvedOptions().timeZone,
  }
})

// Right now, tiles don't have unique keys.  Perhaps in the future they will,
// and we can use that instead of `index` as the fragment key.

</script>

<style lang="scss" scoped>
.kong-ui-public-dashboard-renderer {
  .tile-container {
    border: 1px solid $kui-color-border;
    border-radius: $kui-border-radius-20;
    height: 100%;
    padding: $kui-space-70;
  }
}
</style>
