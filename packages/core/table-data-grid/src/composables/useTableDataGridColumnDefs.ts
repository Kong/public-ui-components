import type { TableDataGridHeader, TableDataGridRow, TableDataGridSort } from '../types'
import type { ColDef } from 'ag-grid-community'
import type { Ref, Slots } from 'vue'
import { computed, watch } from 'vue'
import TableDataGridCellRenderer from '../components/TableDataGridCellRenderer.vue'
import {
  getColumnStats,
  toFiniteNumber,
  type TableDataGridColumnStats,
} from '../utils/tableDataGridPresentation'

/**
 * Converts `headers` into what AG Grid needs to render the table's columns:
 * the column definitions themselves, and the shared grid `context`.
 */
export const useTableDataGridColumnDefs = <Row extends object = TableDataGridRow>({
  headers,
  slots,
  initialSort,
  mode,
  rows,
  locale,
  tooltipTarget,
}: {
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  slots: Slots
  initialSort?: TableDataGridSort
  mode?: 'infinite' | 'unpaginated'
  rows?: Readonly<Ref<readonly object[] | undefined>>
  locale?: Readonly<Ref<string>>
  tooltipTarget?: Readonly<Ref<string | HTMLElement>>
}) => {
  const activeMode = mode ?? 'infinite'
  const warnedOptions = new Set<string>()
  const hasNumericPresentation = (header: TableDataGridHeader<Row>) => Boolean(
    header.showPercentage || header.bar || header.thresholds?.length,
  )

  const validatePresentationOptions = () => {
    headers.value.forEach((header) => {
      if (!hasNumericPresentation(header)) {
        return
      }

      let issue: string | undefined

      if (activeMode === 'infinite' && (header.showPercentage || header.bar)) {
        issue = 'percentage and bar presentation is only supported in unpaginated mode'
      } else if (activeMode === 'unpaginated' && rows?.value?.some((row) => {
        const value: unknown = Reflect.get(row, header.key)
        return value !== null && value !== undefined && toFiniteNumber(value) === null
      })) {
        issue = 'contains non-finite or nonnumeric values; numeric presentation skips those values'
      }

      if (!issue) {
        return
      }

      const optionSignature = `${header.key}:${issue}`

      if (warnedOptions.has(optionSignature)) {
        return
      }

      warnedOptions.add(optionSignature)
      console.warn(`[TableDataGrid] Column "${header.key}" ${issue}.`)
    })
  }

  watch([headers, () => rows?.value], validatePresentationOptions, { deep: true, immediate: true })

  const presentationStats = computed<Record<string, TableDataGridColumnStats>>(() => {
    if (activeMode !== 'unpaginated') {
      return {}
    }

    const currentRows = rows?.value ?? []

    return Object.fromEntries(
      headers.value
        .filter(header => header.showPercentage || header.bar)
        .map(header => [header.key, getColumnStats(currentRows, header)]),
    )
  })

  // AG Grid's generic passthrough object, copied onto every cell/header renderer.
  const gridContext = computed(() => ({
    cells: { slots, tooltipTarget },
    presentation: {
      mode: activeMode,
      locale: locale?.value ?? 'en-US',
      stats: presentationStats.value,
    },
  }))

  const createColumnDef = (header: TableDataGridHeader<Row>): ColDef<Row> => {
    const isInitialSortColumn = initialSort?.sortColumnKey === header.key

    return {
      colId: header.key,
      // Columns with no explicit width constraint share remaining space equally.
      flex: !header.width && !header.maxWidth ? 1 : undefined,
      headerName: header.label,
      maxWidth: header.maxWidth,
      minWidth: header.minWidth,
      sortable: header.sortable ?? false,
      unSortIcon: header.showSortIcon,
      ...(isInitialSortColumn ? { initialSort: initialSort?.sortColumnOrder, initialSortIndex: 0 } : {}),
      valueGetter: params => params.data?.[header.key],
      valueFormatter: params => (
        header.valueFormatter && params.data
          ? header.valueFormatter(params.value, params.data)
          : String(params.value ?? '')
      ),
      width: header.width,
      cellRenderer: TableDataGridCellRenderer,
      // custom params passed to the cell renderer.
      cellRendererParams: { headerDef: header },
    }
  }

  const columnDefs = computed<Array<ColDef<Row>>>(() => headers.value.map(createColumnDef))

  return {
    columnDefs,
    gridContext,
  }
}
