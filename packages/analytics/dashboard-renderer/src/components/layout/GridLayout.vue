<template>
  <div
    ref="gridContainer"
    class="kong-ui-public-grid-layout"
  >
    <div
      v-for="cell in totalCells"
      :key="cell.key"
      class="grid-cell"
      :class="{
        'empty-cell': !cell.tile,
      }"
      :style="cell.tile && {
        gridRow: `span ${cell.tile.size.rows}`,
        gridColumn: `span ${cell.tile.size.cols}`,
      }"
    >
      <slot
        v-if="cell.tile"
        class="tile-content"
        name="tile"
        :tile="cell.tile"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType, ref, reactive } from 'vue'
import type { GridSize, Tile, Cell } from 'src/types'
import { DEFAULT_TILE_HEIGHT, DEFAULT_TILE_WIDTH } from '../../constants'

const props = defineProps({
  gridSize: {
    type: Object as PropType<GridSize>,
    required: true,
  },
  tileHeight: {
    type: Number,
    required: false,
    default: DEFAULT_TILE_HEIGHT,
  },
  tileWidth: {
    type: Number,
    required: false,
    default: DEFAULT_TILE_WIDTH,
  },
  tiles: {
    type: Array as PropType<Tile[]>,
    required: true,
  },
})

const gridCols = ref(props.gridSize.cols)
const gridRows = ref(props.gridSize.rows)
const gridContainer = ref<HTMLElement>()
const localTiles = reactive([...props.tiles])

const totalCells = computed<Cell[]>(() => {
  const cells: Cell[] = []
  const occupied = new Set()
  const total = gridRows.value * gridCols.value
  for (let index = 0; index < total; index++) {
    const row = Math.floor(index / gridCols.value) + 1
    const col = index % gridCols.value + 1
    const key = `row-${row}-col-${col}`

    if (occupied.has(key)) {
      continue
    }

    const tile = localTiles.find(t => t.position.row === row && t.position.col === col)

    // Create cell
    cells.push({
      key,
      tile,
    })

    // If cell has tile mark positions as occupied
    if (tile) {
      const tileSpan = tile.size.rows * tile.size.cols
      for (let i = 0; i < tileSpan; i++) {
        const rowSpan = Math.floor(i / tile.size.cols)
        const colSpan = i % tile.size.cols
        occupied.add(`row-${row + rowSpan}-col-${col + colSpan}`)
      }
    }

  }

  return cells
})

const tileWidthPixels = computed(() => `${props.tileWidth}px`)
const tileHeightPixels = computed(() => `${props.tileHeight}px`)

</script>

<style lang="scss" scoped>
.kong-ui-public-grid-layout {
  box-sizing: border-box;
  display: grid;
  gap: $kui-space-20;
  grid-template-columns: repeat(v-bind('gridSize.cols'), 1fr);
  grid-template-rows: repeat(v-bind('gridSize.rows'), 1fr);

  .grid-cell {
    box-sizing: border-box;
    min-height: v-bind('tileHeightPixels');
    min-width: v-bind('tileWidthPixels');
  }

  .tile-content {
    height: 100%;
    width: 100%;
  }
}

@media (max-width: $kui-breakpoint-mobile) {
  .kong-ui-public-grid-layout {
    display: flex;
    flex-direction: column;

    .empty-cell {
      display: none;
    }
  }
}
</style>
