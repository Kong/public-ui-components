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
      :grid-size="props.definition.gridSize"
      :tile-height="props.definition.tileHeight"
      :tile-width="props.definition.tileWidth"
      :tiles="props.definition.tiles"
    >
      <template #tile="{ tile }">
        <Tile
          :definition="(tile as TileDefinition)"
          :height="(props.definition.tileHeight ?? 150) * tile.size.rows"
        />
      </template>
    </GridLayout>
  </div>
</template>

<script setup lang="ts">
import type { TileDefinition, DashboardDefinition, DashboardRendererContext } from '../types'
import Tile from './DashboardTile.vue'
import { INJECT_QUERY_PROVIDER } from '../types/query-provider'
import { inject } from 'vue'
import composables from '../composables'
import GridLayout from './layout/GridLayout.vue'

const props = defineProps<{
  context: DashboardRendererContext,
  definition: DashboardDefinition,
}>()

const { i18n } = composables.useI18n()

const queryBridge = inject(INJECT_QUERY_PROVIDER)

// Right now, tiles don't have unique keys.  Perhaps in the future they will,
// and we can use that instead of `index` as the fragment key.

</script>
