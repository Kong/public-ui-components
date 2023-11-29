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
        :tile="cell.tile"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType, ref, onMounted, onUnmounted } from 'vue'
import type { GridSize, Cell, GridTile } from 'src/types'
import { DEFAULT_TILE_HEIGHT } from '../../constants'
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
  tiles: {
    type: Array as PropType<GridTile[]>,
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
  const gapSize = parseInt(KUI_SPACE_20)

  return (containerWidth.value / props.gridSize.cols) - gapSize
})

const gridCells = computed<Cell[]>(() => {
  const gapSize = parseInt(KUI_SPACE_20)

  return props.tiles.map(tile => {
    // Position elements based on their grid position and dimensions.
    const translateX = tile.layout.position.col * (tileWidth.value + gapSize)
    const translateY = tile.layout.position.row * (props.tileHeight + gapSize)

    // Size tiles based on their dimensions and cell span.
    const width = tile.layout.size.cols * tileWidth.value + gapSize * (tile.layout.size.cols - 1)
    const height = tile.layout.size.rows * props.tileHeight - gapSize * (tile.layout.size.rows - 1)

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
  const highestRow = Math.max(...props.tiles.map(tile => tile.layout.position.row + tile.layout.size.rows))
  return highestRow * props.tileHeight
})

</script>

<style lang="scss" scoped>
.kong-ui-public-grid-layout {
  height: v-bind('`${gridHeight}px`');
  width: 100%;
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
