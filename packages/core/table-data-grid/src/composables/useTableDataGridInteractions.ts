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

export const useTableDataGridInteractions = <Row extends Record<string, any>>({
  emit,
  inputs,
}: {
  emit: {
    cellClick: (payload: { row: Row, columnKey: string, value: any }) => void
    rowClick: (row: Row, event: RowClickedEvent<Row>) => void
  }
  inputs: {
    agGridOptions: Readonly<Ref<TableDataGridGridOptions<Row>>>
    headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
    rowAttrs: Readonly<Ref<TableDataGridRowAttrs<Row> | undefined>>
    rowKey: Readonly<Ref<TableDataGridRowKey<Row>>>
  }
}) => {
  const getAgGridRowId = ({ data }: { data: Row }) => {
    return getRowKeyValue(data, inputs.rowKey.value)
  }

  const rowClickDisabledColumnKeys = computed(() => new Set(
    inputs.headers.value
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
    inputs.agGridOptions.value.processRowPostCreate?.(params)

    if (!params.node.data || !inputs.rowAttrs.value) {
      return
    }

    const attrs = inputs.rowAttrs.value(params.node.data)
    patchRowAttrs(params.eRow, attrs)
    patchRowAttrs(params.ePinnedLeftRow, attrs)
    patchRowAttrs(params.ePinnedRightRow, attrs)
  }

  const onRowClick = (event: RowClickedEvent<Row>) => {
    if (event.data && !isRowClickDisabledForColumn(event)) {
      emit.rowClick(event.data, event)
    }
  }

  const onCellClick = (event: CellClickedEvent<Row>) => {
    // AG Grid can emit cell clicks without row data or a stable column id.
    if (!event.data || !event.colDef.colId) {
      return
    }

    emit.cellClick({
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
