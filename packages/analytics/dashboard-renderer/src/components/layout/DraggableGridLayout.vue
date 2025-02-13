<template>
  <div
    ref="gridContainer"
    class="grid-stack"
  >
    <div
      v-for="tile in tilesRef"
      :id="`tile-${tile.id}`"
      :key="tile.id"
      class="grid-stack-item"
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

<script lang='ts' setup>
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { GridStack } from 'gridstack'
import { useDebounceFn } from '@vueuse/core'
import type { GridStackNode } from 'gridstack'
import type { GridSize, GridTile } from 'src/types'
import 'gridstack/dist/gridstack.min.css'
import 'gridstack/dist/gridstack-extra.min.css'
import type { TileDefinition } from '@kong-ui-public/analytics-utilities'

export type DraggableGridLayoutExpose = {
  removeWidget: (id: number | string) => void
}

const props = withDefaults(defineProps<{
  tiles: GridTile<TileDefinition>[],
  gridSize: GridSize,
  tileHeight?: number,
}>(), {
  tileHeight: 200,
})
const emit = defineEmits<{
  (e: 'update-tiles', tiles: GridTile<TileDefinition>[]): void,
}>()

const gridContainer = ref<HTMLDivElement | null>(null)
const tilesRef = ref<GridTile<any>[]>(props.tiles)
let grid: GridStack | null = null

const makeTilesFromGridstackNodes = (items: GridStackNode[]) => {
  return tilesRef.value.map((tile: GridTile<any>) => {
    const item = items.find(item => {
      return item.el?.id === `tile-${tile.id}`
    })
    if (item) {
      return {
        ...tile,
        layout: {
          position: { col: Number(item.x), row: Number(item.y) },
          size: { cols: Number(item.w), rows: Number(item.h) },
        },
      } satisfies GridTile<TileDefinition>
    }
    return tile
  })
}

const removeTile = (items: GridStackNode[]) => {
  return tilesRef.value.filter(tile => {
    return !items.find(item => {
      return item.el?.id === `tile-${tile.id}`
    })
  }) as GridTile<TileDefinition>[]
}

const changeHandler = useDebounceFn((_: Event, items: GridStackNode[]) => {
  const updatedTiles = makeTilesFromGridstackNodes(items)
  emit('update-tiles', updatedTiles)
}, 200)

onMounted(() => {
  if (gridContainer.value) {
    grid = GridStack.init({
      column: props.gridSize.cols,
      cellHeight: props.tileHeight,
      resizable: { handles: 'se, sw' },
      lazyLoad: true,
      handle: '.tile-header',

    }, gridContainer.value)
    grid.on('change', changeHandler)
    grid.on('added', changeHandler)
    grid.on('removed', (_, items) => {
      tilesRef.value = removeTile(items)
    })
  }
})

onUnmounted(() => {
  if (grid) {
    grid.destroy(false)
  }
})

const removeWidget = (id: number | string) => {
  if (grid && gridContainer.value) {
    const el = gridContainer.value.querySelector(`#tile-${id}`) as HTMLElement
    if (el) {
      grid.removeWidget(el)
      grid.compact('compact', false)
    }
  }
}

watch(() => props.tiles.length, async (newLen, oldLen) => {
  if (newLen > oldLen && grid) {
    const tileToAdd = props.tiles.slice(oldLen)
    for (const tile of tileToAdd) {
      tilesRef.value.push(tile)
      await nextTick()
      grid.makeWidget(`#tile-${tile.id}`, {
        autoPosition: true,
        w: tile.layout.size.cols,
        h: tile.layout.size.rows,
        lazyLoad: true,
      })
    }
  }
})

// Gridstack widgets are driven by a copy of props.tiles.
// If the meta of a tile changes, we need to update the copy to keep it in sync.
watch(() => props.tiles, (newTiles, oldTiles) => {
  if (newTiles.length === oldTiles.length) {
    for (const [i, tile] of newTiles.entries()) {
      if (JSON.stringify(tile.meta) !== JSON.stringify(tilesRef.value[i].meta)) {
        tilesRef.value[i].meta = tile.meta
      }
    }
  }
})

defineExpose({ removeWidget })

</script>

<style lang="scss" scoped>
:deep(.tile-header) {
  cursor: move;
}
$rotate-values: (
  'se': 0deg,
  'sw': 90deg,
);

@each $direction, $rotate in $rotate-values {
  :deep(.ui-resizable-#{$direction}) {
    background-image: url('../../icons/arrows_more_down.svg');
    cursor: se-resize;
    margin: 5px;
    transform: rotate($rotate);
  }
}

</style>
