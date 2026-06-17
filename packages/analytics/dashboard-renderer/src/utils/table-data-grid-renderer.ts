import type { DashboardRendererContextInternal } from '../types'
import type {
  AllFilters,
  AnalyticsBridge,
  PlatformExploreFilterAll,
  PlatformTabularResponse,
  TableDataGridQuery,
} from '@kong-ui-public/analytics-utilities'
import type {
  TableDataGridFetcher,
  TableDataGridFetcherResult,
  TableDataGridHeader,
} from '@kong-ui-public/table-data-grid'

type TableDataGridRow = Record<string, unknown>
type TableDataGridFetcherResultWithCursor<Row extends object = TableDataGridRow> = TableDataGridFetcherResult<Row> & {
  cursor?: unknown
  hasMore?: boolean
}

type Translate = (key: string) => string
type CanTranslate = (key: string) => boolean
type StripUnknownFilters = (args: {
  datasource: 'platform'
  filters: AllFilters[]
}) => PlatformExploreFilterAll[]

export const buildTableDataGridHeaders = ({
  canTranslate,
  columns,
  translate,
}: {
  canTranslate: CanTranslate
  columns: string[]
  translate: Translate
}): Array<TableDataGridHeader<TableDataGridRow>> => columns.map(column => {
  const labelKey = `chartLabels.${column}`

  return {
    key: column,
    label: canTranslate(labelKey) ? translate(labelKey) : column,
  }
})

export const mapTabularResponseRecords = (
  response: PlatformTabularResponse,
): TableDataGridRow[] => response.records.map(record => {
  const mappedRecord: TableDataGridRow = { ...record }

  Object.entries(record).forEach(([column, value]) => {
    if (value === null) {
      return
    }

    const displayName = response.meta.display?.[column]?.[String(value)]?.name
    if (displayName) {
      mappedRecord[column] = displayName
    }
  })

  return mappedRecord
})

export const toTableDataGridFetcher = ({
  abortController,
  context,
  onResponseColumns,
  query,
  stripUnknownFilters,
  tabularQueryFn,
}: {
  abortController: AbortController
  context: DashboardRendererContextInternal
  onResponseColumns?: (columns: string[]) => void
  query: TableDataGridQuery
  stripUnknownFilters: StripUnknownFilters
  tabularQueryFn: AnalyticsBridge['tabularQueryFn']
}): TableDataGridFetcher<TableDataGridRow> => async ({ cursor, pageSize }): Promise<TableDataGridFetcherResult<TableDataGridRow>> => {
  if (!tabularQueryFn) {
    throw new Error('AnalyticsBridge.tabularQueryFn is not defined')
  }

  const queryFilters = (query.filters ?? []) as AllFilters[]
  const mergedFilters = stripUnknownFilters({
    datasource: 'platform',
    filters: [
      ...queryFilters,
      ...context.filters,
    ],
  })

  const response = await tabularQueryFn({
    columns: query.columns,
    cursor: cursor === undefined ? query.cursor : String(cursor),
    entity: query.entity,
    filters: mergedFilters,
    page_size: pageSize,
  }, abortController)

  if (response.meta.columns?.length) {
    onResponseColumns?.(response.meta.columns)
  }

  const result: TableDataGridFetcherResultWithCursor<TableDataGridRow> = {
    data: mapTabularResponseRecords(response),
    cursor: response.meta.cursor,
    hasMore: Boolean(response.meta.cursor),
  }

  return result
}
