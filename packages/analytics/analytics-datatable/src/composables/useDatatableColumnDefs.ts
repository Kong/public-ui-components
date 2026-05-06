import type {
  AnalyticsDatatableConfig,
  AnalyticsDatatableHeader,
} from '../types'
import type {
  ColDef,
  GridApi,
  ISizeColumnsToFitParams,
} from 'ag-grid-community'
import type { Ref, Slots } from 'vue'
import { computed } from 'vue'
import AnalyticsDatatableCellRenderer from '../components/AnalyticsDatatableCellRenderer.vue'
import AnalyticsDatatableHeaderRenderer from '../components/AnalyticsDatatableHeaderRenderer.vue'
import { isColumnHideable } from '../utils/headers'

export const useDatatableColumnDefs = <Row extends Record<string, any>>({
  headers,
  resolvedTableConfig,
  slots,
}: {
  headers: Readonly<Ref<Array<AnalyticsDatatableHeader<Row>>>>
  resolvedTableConfig: Readonly<Ref<AnalyticsDatatableConfig>>
  slots: Slots
}) => {
  const resolvedHeaders = computed(() => headers.value)
  const columnsByKey = computed(() => new Map(resolvedHeaders.value.map(header => [header.key, header])))
  const hasConfiguredColumnWidths = computed(() => Object.keys(resolvedTableConfig.value.columnWidths ?? {}).length > 0)
  const columnOrder = computed<string[]>((previous) => {
    const nextColumnOrder = resolvedTableConfig.value.columnOrder ?? []
    return previous && arraysEqual(previous, nextColumnOrder) ? previous : nextColumnOrder
  })

  const gridContext = computed(() => ({
    columnsByKey: columnsByKey.value,
    slots,
  }))

  const getColumnHeaderName = (header: AnalyticsDatatableHeader<Row>) => header.hideLabel ? '' : header.label
  const orderedHeaders = computed(() => {
    return columnOrder.value
      .map(key => columnsByKey.value.get(key))
      .filter((header): header is AnalyticsDatatableHeader<Row> => Boolean(header))
  })

  const createColumnDef = (header: AnalyticsDatatableHeader<Row>): ColDef<Row> => ({
    headerName: getColumnHeaderName(header),
    colId: header.key,
    field: undefined,
    headerComponent: AnalyticsDatatableHeaderRenderer,
    initialWidth: header.width,
    lockVisible: !isColumnHideable(header),
    maxWidth: header.maxWidth,
    minWidth: header.minWidth,
    pinned: header.pinned ?? false,
    resizable: header.resizable ?? true,
    sortable: header.sortable ?? false,
    suppressMovable: header.draggable === false,
    tooltipValueGetter: params => header.tooltip ?? String(params.value ?? ''),
    valueGetter: params => params.data?.[header.key],
    cellRenderer: AnalyticsDatatableCellRenderer,
    ...header.agGridColumnOptions,
  })

  const columnDefs = computed<Array<ColDef<Row>>>(() => orderedHeaders.value.map(createColumnDef))

  const getColumnFitParams = (): ISizeColumnsToFitParams => ({
    columnLimits: resolvedHeaders.value.map(header => ({
      key: header.key,
      minWidth: header.minWidth,
      maxWidth: header.maxWidth,
    })),
  })

  const fitColumnsToGrid = (api: GridApi<Row>, { force = false }: { force?: boolean } = {}) => {
    if (!force && hasConfiguredColumnWidths.value) {
      return
    }

    api.sizeColumnsToFit(getColumnFitParams())
  }

  return {
    gridContext,
    columnDefs,
    fitColumnsToGrid,
  }
}

const arraysEqual = <Value>(left: Value[], right: Value[]) => (
  left.length === right.length && left.every((value, index) => value === right[index])
)
