<template>
  <div class="kong-ui-public-dashboard-renderer">
    <KAlert
      v-if="!queryBridge"
      appearance="danger"
    >
      No query bridge provided.  Unable to render dashboard.
    </KAlert>
    <!-- Right now, tiles don't have unique keys.  Perhaps in the future they will, and this can be more specific? -->
    <Tile
      v-for="(tile, index) in props.definition.tiles"
      v-else
      :key="index"
      :definition="tile"
    />
  </div>
</template>

<script setup lang="ts">
import type { DashboardDefinition, DashboardRendererContext } from '../types'
import Tile from './DashboardTile.vue'
import { INJECT_QUERY_PROVIDER } from '../types/query-provider'
import { inject } from 'vue'

const props = defineProps<{
  context: DashboardRendererContext,
  definition: DashboardDefinition,
}>()

const queryBridge = inject(INJECT_QUERY_PROVIDER)

</script>

<style lang="scss" scoped>
.kong-ui-public-dashboard-renderer {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
}
</style>
