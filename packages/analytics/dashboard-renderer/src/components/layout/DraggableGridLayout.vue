<template>
  <div
    ref="gridContainer"
    class="grid-stack"
    :style="{ marginBottom: `-${bottomTrim + slackPx}px` }"
  >
    <div
      v-for="tile in props.tiles"
      :key="tile.id"
      :data-id="`${tile.id}`"
      :data-testid="`grid-stack-item-${tile.id}`"
    >
      <div class="grid-stack-item-content">
        <slot
          :fit-to-content="fitToContent(tile)"
          name="tile"
          :tile="tile"
        />
      </div>
    </div>
  </div>
</template>

<script lang='ts' setup generic="T">
import type { GridStackNode, GridStackOptions, GridStackWidget } from 'gridstack'
import type { GridTile } from 'src/types'

import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { GridStack } from 'gridstack'
import { KUI_BREAKPOINT_PHABLET, KUI_SPACE_50 } from '@kong/design-tokens'

import { CELLS_PER_ROW, DASHBOARD_COLS, DEFAULT_TILE_HEIGHT } from '../../constants'
import { calculateRowDefs, layoutRows } from './grid-utils'
import 'gridstack/dist/gridstack.min.css'
import 'gridstack/dist/gridstack-extra.min.css'

export type DraggableGridLayoutExpose<T> = {
  removeWidget: (id: number | string) => void
  tiles: Array<GridTile<T>>
}

const props = withDefaults(defineProps<{
  tiles: Array<GridTile<T>>
  tileHeight?: number
  columns?: number
  editable?: boolean
  /**
   * px to pull the grid's bottom edge up by, to cancel out the bottom margin of its last row
   */
  bottomTrim?: number
}>(), {
  tileHeight: DEFAULT_TILE_HEIGHT,
  columns: DASHBOARD_COLS,
  editable: false,
  bottomTrim: 0,
})
const emit = defineEmits<{
  (e: 'update-tiles', tiles: Array<GridTile<T>>): void
}>()

const gridContainer = ref<HTMLDivElement | null>(null)

const tilesRef = ref<Map<string, GridTile<any>>>(new Map(props.tiles.map(t => [`${t.id}`, t])))

let grid: GridStack | null = null
let isSyncing = false

const makeSelector = (id: number | string) => {
  return `[data-id="${id}"]`
}

const rowDefs = computed(() => calculateRowDefs(props.tileHeight, props.tiles))

const fitToContent = (tile: GridTile<T>): boolean => (
  !props.editable && rowDefs.value[tile.layout.position.row] === 'auto'
)

// View mode splits each row into smaller cells so fit_to_content can shrink below the tileHeight
const cellsPerRow = (): number => (
  props.editable ? 1 : CELLS_PER_ROW
)

const margin = parseInt(KUI_SPACE_50, 10) / 2

// Tile id mapped to its content height in cells
const measured = ref<ReadonlyMap<string, number>>(new Map())

// Tile id mapped to its content height in px
const measuredPx = ref<ReadonlyMap<string, number>>(new Map())

const singleColumn = ref(false)

// A single column sizes every tile to its content, not just fit content tiles
const sizedToContent = (tile: GridTile<T>): boolean => (
  singleColumn.value || fitToContent(tile)
)

// View mode places tiles by dashboard row instead of using gridstack's sizeToContent
const viewLayout = computed(() => layoutRows(props.tiles, rowDefs.value, measured.value, {
  cellsPerRow: CELLS_PER_ROW,
  columns: singleColumn.value ? 1 : props.columns,
}))

// The grid reserves whole cells for the last row, so a fit content row is usually a little taller than its tile.
// This is that leftover in px, which is also pulled off the grid's bottom edge.
const slackPx = computed<number>(() => {
  if (props.editable) {
    return 0
  }

  const lastTiles = singleColumn.value
    ? [...props.tiles].sort((a, b) => a.layout.position.row - b.layout.position.row || a.layout.position.col - b.layout.position.col).slice(-1)
    : props.tiles.filter(t => t.layout.position.row === rowDefs.value.length - 1)
  const tiles = lastTiles.filter(t => measured.value.has(`${t.id}`))

  // A last row at a fixed height has no rounding leftover
  if (!tiles.length || !tiles.every(sizedToContent)) {
    return 0
  }

  const cells = Math.max(...tiles.map(t => measured.value.get(`${t.id}`)!))
  const contentPx = Math.max(...tiles.map(t => measuredPx.value.get(`${t.id}`)!))
  const slack = cells * (props.tileHeight / CELLS_PER_ROW) - (contentPx + 2 * margin)

  return Math.max(0, Math.round(slack * 100) / 100)
})

const toWidget = (tile: GridTile<T>): GridStackWidget => {
  if (!props.editable) {
    return { id: `${tile.id}`, ...viewLayout.value.get(`${tile.id}`) }
  }

  return {
    id: `${tile.id}`,
    x: tile.layout.position.col,
    y: tile.layout.position.row,
    w: tile.layout.size.cols,
    h: tile.layout.size.rows,
  }
}

const gridOptions = (): GridStackOptions => ({
  margin,
  column: props.columns,
  cellHeight: props.tileHeight / cellsPerRow(),
  resizable: { handles: 'se, sw' },
  handle: '.tile-header',
  staticGrid: !props.editable,
  float: !props.editable,
})

