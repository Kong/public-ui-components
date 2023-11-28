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
      :tile-width="config.tileWidth"
      :tiles="config.tiles"
    >
      <template #tile="{ tile }">
        <Tile
          class="tile-container"
          :definition="(tile as TileConfig).definition"
          :height="(config.tileHeight || DEFAULT_TILE_HEIGHT) * tile.layout.size.rows"
        />
      </template>
    </GridLayout>
  </div>
</template>

<script setup lang="ts">
import { type TileConfig, type DashboardConfig, type DashboardRendererContext } from '../types'
import Tile from './DashboardTile.vue'
import { INJECT_QUERY_PROVIDER } from '../types/query-provider'
import { inject } from 'vue'
import composables from '../composables'
import GridLayout from './layout/GridLayout.vue'
import { DEFAULT_TILE_HEIGHT } from '../constants'

defineProps<{
  context: DashboardRendererContext,
  config: DashboardConfig,
}>()

const { i18n } = composables.useI18n()

const queryBridge = inject(INJECT_QUERY_PROVIDER)

// Right now, tiles don't have unique keys.  Perhaps in the future they will,
// and we can use that instead of `index` as the fragment key.

</script>

<style lang="scss" scoped>
  .kong-ui-public-dashboard-renderer {
    .tile-container {
      border: 1px solid $kui-color-border;
      border-radius: $kui-border-radius-20;
    }
  }
</style>
