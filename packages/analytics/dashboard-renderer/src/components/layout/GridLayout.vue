<template>
  <div
    ref="gridContainer"
    class="kong-ui-public-grid-layout"
  >
    <div
      v-for="cell in gridCells"
      :key="cell.key"
      class="grid-cell"
      :class="{
        'empty-cell': !cell.tile,
      }"
      :style="cell.style"
    >
      <slot
        name="tile"
        :style="cell.style"
        :tile="cell.tile"
      />
    </div>
  </div>
</template>

<script lang="ts" setup generic="T">
import { computed, type PropType, ref, onMounted, onUnmounted } from 'vue'
import type { Cell, GridTile } from 'src/types'
import { DASHBOARD_COLS, DEFAULT_TILE_HEIGHT } from '../../constants'
import { calculateRowDefs } from './grid-utils'

const props = defineProps({
  tileHeight: {
    type: Number,
    required: false,
    default: () => DEFAULT_TILE_HEIGHT,
  },
  tiles: {
    type: Array as PropType<Array<GridTile<T>>>,
    required: true,
  },
})

const gridContainer = ref(null)

const containerWidth = ref(0)

const resizeObserver = new ResizeObserver(entries => {
  // Wrapper 'window.requestAnimationFrame' is needed for disabling "ResizeObserver loop limit exceeded" error in DD
  window.requestAnimationFrame(() => {
    if (!Array.isArray(entries) || entries[0] === undefined) {
      return
    }

    // Only observing one element
    containerWidth.value = entries[0].contentRect.width
  })
})

onMounted(() => {
  if (gridContainer.value) {
    resizeObserver.observe(gridContainer.value)
  }
})

onUnmounted(() => {
  if (gridContainer.value) {
    resizeObserver.unobserve(gridContainer.value)
  }
})

const rowDefinition = computed<string>(() => {
  const rowDefs = calculateRowDefs(props.tileHeight, props.tiles)

  return rowDefs.join(' ')
})

const gridCells = computed<Array<Cell<T>>>(() => {
  return props.tiles.map((tile, i) => {
    return {
      key: `tile-${i}`,
      tile,
      style: {
        'grid-column-start': tile.layout.position.col + 1,
        'grid-column-end': tile.layout.position.col + 1 + tile.layout.size.cols,
        'grid-row-start': tile.layout.position.row + 1,
        'grid-row-end': tile.layout.position.row + 1 + tile.layout.size.rows,
      },
    }
  })
})

</script>

<style lang="scss" scoped>
.kong-ui-public-grid-layout {
  display: grid;
  gap: var(--kui-space-70, $kui-space-70);
  grid-template-columns: repeat(v-bind('DASHBOARD_COLS'), 1fr);
  grid-template-rows: v-bind('rowDefinition');
  width: 100%;
}

@media (max-width: $kui-breakpoint-phablet) {
  .kong-ui-public-grid-layout {
    display: flex;
    flex-direction: column;

    .grid-cell {
      height: auto !important;
      left: auto !important;
      position: relative;
      top: auto !important;
      transform: none !important;
      width: auto !important;

      &:not(:first-child) {
        margin-top: var(--kui-space-70, $kui-space-70);
      }
    }

    .empty-cell {
      display: none;
    }
  }
}
</style>
