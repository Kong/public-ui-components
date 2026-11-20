import type { TableDataGridCoordinator, TableDataGridHeader } from '../types'
import type { GridApi } from 'ag-grid-community'
import type { Ref, ShallowRef } from 'vue'
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'

/** Same key `@kong-ui-public/analytics-chart` injects its interaction coordinator with. */
export const INJECT_DASHBOARD_COORDINATOR = 'analytics-dashboard-coordinator'

/**
 * Connects the grid to an injected interaction coordinator:
 * A column header's `key` is the dimension name.
 * - rows whose value in the active dimension's column matches the active value are highlighted
 * - hovering a cell activates that cell's column key and value on the coordinator
 *
 * The cell under the pointer is the closest value, so hover needs no distance math.
 * Everything is a no-op when there is no coordinator.
 */
export const useTableDataGridCoordinator = <Row extends object>({
  gridApi,
  headers,
  coordinator = inject<TableDataGridCoordinator | undefined>(INJECT_DASHBOARD_COORDINATOR, undefined),
}: {
  gridApi: ShallowRef<GridApi<Row> | undefined>
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  coordinator?: TableDataGridCoordinator
}) => {
  const instanceId = crypto.randomUUID()
  // Debounced copy of the coordinator's active value, as charts do, to avoid redraw churn.
  const highlightedValue = ref<string | null>(null)

  const headerKeys = computed(() => new Set<string>(headers.value.map(header => header.key)))
  // Dimension currently highlighted, debounced together with its value.
  const highlightedDimension = ref<string | null>(null)

  const toValue = (value: unknown): string | null => value === undefined || value === null ? null : String(value)

  const isHighlighted = (row: Row | undefined): boolean => {
    const dimension = highlightedDimension.value
    const value = highlightedValue.value
    return !!row && dimension !== null && value !== null
      && toValue((row as Record<string, unknown>)[dimension]) === value
  }

  let hoverTimeout: ReturnType<typeof setTimeout> | undefined
  let lastActivated = 0
  let lastHovered: string | null = null

  if (coordinator) {
    watch(
      [coordinator.activeChart, coordinator.activeDimension, coordinator.activeDimensionValue],
      ([activeChart, activeDimension, activeValue]) => {
        clearTimeout(hoverTimeout)
        const matches = activeDimension !== null
          && headerKeys.value.has(activeDimension)
          // Our own hover is already shown by the grid's hover styling.
          && activeChart !== instanceId

        hoverTimeout = setTimeout(() => {
          const next = matches ? activeValue : null
          const nextDimension = matches ? activeDimension : null
          if (next === highlightedValue.value && nextDimension === highlightedDimension.value) {
            return
          }
          highlightedValue.value = next
          highlightedDimension.value = nextDimension
          const api = gridApi.value
          if (api && !api.isDestroyed()) {
            api.redrawRows()
          }
        }, coordinator.DIMENSION_DEBOUNCE_MS)
      },
    )
  }

  const onCellHover = (columnKey: string | undefined, row: Row | undefined, cellValue: unknown) => {
    const value = toValue(cellValue)
    if (!coordinator || !row || !columnKey || value === null || !headerKeys.value.has(columnKey)) {
      return
    }

    const hovered = `${columnKey}\u0000${value}`
    if (hovered === lastHovered) {
      return
    }

    const now = Date.now()
    if (now - lastActivated < coordinator.DIMENSION_DEBOUNCE_MS) {
      return
    }
    lastActivated = now
    lastHovered = hovered
    coordinator.activate({
      chartUuid: instanceId,
      dimension: columnKey,
      dimensionValue: value,
    })
  }

  const onGridLeave = () => {
    lastHovered = null
    lastActivated = 0
    coordinator?.deactivate({ chartUuid: instanceId })
  }

  onBeforeUnmount(() => {
    clearTimeout(hoverTimeout)
    onGridLeave()
  })

  return { isHighlighted, onCellHover, onGridLeave }
}
