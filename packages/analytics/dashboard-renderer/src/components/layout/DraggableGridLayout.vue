<template>
  <div class="grid-wrapper">
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
        :gs-h="rowToGridStack(tile.layout.size.rows)"
        :gs-lazy-load="true"
        :gs-size-to-content="!editable"
        :gs-w="tile.layout.size.cols"
        :gs-x="tile.layout.position.col"
        :gs-y="rowToGridStack(tile.layout.position.row)"
      >
        <div class="grid-stack-item-content">
          <slot
            name="tile"
            :tile="tile"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang='ts' setup generic="T">
import { onMounted, onUnmounted, computed, ref, watch, nextTick, watchEffect } from 'vue'
import { GridStack } from 'gridstack'
import type { GridStackNode } from 'gridstack'
import type { GridTile } from 'src/types'
import 'gridstack/dist/gridstack.min.css'
import 'gridstack/dist/gridstack-extra.min.css'
import { DEFAULT_TILE_HEIGHT, MIN_CELL_HEIGHT } from '../../constants'
import { useDebounce } from '@kong-ui-public/core'

export type DraggableGridLayoutExpose<T> = {
  removeWidget: (id: number | string) => void
  redraw: () => void
  tiles: GridTile<T>[]
}

const props = withDefaults(defineProps<{
  tiles: GridTile<T>[]
  tileHeight?: number
  editable?: boolean
}>(), {
  tileHeight: DEFAULT_TILE_HEIGHT,
})

const rowToGridStack = (row) => props.editable ? row : row * Math.floor(props.tileHeight / MIN_CELL_HEIGHT)
const gridStackToRow = (gridRow) => props.editable ? gridRow : Math.floor(gridRow / Math.floor(props.tileHeight / MIN_CELL_HEIGHT))

const emit = defineEmits<{
  (e: 'update-tiles', tiles: GridTile<T>[]): void
}>()

const headerCursor = computed(() => props.editable ? 'move' : 'default')

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
          position: { col: Number(item.x), row: gridStackToRow(Number(item.y)) },
          size: { cols: Number(item.w), rows: gridStackToRow(Number(item.h)) },
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

onMounted(async () => {
  if (gridContainer.value) {
    grid = GridStack.init({
      margin: 10,
      column: 6,
      cellHeight: props.editable ? props.tileHeight : MIN_CELL_HEIGHT,
      cellHeightThrottle: 100,
      resizable: { handles: 'se, sw' },
      handle: '.tile-header',
      staticGrid: !props.editable,
      columnOpts: !props.editable ? {
        breakpointForWindow: true,
        columnMax: 6,
        breakpoints: [{
          w: 640, c: 1, // mobile
        }, {
          w: 1024, c: 2, // tablet
        }, {
          w: 1280, c: 4, // laptop
        }, {
          w: 1536, c: 6, // desktop
        }],
      } : {},
    }, gridContainer.value)

    if (props.editable) {
      grid.on('change', updateTiles)
      grid.on('added', updateTiles)
      grid.on('removed', removeHandler)
    }
  }
})

onUnmounted(() => {
  if (grid) {
    grid.destroy(false)
  }
})

const { debounce } = useDebounce()

const debouncedRedraw = debounce(() => {
  props.tiles.forEach(({ id }) => {
    const el = gridContainer.value.querySelector(makeSelector(id)) as HTMLElement
    grid.resizeToContent(el)
    grid.compact()
  })
}, 100)

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
        h: rowToGridStack(tile.layout.size.rows),
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

defineExpose({ removeWidget, redraw: debouncedRedraw })

</script>

<style lang="scss" scoped>
.grid-wrapper {
  /*
   * If you want space between your items in GridStack, you have to provide a
   * margin. If you provide a margin, GridStack forces you to have an outer
   * margin not just between tiles. So, anything using this component is always
   * 20 pixels (2 * margin size) shorter in both the x and y axis than the space
   * that's provided. To solve this we can wrap it with a basic div and give the
   * GridStack container negative margin. That makes it so content actually fits
   * the intended layout of anything that uses this component.
   */
  .grid-stack {
    margin: -10px;
  }
}

:deep(.tile-header) {
  cursor: v-bind('headerCursor');
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
