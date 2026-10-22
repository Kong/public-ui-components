<template>
  <div
    ref="gridContainer"
    class="grid-stack"
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
import type { GridItemHTMLElement, GridStackNode, GridStackOptions, GridStackWidget } from 'gridstack'
import type { GridTile } from 'src/types'

import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { GridStack } from 'gridstack'
import { KUI_BREAKPOINT_PHABLET, KUI_SPACE_50 } from '@kong/design-tokens'

import { CELLS_PER_ROW, DASHBOARD_COLS, DEFAULT_TILE_HEIGHT } from '../../constants'
import { calculateRowDefs } from './grid-utils'
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
}>(), {
  tileHeight: DEFAULT_TILE_HEIGHT,
  columns: DASHBOARD_COLS,
  editable: false,
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
const toCells = (rows: number): number => (
  props.editable ? rows : rows * CELLS_PER_ROW
)

const toWidget = (tile: GridTile<T>): GridStackWidget => ({
  id: `${tile.id}`,
  x: tile.layout.position.col,
  y: toCells(tile.layout.position.row),
  w: tile.layout.size.cols,
  h: toCells(tile.layout.size.rows),
  sizeToContent: fitToContent(tile),
})

const gridOptions = (): GridStackOptions => ({
  margin: parseInt(KUI_SPACE_50, 10) / 2,
  column: props.columns,
  cellHeight: props.tileHeight / toCells(1),
  resizable: { handles: 'se, sw' },
  handle: '.tile-header',
  staticGrid: !props.editable,
  ...(!props.editable && {
    columnOpts: {
      columnMax: props.columns,
      breakpoints: [{ w: parseInt(KUI_BREAKPOINT_PHABLET, 10), c: 1, layout: 'list' }],
    },
  }),
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

const contentObserver = new ResizeObserver(entries => {
  window.requestAnimationFrame(() => {
    entries.forEach(({ target }) => {
      const item = target.closest<GridItemHTMLElement>('.grid-stack-item')
      if (grid && item) {
        grid.resizeToContent(item)
      }
    })
  })
})

const observeFitTiles = () => {
  contentObserver.disconnect()
  props.tiles.filter(fitToContent).forEach(tile => {
    const content = gridContainer.value?.querySelector(`${makeSelector(tile.id)} > .grid-stack-item-content > :first-child`)
    if (content) {
      contentObserver.observe(content)
    }
  })
}

const isInSync = (node: GridStackNode, widget: GridStackWidget): boolean => {
  const samePosition = node.x === widget.x && node.y === widget.y
  const sameWidth = node.w === widget.w
  const sameHeight = !!node.sizeToContent || node.h === widget.h

  return samePosition && sameWidth && sameHeight
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

  // A row only shrinks to fit its content if every tile in it has fit_to_content.
  // So adding or removing one tile can make the others in its row shrink or grow, even though they didn't move.
  // grid.load() won't handle this, it's skipped when nothing moved, and it keeps a fit_to_content tile's current height.
  existing.forEach(w => {
    const node = nodes.get(`${w.id}`)!

    if (!!node.sizeToContent !== !!w.sizeToContent && node.el) {
      grid!.update(node.el, { sizeToContent: w.sizeToContent, h: w.h })
    }
  })

  if (existing.some(w => !isInSync(nodes.get(`${w.id}`)!, w))) {
    grid.load(existing, false)
  }

  isSyncing = false

  props.tiles.filter(t => !nodes.has(`${t.id}`)).forEach(tile => {
    grid!.makeWidget(makeSelector(tile.id), { ...toWidget(tile), autoPosition: props.editable })
  })

  observeFitTiles()
}

onMounted(() => {
  if (gridContainer.value) {
    grid = GridStack.init(gridOptions(), gridContainer.value)

    grid.batchUpdate()
    props.tiles.forEach(tile => grid!.makeWidget(makeSelector(tile.id), toWidget(tile)))
    grid.batchUpdate(false)
    observeFitTiles()

    if (props.editable) {
      grid.on('change', updateTiles)
      grid.on('added', updateTiles)
      grid.on('removed', removeHandler)
    }
  }
})

onUnmounted(() => {
  contentObserver.disconnect()

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

watch(() => props.tiles.map(t => [t.id, t.layout]), syncTiles, { deep: true, flush: 'post' })

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
