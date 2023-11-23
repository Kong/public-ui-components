<template>
  <div class="kong-ui-public-grid-layout">
    <div
      v-for="cell in totalCells"
      :key="cell.key"
      class="grid-cell"
      :style="{
        gridRow: `span ${cell.tile?.size.rows}`,
        gridColumn: `span ${cell.tile?.size.cols}`,
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
import { defineProps, computed, type PropType } from 'vue'
import type { GridSize, Tile } from 'src/types'

interface Cell {
  key: string
  tile?: Tile
}

const props = defineProps({
  gridSize: {
    type: Object as PropType<GridSize>,
    required: true,
  },
  tileHeight: {
    type: Number,
    required: false,
    default: 150,
  },
  tileWidth: {
    type: Number,
    required: false,
    default: 150,
  },
  tiles: {
    type: Array as PropType<Tile[]>,
    required: true,
  },
})

const totalCells = computed<Cell[]>(() => {
  const cells: Cell[] = []
  const occupied = new Set()

  for (let row = 1; row <= props.gridSize.rows; row++) {
    for (let col = 1; col <= props.gridSize.cols; col++) {
      const key = `row-${row}-col-${col}`

      // Skip cell creation if the position is already occupied by a spanning tile
      if (occupied.has(key)) continue

      const tile = props.tiles.find(t => t.position.row === row && t.position.col === col)
      cells.push({
        key,
        tile,
      })

      // If the cell has a tile that spans multiple rows/cols,
      // mark all spanned positions as occupied
      if (tile) {
        for (let i = 0; i < tile.size.rows; i++) {
          for (let j = 0; j < tile.size.cols; j++) {
            occupied.add(`row-${row + i}-col-${col + j}`)
          }
        }
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
  gap: 10px;
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

@media (max-width: 750px) {
  .kong-ui-public-grid-layout {
    grid-template-columns: repeat(auto-fill, minmax(v-bind('tileWidthPixels'), 1fr));
  }
}
</style>
