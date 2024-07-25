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
      :data-swapy-slot="cell.key"
      :style="cell.style"
    >
      <div :data-swapy-item="cell.key">
        <slot
          name="tile"
          :style="cell.style"
          :tile="cell.tile"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup generic="T">
import { computed, type PropType, ref, onMounted, onUnmounted } from 'vue'
import type { GridSize, Cell, GridTile } from 'src/types'
import { DEFAULT_TILE_HEIGHT } from '../../constants'
import { calculateRowDefs } from './grid-utils'
import { createSwapy } from 'swapy'

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
  dragAndDrop: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const gridContainer = ref(null)


const containerWidth = ref(0)

const resizeObserver = new ResizeObserver(entries => {
  // Wrapper 'window.requestAnimationFrame' is needed for disabling "ResizeObserver loop limit exceeded" error in DD
  window.requestAnimationFrame(() => {
    if (!Array.isArray(entries) || !entries.length) {
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

  const swapy = createSwapy(gridContainer.value, {
    animation: 'dynamic', // or spring or none
  })
  swapy.enable(props.dragAndDrop)
})

onUnmounted(() => {
  if (gridContainer.value) {
    resizeObserver.unobserve(gridContainer.value)
  }
})

const rowDefinition = computed<string>(() => {
  const rowDefs = calculateRowDefs(props.gridSize?.rows, props.tileHeight, props.tiles)

  return rowDefs.join(' ')
})

const gridCells = computed<Cell<T>[]>(() => {
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
  gap: $kui-space-70;
  grid-template-columns: repeat(v-bind('gridSize.cols'), 1fr);
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
        margin-top: $kui-space-70;
      }
    }

    .empty-cell {
      display: none;
    }
  }
}
</style>
