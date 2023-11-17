<template>
  <div class="kong-ui-public-dashboard-renderer">
    <KAlert
      v-if="!queryBridge"
      appearance="danger"
    >
      {{ i18n.t('renderer.noQueryBridge') }}
    </KAlert>
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
import composables from '../composables'

const props = defineProps<{
  context: DashboardRendererContext,
  definition: DashboardDefinition,
}>()

const { i18n } = composables.useI18n()

const queryBridge = inject(INJECT_QUERY_PROVIDER)

// Right now, tiles don't have unique keys.  Perhaps in the future they will,
// and we can use that instead of `index` as the fragment key.

</script>

<style lang="scss" scoped>
.kong-ui-public-dashboard-renderer {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
}
</style>
