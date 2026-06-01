import type {
  TableDataGridConfig,
  TableDataGridHeader,
} from '../types'
import type { GridColumnWidthChangeSource } from '../types/internal'
import type {
  ColumnState,
  GridApi,
  ISizeColumnsToFitParams,
} from 'ag-grid-community'
import type { Ref } from 'vue'
import { computed, onBeforeUnmount } from 'vue'
import isEqual from 'lodash-es/isEqual'
import { hasConfiguredColumnWidths, normalizedTableConfigsEqual } from '../utils/tableConfig'

// Fit-time usability floor for columns that do not provide an explicit minWidth.
const DEFAULT_AUTO_FIT_MIN_WIDTH = 120

export const useDatatableColumnSizing = <Row extends Record<string, any>>({
  datatableElement,
  datatableWidth,
  getGridConfig,
  gridApi,
  headers,
  isApplyingTableConfig,
  resolvedTableConfig,
  tableConfig,
  updateTableConfig,
}: {
  datatableElement: Readonly<Ref<HTMLElement | undefined>>
  datatableWidth: Readonly<Ref<number>>
  getGridConfig: (api: GridApi<Row>) => TableDataGridConfig
  gridApi: Readonly<Ref<GridApi<Row> | undefined>>
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  isApplyingTableConfig: Readonly<Ref<boolean>>
  resolvedTableConfig: Readonly<Ref<TableDataGridConfig>>
  tableConfig: Readonly<Ref<TableDataGridConfig | undefined>>
  updateTableConfig: (config: TableDataGridConfig) => void
}) => {
  const headerKeys = computed(() => new Set(headers.value.map(header => header.key)))
  const hasResolvedColumnWidths = computed(() => hasConfiguredColumnWidths(resolvedTableConfig.value))
  const hasPropColumnWidths = computed(() => hasConfiguredColumnWidths(tableConfig.value ?? {}))

  let lastAutoFittedColumnWidths: Record<string, number> | undefined
  let fitColumnsAnimationFrame = 0
  let hasStartedResizeTracking = false
  let lastObservedDatatableWidth = 0
  let hasGridMounted = false

  const getDatatableElementWidth = () => datatableElement.value?.offsetWidth ?? datatableWidth.value

  const areResolvedColumnWidthsLastAutoFitted = () => {
    if (!lastAutoFittedColumnWidths) {
      return false
    }

    return isEqual(resolvedTableConfig.value.columnWidths ?? {}, lastAutoFittedColumnWidths)
  }

  const shouldHonorConfiguredColumnWidthsAfterDisplayedColumnsChange = () => {
    // Consumer-provided or user-resized widths can force horizontal scroll.
    // Widths we generated through auto-fit are derived layout state from a
    // previous displayed set, so they should not block a follow-up refit.
    return hasPropColumnWidths.value && !areResolvedColumnWidthsLastAutoFitted()
  }

  const getColumnFitMinWidth = (header: TableDataGridHeader<Row>) => (
    header.minWidth ?? DEFAULT_AUTO_FIT_MIN_WIDTH
  )

  const getColumnFitParams = (): ISizeColumnsToFitParams => ({
    columnLimits: headers.value.map(header => ({
      key: header.key,
      minWidth: getColumnFitMinWidth(header),
      maxWidth: header.maxWidth,
    })),
  })

  const isHeaderVisible = (header: TableDataGridHeader<Row>) => (
    resolvedTableConfig.value.columnVisibility?.[header.key] !== false
  )

  const getRequiredHeaderWidth = (
    header: TableDataGridHeader<Row>,
    { honorConfiguredColumnWidths }: { honorConfiguredColumnWidths: boolean },
  ) => {
    const minWidth = getColumnFitMinWidth(header)
    const configuredWidth = honorConfiguredColumnWidths
      ? resolvedTableConfig.value.columnWidths?.[header.key] ?? header.width
      : undefined

    return Math.max(configuredWidth ?? minWidth, minWidth)
  }

  const getRequiredVisibleHeaderWidth = ({ honorConfiguredColumnWidths }: { honorConfiguredColumnWidths: boolean }) => {
    return headers.value
      .filter(isHeaderVisible)
      .reduce((total, header) => total + getRequiredHeaderWidth(header, { honorConfiguredColumnWidths }), 0)
  }

  const getDisplayedColumnWidth = (
    columnState: ColumnState[],
    predicate: (column: ColumnState) => boolean,
  ) => {
    return columnState
      .filter(column => !column.hide && predicate(column))
      .reduce((total, column) => total + (column.width ?? 0), 0)
  }

  const getRequiredNonHeaderColumnWidth = (columnState: ColumnState[]) => {
    return getDisplayedColumnWidth(columnState, column => !headerKeys.value.has(column.colId))
  }

  const getDisplayedPinnedColumnWidth = (columnState: ColumnState[]) => {
    return getDisplayedColumnWidth(columnState, column => column.pinned === 'left' || column.pinned === 'right')
  }

  const getCenterViewportWidth = (api: GridApi<Row>) => {
    const horizontalPixelRange = api.getHorizontalPixelRange()
    if (!horizontalPixelRange) {
      return undefined
    }

    const { left, right } = horizontalPixelRange
    return right - left
  }

  const getAvailableFitWidth = (api: GridApi<Row>, columnState: ColumnState[]) => {
    const centerViewportWidth = getCenterViewportWidth(api)
    if (centerViewportWidth == null) {
      return undefined
    }

    return centerViewportWidth + getDisplayedPinnedColumnWidth(columnState)
  }

  const getRequiredFitWidth = (
    columnState: ColumnState[],
    { honorConfiguredColumnWidths }: { honorConfiguredColumnWidths: boolean },
  ) => (
    getRequiredVisibleHeaderWidth({ honorConfiguredColumnWidths }) + getRequiredNonHeaderColumnWidth(columnState)
  )

  const canDisplayedColumnsFit = (
    columnState: ColumnState[],
    availableWidth: number,
    { honorConfiguredColumnWidths }: { honorConfiguredColumnWidths: boolean },
  ) => {
    return availableWidth <= 0 || getRequiredFitWidth(columnState, { honorConfiguredColumnWidths }) <= availableWidth
  }

  const fitColumnsToGrid = (
    api: GridApi<Row>,
    {
      force = false,
      honorConfiguredColumnWidths = hasResolvedColumnWidths.value,
    }: {
      force?: boolean
      honorConfiguredColumnWidths?: boolean
    } = {},
  ) => {
    if (!force && hasResolvedColumnWidths.value) {
      return false
    }

    const columnState = api.getColumnState()
    const availableWidth = getAvailableFitWidth(api, columnState)
    if (availableWidth == null) {
      return false
    }

    // sizeColumnsToFit acts on all displayed columns, so the preflight must use
    // the same width domain: visible headers, pinned columns, AG Grid-owned
    // display columns such as selection, and the same fit-time minimums.
    if (!canDisplayedColumnsFit(columnState, availableWidth, { honorConfiguredColumnWidths })) {
      return false
    }

    api.sizeColumnsToFit(getColumnFitParams())
    return true
  }

  const getConfigForChangeDetection = (
    gridConfig: TableDataGridConfig,
    { columnWidthChangeSource }: { columnWidthChangeSource: GridColumnWidthChangeSource },
  ): TableDataGridConfig => {
    if (columnWidthChangeSource === 'intentional') {
      return gridConfig
    }

    // AG Grid can recalculate pixel widths while columns are pinned, moved, or
    // hidden. Those width differences are layout noise for change detection:
    // they should not emit by themselves. If layout also changed order, pinning,
    // or visibility, the full grid config is still emitted below.
    return {
      ...gridConfig,
      columnWidths: resolvedTableConfig.value.columnWidths,
    }
  }

  const emitGridConfigChange = ({
    columnWidthChangeSource = 'intentional',
  }: {
    columnWidthChangeSource?: GridColumnWidthChangeSource
  } = {}) => {
    const api = gridApi.value
    if (!api || isApplyingTableConfig.value) {
      return
    }

    const gridConfig = getGridConfig(api)
    const configForChangeDetection = getConfigForChangeDetection(gridConfig, { columnWidthChangeSource })
    if (normalizedTableConfigsEqual(configForChangeDetection, resolvedTableConfig.value)) {
      return
    }

    if (columnWidthChangeSource === 'layout-side-effect' && areResolvedColumnWidthsLastAutoFitted()) {
      lastAutoFittedColumnWidths = gridConfig.columnWidths
    }
    updateTableConfig(gridConfig)
  }

  const scheduleColumnFitFrame = ({
    api = gridApi.value,
    getHonorConfiguredColumnWidths,
    persistFittedConfig = false,
  }: {
    api?: GridApi<Row>
    getHonorConfiguredColumnWidths: () => boolean
    persistFittedConfig?: boolean
  }) => {
    if (!api) {
      return
    }

    if (fitColumnsAnimationFrame) {
      cancelAnimationFrame(fitColumnsAnimationFrame)
    }

    // Column sizing depends on AG Grid's rendered viewport, so wait one frame
    // for browser/AG Grid layout rather than only Vue's DOM flush.
    fitColumnsAnimationFrame = requestAnimationFrame(() => {
      fitColumnsAnimationFrame = 0
      const didFitColumns = fitColumnsToGrid(api, {
        force: true,
        honorConfiguredColumnWidths: getHonorConfiguredColumnWidths(),
      })
      if (persistFittedConfig && didFitColumns) {
        lastAutoFittedColumnWidths = getGridConfig(api).columnWidths
      }
      if (persistFittedConfig) {
        emitGridConfigChange()
      }
    })
  }

  const scheduleColumnsToFit = ({
    api = gridApi.value,
    persistFittedConfig = false,
    honorConfiguredColumnWidths = hasPropColumnWidths.value,
  }: {
    api?: GridApi<Row>
    persistFittedConfig?: boolean
    honorConfiguredColumnWidths?: boolean
  } = {}) => {
    scheduleColumnFitFrame({
      api,
      persistFittedConfig,
      getHonorConfiguredColumnWidths: () => honorConfiguredColumnWidths,
    })
  }

  const scheduleColumnsToFitAfterDisplayedColumnsChange = (api = gridApi.value) => {
    scheduleColumnFitFrame({
      api,
      persistFittedConfig: true,
      getHonorConfiguredColumnWidths: shouldHonorConfiguredColumnWidthsAfterDisplayedColumnsChange,
    })
  }

  const fitColumnsOnGridReady = (api: GridApi<Row>) => {
    const didFitColumns = fitColumnsToGrid(api, {
      force: hasGridMounted,
      honorConfiguredColumnWidths: hasPropColumnWidths.value,
    })
    if (didFitColumns || !hasPropColumnWidths.value) {
      lastAutoFittedColumnWidths = getGridConfig(api).columnWidths
    }
    hasGridMounted = true
  }

  const shouldRefitColumnsAfterConfigChange = () => !hasConfiguredColumnWidths(resolvedTableConfig.value)

  const startResizeTracking = () => {
    lastObservedDatatableWidth = getDatatableElementWidth()
    hasStartedResizeTracking = true
  }

  const handleDatatableWidthChange = () => {
    const observedWidth = getDatatableElementWidth()
    if (!hasStartedResizeTracking || lastObservedDatatableWidth === observedWidth) {
      return
    }

    lastObservedDatatableWidth = observedWidth
    scheduleColumnsToFit()
  }

  onBeforeUnmount(() => {
    if (fitColumnsAnimationFrame) {
      cancelAnimationFrame(fitColumnsAnimationFrame)
    }
  })

  return {
    emitGridConfigChange,
    fitColumnsOnGridReady,
    handleDatatableWidthChange,
    scheduleColumnsToFit,
    scheduleColumnsToFitAfterDisplayedColumnsChange,
    shouldRefitColumnsAfterConfigChange,
    startResizeTracking,
  }
}
