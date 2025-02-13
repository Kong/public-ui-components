<template>
  <div
    ref="gridContainer"
    class="grid-stack"
  >
    <div
      v-for="tile in tilesRef.values()"
      :key="tile.id"
      class="grid-stack-item"
      :data-id="`${tile.id}`"
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
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { GridStack } from 'gridstack'
import type { GridItemHTMLElement, GridStackNode } from 'gridstack'
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

const tilesRef = ref<Map<string, GridTile<any>>>(new Map(props.tiles.map(t => [`${t.id}`, t])))

let grid: GridStack | null = null

const makeSelector = (id: number | string) => {
  return `[data-id="${id}"]`
}

const makeTilesFromGridItemHtmlElements = (items: GridItemHTMLElement[]) => {
  return Array.from(tilesRef.value.values()).map((tile: GridTile<any>) => {
    const item = items.find(item => {
      return item.getAttribute('data-id') === `${tile.id}`
    })
    if (item) {
      return {
        ...tile,
        layout: {
          position: { col: Number(item.gridstackNode?.x), row: Number(item.gridstackNode?.y) },
          size: { cols: Number(item.gridstackNode?.w), rows: Number(item.gridstackNode?.h) },
        },
      } satisfies GridTile<T>
    }
    return tile
  })
}

const updateTiles = () => {
  if (grid) {
    const items = grid.getGridItems()
    const updates = makeTilesFromGridItemHtmlElements(items)
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
      lazyLoad: true,
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

const removeWidget = async (id: number | string) => {
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

// Gridstack widgets are driven by a copy of props.tiles.
// If the meta of a tile changes, we need to update the copy to keep it in sync.
watch(() => props.tiles, (newTiles, oldTiles) => {
  if (newTiles.length === oldTiles.length) {
    newTiles.forEach(tile => {
      const current = tilesRef.value.get(`${tile.id}`)
      if (current) {
        tilesRef.value.set(`${tile.id}`, {
          ...current,
          meta: tile.meta,
        })
      }
    })
  }
}, { deep: true })

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
