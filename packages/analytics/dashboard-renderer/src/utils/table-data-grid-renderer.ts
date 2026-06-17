import type { DashboardRendererContextInternal } from '../types'
import type {
  AllFilters,
  AnalyticsBridge,
  DatasourceAwareTabularQuery,
  PlatformExploreFilterAll,
  PlatformTabularResponse,
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
type TableDataGridFetcherBuilderArgs = {
  abortController: AbortController
  context: DashboardRendererContextInternal
  onResponseColumns?: (columns: string[]) => void
  query: DatasourceAwareTabularQuery
  stripUnknownFilters: StripUnknownFilters
  tabularQueryFn: AnalyticsBridge['tabularQueryFn']
}
type TableDataGridFetcherBuilder = (args: TableDataGridFetcherBuilderArgs) => TableDataGridFetcher<TableDataGridRow>
type TableDataGridHeadersBuilderArgs = {
  canTranslate: CanTranslate
  columns: string[]
  translate: Translate
}
type TableDataGridHeadersBuilder = (args: TableDataGridHeadersBuilderArgs) => Array<TableDataGridHeader<TableDataGridRow>>

const platformQueryToTableDataGridHeaders = ({
  canTranslate,
  columns,
  translate,
}: TableDataGridHeadersBuilderArgs): Array<TableDataGridHeader<TableDataGridRow>> => columns.map(column => {
  const labelKey = `chartLabels.${column}`

  return {
    key: column,
    label: canTranslate(labelKey) ? translate(labelKey) : column,
  }
})

const platformTabularResponseToTableDataGridRows = (
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

const platformQueryToTableDataGridFetcher = ({
  abortController,
  context,
  onResponseColumns,
  query,
  stripUnknownFilters,
  tabularQueryFn,
}: TableDataGridFetcherBuilderArgs): TableDataGridFetcher<TableDataGridRow> => async ({ cursor, pageSize }): Promise<TableDataGridFetcherResult<TableDataGridRow>> => {
  if (!tabularQueryFn) {
    throw new Error('AnalyticsBridge.tabularQueryFn is not defined')
  }

  const platformQuery = query.query
  const queryFilters = (platformQuery.filters ?? []) as AllFilters[]
  const mergedFilters = stripUnknownFilters({
    datasource: 'platform',
    filters: [
      ...queryFilters,
      ...context.filters,
    ],
  })

  const response = await tabularQueryFn({
    datasource: query.datasource,
    query: {
      columns: platformQuery.columns,
      cursor: cursor === undefined ? platformQuery.cursor : String(cursor),
      entity: platformQuery.entity,
      filters: mergedFilters,
      page_size: pageSize,
    },
  }, abortController)

  if (response.meta.columns?.length) {
    onResponseColumns?.(response.meta.columns)
  }

  const result: TableDataGridFetcherResultWithCursor<TableDataGridRow> = {
    data: platformTabularResponseToTableDataGridRows(response),
    cursor: response.meta.cursor,
    hasMore: Boolean(response.meta.cursor),
  }

  return result
}

export const tableDataGridFetcherByDatasource = {
  platform: platformQueryToTableDataGridFetcher,
} satisfies Record<DatasourceAwareTabularQuery['datasource'], TableDataGridFetcherBuilder>

export const tableDataGridHeadersByDatasource = {
  platform: platformQueryToTableDataGridHeaders,
} satisfies Record<DatasourceAwareTabularQuery['datasource'], TableDataGridHeadersBuilder>
