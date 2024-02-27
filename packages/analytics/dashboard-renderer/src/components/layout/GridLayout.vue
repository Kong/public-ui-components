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
import type { GridSize, Cell, GridTile } from 'src/types'
import { DEFAULT_TILE_HEIGHT } from '../../constants'
import { KUI_SPACE_70 } from '@kong/design-tokens'

const GAP_SIZE = parseInt(KUI_SPACE_70)

const props = defineProps({
  gridSize: {
    type: Object as PropType<GridSize>,
    required: true,
  },
  tileHeight: {
    type: Number,
    required: false,
    default: () => DEFAULT_TILE_HEIGHT,
  },
  tiles: {
    type: Array as PropType<GridTile<T>[]>,
    required: true,
  },
})

const gridContainer = ref(null)

const containerWidth = ref(0)

const resizeObserver = new ResizeObserver(entries => {
  // Only observing one element
  containerWidth.value = entries[0].contentRect.width
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

const tileWidth = computed(() => {
  return (containerWidth.value / props.gridSize.cols) - GAP_SIZE
})

const tilesPerRow = computed(() => {
  const count = new Array(props.gridSize.rows).fill(0) // Initialize an array to hold the count of tiles per row

  props.tiles.forEach(tile => {
    const rowIndex = tile.layout.position.row // Assuming rows are zero-indexed
    count[rowIndex]++
  })

  return count
})

const gridCells = computed<Cell<T>[]>(() => {
  const rowTileCounts: number[] = []
  return props.tiles.map((tile, i) => {
    const row = tile.layout.position.row

    // If this row hasn't been encountered yet, initialize its count
    if (!rowTileCounts[row]) {
      rowTileCounts[row] = 0
    }

    // Increment the tile count for this row to determine the tile's ordinal position
    rowTileCounts[row]++

    // This is the tile's nth position in its row
    const nthPosition = rowTileCounts[row]
    // Position elements based on their grid position and dimensions.
    let translateX = tile.layout.position.col * (tileWidth.value + GAP_SIZE)
    if (tile.layout.position.col > 0) {
      translateX += (GAP_SIZE / tilesPerRow.value[tile.layout.position.row]) * (nthPosition - 1)
    }
    const translateY = tile.layout.position.row * (props.tileHeight + GAP_SIZE)
    // Size tiles based on their dimensions and cell span.
    const width = tile.layout.size.cols * tileWidth.value + (GAP_SIZE * (tile.layout.size.cols - 1)) + (GAP_SIZE / tilesPerRow.value[tile.layout.position.row]) - 1
    const height = tile.layout.size.rows * props.tileHeight + (GAP_SIZE * (tile.layout.size.rows - 1))

    return {
      key: `tile-${i}`,
      tile,
      style: {
        transform: `translate(${translateX}px, ${translateY}px)`,
        width: `${width}px`,
        height: `${height}px`,
      },
    }
  })
})

const gridHeight = computed(() => {
  // get the tile with the highest row and add its height
  const highestRow = Math.max(...props.tiles.map(tile => tile.layout.position.row + tile.layout.size.rows))
  return highestRow * props.tileHeight + (GAP_SIZE * props.gridSize.rows)
})

</script>

<style lang="scss" scoped>
.kong-ui-public-grid-layout {
  height: v-bind('`${gridHeight}px`');
  width: 100%;
}
.grid-cell {
  position: absolute;
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
        margin-top: $kui-space-70;
      }
    }

    .empty-cell {
      display: none;
    }
  }
}
</style>
