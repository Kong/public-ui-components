import type {
  AnalyticsDatatableCellAttrs,
  AnalyticsDatatableConfig,
  AnalyticsDatatableHeader,
} from '../types'
import type { ColDef } from 'ag-grid-community'
import type { Ref, ShallowRef, Slots } from 'vue'
import { computed } from 'vue'
import isEqual from 'lodash-es/isEqual'
import AnalyticsDatatableCellRenderer from '../components/AnalyticsDatatableCellRenderer.vue'
import AnalyticsDatatableHeaderRenderer from '../components/AnalyticsDatatableHeaderRenderer.vue'
import { isColumnHideable } from '../utils/headers'

export const useDatatableColumnDefs = <Row extends Record<string, any>>({
  headers,
  cellAttrs,
  displayedColumnIndexesByKey,
  resolvedTableConfig,
  slots,
}: {
  headers: Readonly<Ref<Array<AnalyticsDatatableHeader<Row>>>>
  cellAttrs: Readonly<Ref<AnalyticsDatatableCellAttrs<Row> | undefined>>
  displayedColumnIndexesByKey: Readonly<ShallowRef<Map<string, number>>>
  resolvedTableConfig: Readonly<Ref<AnalyticsDatatableConfig>>
  slots: Slots
}) => {
  const resolvedHeaders = computed(() => headers.value)
  const columnsByKey = computed(() => new Map(resolvedHeaders.value.map(header => [header.key, header])))
  const columnOrder = computed<string[]>((previous) => {
    const nextColumnOrder = resolvedTableConfig.value.columnOrder ?? []
    // AG Grid resets column layout when it receives a new columnDefs array.
    // Preserve the previous order reference when the resolved order is unchanged.
    return previous && isEqual(previous, nextColumnOrder) ? previous : nextColumnOrder
  })

  const getColumnHeaderName = (header: AnalyticsDatatableHeader<Row>) => header.hideLabel ? '' : header.label
  const orderedHeaders = computed(() => {
    return columnOrder.value
      .map(key => columnsByKey.value.get(key))
      .filter((header): header is AnalyticsDatatableHeader<Row> => Boolean(header))
  })
  const gridContext = computed(() => ({
    cellAttrs: cellAttrs.value,
    columnsByKey: columnsByKey.value,
    displayedColumnIndexesByKey,
    slots,
  }))

  const createColumnDef = (header: AnalyticsDatatableHeader<Row>): ColDef<Row> => ({
    headerName: getColumnHeaderName(header),
    colId: header.key,
    headerComponent: AnalyticsDatatableHeaderRenderer,
    // AG Grid initial-state fields seed defaults; persisted tableConfig is
    // applied later with applyColumnState so user changes remain controlled.
    initialWidth: header.width,
    lockVisible: !isColumnHideable(header),
    maxWidth: header.maxWidth,
    minWidth: header.minWidth,
    initialPinned: header.pinned ?? false,
    resizable: header.resizable ?? true,
    sortable: header.sortable ?? false,
    suppressMovable: header.draggable === false,
    tooltipValueGetter: params => header.tooltip ?? String(params.value ?? ''),
    valueGetter: params => params.data?.[header.key],
    cellRenderer: AnalyticsDatatableCellRenderer,
    ...header.agGridColumnOptions,
  })

  const columnDefs = computed<Array<ColDef<Row>>>(() => orderedHeaders.value.map(createColumnDef))

  return {
    gridContext,
    columnDefs,
  }
}
