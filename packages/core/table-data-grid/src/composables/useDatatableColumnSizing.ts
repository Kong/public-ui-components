import type {
  TableDataGridConfig,
  TableDataGridHeader,
} from '../types'
import type { GridColumnWidthChangeSource } from '../types/internal'
import type { GridApi } from 'ag-grid-community'
import type { Ref } from 'vue'
import { computed, onBeforeUnmount } from 'vue'
import isEqual from 'lodash-es/isEqual'
import { hasConfiguredColumnWidths, normalizedTableConfigsEqual } from '../utils/tableConfig'
import {
  canDisplayedColumnsFit,
  createColumnFitParams,
  getAvailableFitWidth,
  getConfigForColumnWidthChangeDetection,
} from '../utils/columnSizing'

type DatatableColumnSizingElement = {
  datatableElement: Readonly<Ref<HTMLElement | undefined>>
  datatableWidth: Readonly<Ref<number>>
}

type DatatableColumnSizingGrid<Row extends Record<string, any>> = {
  getGridConfig: (api: GridApi<Row>) => TableDataGridConfig
  gridApi: Readonly<Ref<GridApi<Row> | undefined>>
}

type DatatableColumnSizingConfig<Row extends Record<string, any>> = {
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  isApplyingTableConfig: Readonly<Ref<boolean>>
  resolvedTableConfig: Readonly<Ref<TableDataGridConfig>>
  tableConfig: Readonly<Ref<TableDataGridConfig | undefined>>
  updateTableConfig: (config: TableDataGridConfig) => void
}

export const useDatatableColumnSizing = <Row extends Record<string, any>>({
  config,
  element,
  grid,
}: {
  config: DatatableColumnSizingConfig<Row>
  element: DatatableColumnSizingElement
  grid: DatatableColumnSizingGrid<Row>
}) => {
  const {
    headers,
    isApplyingTableConfig,
    resolvedTableConfig,
    tableConfig,
    updateTableConfig,
  } = config
  const {
    datatableElement,
    datatableWidth,
  } = element
  const {
    getGridConfig,
    gridApi,
  } = grid

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
    const availableWidth = getAvailableFitWidth({ api, columnState })
    if (availableWidth == null) {
      return false
    }

    // sizeColumnsToFit acts on all displayed columns, so the preflight must use
    // the same width domain: visible headers, pinned columns, AG Grid-owned
    // display columns such as selection, and the same fit-time minimums.
    if (!canDisplayedColumnsFit({
      availableWidth,
      columnState,
      headers: headers.value,
      honorConfiguredColumnWidths,
      resolvedTableConfig: resolvedTableConfig.value,
    })) {
      return false
    }

    api.sizeColumnsToFit(createColumnFitParams({ headers: headers.value }))
    return true
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
    const configForChangeDetection = getConfigForColumnWidthChangeDetection({
      columnWidthChangeSource,
      gridConfig,
      resolvedTableConfig: resolvedTableConfig.value,
    })
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