const makeTilesFromGridItems = (items: GridStackNode[]) => {
  return items.map(item => {
    const tile = tilesRef.value.get(`${item.el?.getAttribute('data-id')}`)
    if (tile) {
      return {
        ...tile,
        layout: {
          position: { col: Number(item.x), row: Number(item.y) },
          size: { ...tile.layout.size, cols: Number(item.w), rows: Number(item.h) },
        },
      } satisfies GridTile<T>
    }
  }).filter(t => t !== undefined) as Array<GridTile<T>>
}

const updateTiles = (_: Event, items: GridStackNode[]) => {
  if (grid && !isSyncing) {
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

const contentOf = (id: number | string) => {
  return gridContainer.value?.querySelector<HTMLElement>(`${makeSelector(id)} > .grid-stack-item-content > :first-child`)
}

// Content px maps to cells, adding the tile's top and bottom margin and rounding up, like gridstack's resizeToContent
const toCellCount = (contentPx: number): number => (
  Math.ceil((contentPx + 2 * margin) / (props.tileHeight / CELLS_PER_ROW))
)

const measureFitContentTiles = () => {
  const next = new Map<string, number>()
  const nextPx = new Map<string, number>()

  props.tiles.filter(sizedToContent).forEach(tile => {
    const content = contentOf(tile.id)

    if (content) {
      const { height } = content.getBoundingClientRect()

      next.set(`${tile.id}`, toCellCount(height))
      nextPx.set(`${tile.id}`, height)
    }
  })

  // Only replace the map on a real change, so an unchanged measurement doesn't relayout
  const changed = next.size !== measured.value.size || [...next].some(([id, h]) => measured.value.get(id) !== h)

  if (changed) {
    measured.value = next
  }

  // Sub-cell height changes don't change the cell count, but they do change the leftover
  const pxChanged = nextPx.size !== measuredPx.value.size || [...nextPx].some(([id, h]) => measuredPx.value.get(id) !== h)

  if (pxChanged) {
    measuredPx.value = nextPx
  }
}

const contentObserver = new ResizeObserver(() => window.requestAnimationFrame(measureFitContentTiles))

const observeFitContentTiles = () => {
  contentObserver.disconnect()
  props.tiles.filter(sizedToContent).forEach(tile => {
    const content = contentOf(tile.id)

    if (content) {
      contentObserver.observe(content)
    }
  })
}

const containerObserver = new ResizeObserver(([entry]) => {
  singleColumn.value = !props.editable && entry.contentRect.width <= parseInt(KUI_BREAKPOINT_PHABLET, 10)
})

const isInSync = (node: GridStackNode, widget: GridStackWidget): boolean => {
  const samePosition = node.x === widget.x && node.y === widget.y
  const sameSize = node.w === widget.w && node.h === widget.h

  return samePosition && sameSize
}

// Brings the grid up to date when the tiles change, e.g. add, delete, undo/redo, etc.
const syncTiles = () => {
  if (!grid) {
    return
  }

  const ids = new Set(props.tiles.map(t => `${t.id}`))
  const nodes = new Map(grid.engine.nodes.map(n => [`${n.id}`, n]))

  // When a tile is removed, gridstack forgets the tile exists but never removes it
  nodes.forEach((node, id) => {
    if (!ids.has(id) && node.el) {
      grid!.removeWidget(node.el, false, false)
      tilesRef.value.delete(id)
    }
  })

  const existing = props.tiles.filter(t => nodes.has(`${t.id}`)).map(toWidget)

  isSyncing = true

  // load() lifts every widget out before placing it again, so view mode's non overlapping positions never collide mid move
  if (existing.some(w => !isInSync(nodes.get(`${w.id}`)!, w))) {
    grid.load(existing, false)
  }

  isSyncing = false

  props.tiles.filter(t => !nodes.has(`${t.id}`)).forEach(tile => {
    grid!.makeWidget(makeSelector(tile.id), { ...toWidget(tile), autoPosition: props.editable })
  })

  observeFitContentTiles()
}

onMounted(() => {
  if (gridContainer.value) {
    grid = GridStack.init(gridOptions(), gridContainer.value)

    grid.batchUpdate()
    props.tiles.forEach(tile => grid!.makeWidget(makeSelector(tile.id), toWidget(tile)))
    grid.batchUpdate(false)
    observeFitContentTiles()
    containerObserver.observe(gridContainer.value)

    if (props.editable) {
      grid.on('change', updateTiles)
      grid.on('added', updateTiles)
      grid.on('removed', removeHandler)
    }
  }
})

onUnmounted(() => {
  contentObserver.disconnect()
  containerObserver.disconnect()

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

// 'none' stops gridstack from rearranging tiles itself, syncTiles places them from viewLayout right after
watch(singleColumn, single => grid?.column(single ? 1 : props.columns, 'none'))

// viewLayout also changes when a fit content tile is measured or the grid switches to a single column
watch(() => [props.tiles.map(t => [t.id, t.layout]), viewLayout.value], syncTiles, { deep: true, flush: 'post' })

// Keep tilesRef in sync with props.tiles
watchEffect(() => {
  props.tiles.forEach(tile => {
    tilesRef.value.set(`${tile.id}`, tile)
  })
})

defineExpose({ removeWidget })

</script>

<style lang="scss" scoped>
.grid-stack {
  margin: 0 calc(var(--kui-space-50, $kui-space-50) / -2);
}

// Fit content tiles can be taller than their cell until they're measured
.grid-stack-static :deep(.grid-stack-item-content) {
  overflow-y: hidden;
}

// In a single column every tile takes its natural height so it can be measured
.grid-stack-static.gs-1 :deep(.grid-stack-item-content > *) {
  height: auto !important;
}

.grid-stack:not(.grid-stack-static) :deep(.tile-header) {
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
