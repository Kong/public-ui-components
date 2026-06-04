import type {
  TableDataGridGridOptions,
  TableDataGridHeader,
  TableDataGridRowAttrs,
  TableDataGridRowKey,
} from '../types'
import type {
  CellClickedEvent,
  ProcessRowParams,
  RowClickedEvent,
} from 'ag-grid-community'
import type { Ref } from 'vue'
import { computed } from 'vue'
import { getRowKeyValue } from '../utils/rowKey'
import { patchRowAttrs } from '../utils/rowAttrs'

/**
 * Owns row identity and row/cell interaction handlers for AG Grid.
 *
 * Header metadata is the source for row-click suppression, `rowAttrs` owns host
 * row DOM attributes, and emitted row/cell events are the only public side
 * effects from clicks.
 */
export const useTableDataGridInteractions = <Row extends Record<string, any>>({
  agGridOptions,
  cellClick,
  headers,
  rowAttrs,
  rowClick,
  rowKey,
}: {
  agGridOptions: Readonly<Ref<TableDataGridGridOptions<Row>>>
  cellClick: (payload: { row: Row, columnKey: string, value: any }) => void
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  rowAttrs: Readonly<Ref<TableDataGridRowAttrs<Row> | undefined>>
  rowClick: (row: Row, event: RowClickedEvent<Row>) => void
  rowKey: Readonly<Ref<TableDataGridRowKey<Row>>>
}) => {
  const getAgGridRowId = ({ data }: { data: Row }) => {
    return getRowKeyValue(data, rowKey.value)
  }

  const rowClickDisabledColumnKeys = computed(() => new Set(
    headers.value
      .filter(header => header.disableRowClick)
      .map(header => header.key),
  ))

  const getClickedColumnKey = (event: RowClickedEvent<Row>): string | undefined => {
    const target = event.event?.target

    if (!(target instanceof Element)) {
      return undefined
    }

    return target.closest('.ag-cell')?.getAttribute('col-id') ?? undefined
  }

  const isRowClickDisabledForColumn = (event: RowClickedEvent<Row>): boolean => {
    const columnKey = getClickedColumnKey(event)

    return Boolean(columnKey && rowClickDisabledColumnKeys.value.has(columnKey))
  }

  const onRowPostCreate = (params: ProcessRowParams<Row>) => {
    agGridOptions.value.processRowPostCreate?.(params)

    if (!params.node.data || !rowAttrs.value) {
      return
    }

    const attrs = rowAttrs.value(params.node.data)
    patchRowAttrs(params.eRow, attrs)
    patchRowAttrs(params.ePinnedLeftRow, attrs)
    patchRowAttrs(params.ePinnedRightRow, attrs)
  }

  const onRowClick = (event: RowClickedEvent<Row>) => {
    if (event.data && !isRowClickDisabledForColumn(event)) {
      rowClick(event.data, event)
    }
  }

  const onCellClick = (event: CellClickedEvent<Row>) => {
    // AG Grid can emit cell clicks without row data or a stable column id.
    if (!event.data || !event.colDef.colId) {
      return
    }

    cellClick({
      row: event.data,
      columnKey: event.colDef.colId,
      value: event.value,
    })
  }

  return {
    getAgGridRowId,
    onCellClick,
    onRowClick,
    onRowPostCreate,
  }
}
