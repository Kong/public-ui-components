<template>
  <div
    ref="gridContainer"
    class="grid-stack"
  >
    <div
      v-for="tile in props.tiles"
      :key="tile.id"
      class="grid-stack-item"
      :data-id="`${tile.id}`"
      :data-testid="`grid-stack-item-${tile.id}`"
      :gs-h="tile.layout.size.rows"
      :gs-lazy-load="true"
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
import { onMounted, onUnmounted, ref, watch, nextTick, watchEffect } from 'vue'
import { GridStack } from 'gridstack'
import type { GridStackNode } from 'gridstack'
import type { GridSize, GridTile } from 'src/types'
import 'gridstack/dist/gridstack.min.css'
import 'gridstack/dist/gridstack-extra.min.css'

export type DraggableGridLayoutExpose<T> = {
  removeWidget: (id: number | string) => void,
  tiles: GridTile<T>[],
  gridSize: GridSize,
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

const tilesRef = ref<Map<string, GridTile<any>>>(new Map(props.tiles.map(t => [`${t.id}`, t])))

let grid: GridStack | null = null

const makeSelector = (id: number | string) => {
  return `[data-id="${id}"]`
}

const makeTilesFromGridItems = (items: GridStackNode[]) => {
  return items.map(item => {
    const tile = tilesRef.value.get(`${item.el?.getAttribute('data-id')}`)
    if (tile) {
      return {
        ...tile,
        layout: {
          position: { col: Number(item.x), row: Number(item.y) },
          size: { cols: Number(item.w), rows: Number(item.h) },
        },
      } satisfies GridTile<T>
    }
  }).filter(t => t !== undefined) as GridTile<T>[]
}

const updateTiles = (_: Event, items: GridStackNode[]) => {
  if (grid) {
    const updates = makeTilesFromGridItems(items)
    updates.forEach((tile) => {
      tilesRef.value.set(`${tile.id}`, tile)
    })
    emit('update-tiles', Array.from(tilesRef.value.values()))
  }
}

const removeHandler = (_: Event, items: GridStackNode[]) => {
  items.forEach(item => {
    tilesRef.value.delete(`${item.el?.getAttribute('data-id')}`)
  })
  emit('update-tiles', Array.from(tilesRef.value.values()))
}

onMounted(() => {
  if (gridContainer.value) {
    grid = GridStack.init({
      column: props.gridSize.cols,
      cellHeight: props.tileHeight,
      resizable: { handles: 'se, sw' },
      handle: '.tile-header',

    }, gridContainer.value)
    grid.on('change', updateTiles)
    grid.on('added', updateTiles)
    grid.on('removed', removeHandler)
  }
})

onUnmounted(() => {
  if (grid) {
    grid.destroy(false)
  }
})

const removeWidget = (id: number | string) => {
  if (grid && gridContainer.value) {
    const el = gridContainer.value.querySelector(makeSelector(id)) as HTMLElement
    if (el) {
      grid.removeWidget(el)
    }
  }
}

watch(() => props.tiles.length, async (newLen, oldLen) => {
  if (newLen > oldLen && grid) {
    const tileToAdd = props.tiles.slice(oldLen)
    for (const tile of tileToAdd) {
      tilesRef.value.set(`${tile.id}`, tile)
      await nextTick()
      grid.makeWidget(makeSelector(tile.id), {
        autoPosition: true,
        w: tile.layout.size.cols,
        h: tile.layout.size.rows,
      })
    }
  }
})

// Keep tilesRef in sync with props.tiles
watchEffect(() => {
  props.tiles.forEach(tile => {
    tilesRef.value.set(`${tile.id}`, tile)
  })
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
    background-image: url('../../icons/arrows_more_down-lightgray.svg');
    background-size: 16px 16px;
    cursor: se-resize;
    margin: 1px;
    transform: rotate($rotate);
  }
}

</style>
