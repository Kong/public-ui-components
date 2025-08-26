<template>
  <section
    class="empty-grid"
    data-testid="dashboard-empty-state"
  >
    <DashboardEmptyTile
      can-add-tile
      class="tile"
      :message="message"
      @add-tile="$emit('add-tile')"
    />

    <DashedBorder
      v-for="i in ghostTiles"
      :key="i"
      class="tile ghost"
    />
  </section>
</template>

<script setup lang="ts">
import DashboardEmptyTile from './DashboardEmptyTile.vue'
import DashedBorder from './layout/DashedBorder.vue'

withDefaults(defineProps<{
  /** show the add-tile tile first */
  canAddTile?: boolean
  /** message for the first tile */
  message?: string
  /** how many dashed placeholders to render */
  ghostTiles?: number
}>(), {
  canAddTile: true,
  message: undefined,
  ghostTiles: 2,
})

defineEmits<{
  (e: 'add-tile'): void
}>()
</script>

<style lang="scss" scoped>
.empty-grid {
  align-items: stretch;
  display: grid;
  gap: $kui-space-70;
  grid-auto-rows: minmax(276px, auto);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  height: auto;
  margin: $kui-space-70 auto;
  width: 100%;
}

.tile {
  height: 100%;
  min-height: 276px;
}

.tile:nth-child(3n) {
  grid-column: 1 / -1;
  min-height: 452px;
}

@media (max-width: 768px) {
  .empty-grid {
    grid-template-columns: 1fr;
  }

  .tile:nth-child(3n) {
    grid-column: auto;
    min-height: 276px;
  }
}
</style>
