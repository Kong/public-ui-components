<template>
  <div
    ref="gridContainer"
    class="grid-stack"
  >
    <div
      v-for="(tile, i) in tiles"
      :key="'tile-' + i"
      class="grid-stack-item"
      :data-index="i"
      :gs-h="tile.layout.size.rows"
      :gs-w="tile.layout.size.cols"
      :gs-x="tile.layout.position.col"
      :gs-y="tile.layout.position.row"
    >
      <div class="grid-stack-item-content">
        <slot
          name="tile"
          :tile="tile"
        />
      </div>
    </div>
  </div>
</template>

<script lang='ts' setup generic="T">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { GridStack } from 'gridstack'
import type { GridSize, GridTile } from 'src/types'
import 'gridstack/dist/gridstack.min.css'
import 'gridstack/dist/gridstack-extra.min.css'

const props = withDefaults(defineProps<{
  tiles: GridTile<T>[],
  gridSize: GridSize,
  tileHeight?: number,
}>(), {
  tileHeight: 200,
})
const emit = defineEmits<{
  (e: 'update-tiles', tiles: GridTile<T>[]): void,
}>()

const gridContainer = ref<HTMLDivElement | null>(null)
let grid: GridStack | null = null

onMounted(() => {
  if (gridContainer.value) {
    grid = GridStack.init({
      column: props.gridSize.cols,
      cellHeight: props.tileHeight,
      resizable: { handles: 'se' },
      lazyLoad: true,
      handle: '.tile-header',
    }, gridContainer.value)
    grid.on('change', (_, items) => {
      const updatedTiles: GridTile<any>[] = props.tiles.map((tile, i) => {
        const item = items.find(item => Number(item.el?.getAttribute('data-index')) === i)
        if (item) {
          return {
            ...tile,
            layout: {
              position: { col: item.x, row: item.y },
              size: { cols: item.w, rows: item.h },
            },
          } as GridTile<any>
        }
        return tile
      })
      emit('update-tiles', updatedTiles)
    })
  }
})

onUnmounted(() => {
  if (grid) {
    grid.destroy(false)
  }
})

watch(() => props.tiles, newTiles => {
  if (grid && gridContainer.value) {
    newTiles.forEach((tile, i) => {
      const el = gridContainer.value?.querySelector(`[data-index="${i}"]`)
      if (el) {
        grid?.update(el as HTMLElement, {
          x: tile.layout.position.col,
          y: tile.layout.position.row,
          w: tile.layout.size.cols,
          h: tile.layout.size.rows,
        })
      }
    })
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
:deep(.tile-header) {
  cursor: move;
}
</style>
