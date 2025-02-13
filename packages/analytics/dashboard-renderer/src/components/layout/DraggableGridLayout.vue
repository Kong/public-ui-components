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

<script lang='ts' setup generic="T">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { GridStack } from 'gridstack'
import { useDebounceFn } from '@vueuse/core'
import type { GridStackNode } from 'gridstack'
import type { GridSize, GridTile } from 'src/types'
import 'gridstack/dist/gridstack.min.css'
import 'gridstack/dist/gridstack-extra.min.css'

export type DraggableGridLayoutExpose = {
  removeWidget: (id: number | string) => void
}

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
      } satisfies GridTile<T>
    }
    return tile
  })
}

const removeTile = (items: GridStackNode[]) => {
  return tilesRef.value.filter(tile => {
    return !items.find(item => {
      return item.el?.id === `tile-${tile.id}`
    })
  }) as GridTile<T>[]
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

const removeWidget = (id: number | string) => {
  if (grid && gridContainer.value) {
    const el = gridContainer.value.querySelector(`#tile-${id}`) as HTMLElement
    if (el) {
      grid.removeWidget(el)
      grid.compact('compact', false)
    }
  }
}

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
