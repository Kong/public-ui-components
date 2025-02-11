<template>
  <div
    ref="gridContainer"
    class="grid-stack"
  >
    <div
      v-for="(tile, i) in tiles"
      :key="i"
      class="grid-stack-item"
      :data-id="tile.id"
      :gs-h="tile.layout.size.rows"
      :gs-lazy-load="true"
      :gs-w="tile.layout.size.cols"
      :gs-x="tile.layout.position.col >= 0 ? tile.layout.position.col : undefined"
      :gs-y="tile.layout.position.row >= 0 ? tile.layout.position.row : undefined"
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
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { GridStack, type GridStackNode } from 'gridstack'
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

const makeTilesFromGridstackNodes = (items: GridStackNode[]) => {
  return props.tiles.map((tile) => {
    const item = items.find(item => Number(item.el?.getAttribute('data-id')) === tile.id)
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
}

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
      const updatedTiles = makeTilesFromGridstackNodes(items)
      emit('update-tiles', updatedTiles)
    })
    grid.on('added', (_, items) => {
      const updatedTiles = makeTilesFromGridstackNodes(items)
      emit('update-tiles', updatedTiles)
    })
  }
})

onUnmounted(() => {
  if (grid) {
    grid.destroy(false)
  }
})

watch(() => props.tiles.length, async (newLen, oldLen) => {
  if (newLen > oldLen && grid) {
    await nextTick()
    const tileToAdd = props.tiles.slice(oldLen)
    const nodesToAdd = tileToAdd.map(e => {
      return {
        w: e.layout.size.cols,
        h: e.layout.size.rows,
        autoPosition: true,
        el: gridContainer.value?.querySelector(`[data-id="${e.id}"]`) as HTMLElement,
      } as GridStackNode
    })
    grid.load(nodesToAdd)
  }
})
</script>

<style lang="scss" scoped>
:deep(.tile-header) {
  cursor: move;
}
</style>
