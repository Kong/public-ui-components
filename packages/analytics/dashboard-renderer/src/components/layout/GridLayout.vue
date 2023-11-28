<template>
  <div class="kong-ui-public-grid-layout">
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
        :tile="cell.tile"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType, reactive } from 'vue'
import type { GridSize, Cell, GridTile } from 'src/types'
import { DEFAULT_TILE_HEIGHT, DEFAULT_TILE_WIDTH } from '../../constants'
import { KUI_SPACE_20 } from '@kong/design-tokens'

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
  tileWidth: {
    type: Number,
    required: false,
    default: () => DEFAULT_TILE_WIDTH,
  },
  tiles: {
    type: Array as PropType<GridTile[]>,
    required: true,
  },
})

const localTiles = reactive([...props.tiles])

const gridCells = computed<Cell[]>(() => {
  const gapSize = parseInt(KUI_SPACE_20)

  return localTiles.map(tile => {
    // Position elements based on their grid position and dimensions.
    const translateX = tile.layout.position.col * (props.tileWidth + gapSize)
    const translateY = tile.layout.position.row * (props.tileHeight + gapSize)

    // Size tiles based on their dimensions and cell span.
    const width = (tile.layout.size.cols * props.tileWidth) + (tile.layout.size.cols * gapSize)
    const height = (tile.layout.size.rows * props.tileHeight) + (tile.layout.size.rows * gapSize)

    return {
      key: `tile-${tile.id}`,
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
  const highestRow = Math.max(...localTiles.map(tile => tile.layout.position.row + tile.layout.size.rows))
  return highestRow * props.tileHeight
})

const gridWidth = computed(() => {
  const gapSize = parseInt(KUI_SPACE_20)
  return props.gridSize.cols * (props.tileWidth + gapSize) + (props.gridSize.cols)
})

</script>

<style lang="scss" scoped>
.kong-ui-public-grid-layout {
  height: v-bind('`${gridHeight}px`');
  position: relative; // Container for absolutely positioned item
  width: v-bind('`${gridWidth}px`');
}

.grid-cell {
  padding: $kui-space-20;
  position: absolute;
}

@media (max-width: $kui-breakpoint-phablet) {
  .kong-ui-public-grid-layout {
    display: flex;
    flex-direction: column;

    .grid-cell {
      height: auto !important;
      left: auto !important;
      margin: $kui-space-10;
      position: relative;
      top: auto !important;
      transform: none !important;
      width: auto !important;
    }

    .empty-cell {
      display: none;
    }
  }
}
</style>
