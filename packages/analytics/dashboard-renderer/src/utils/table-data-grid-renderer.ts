import type { DashboardRendererContextInternal } from '../types'
import type {
  AllFilters,
  AnalyticsBridge,
  PlatformDatasourceTabularQuery,
  PlatformTabularQuery,
  PlatformTabularResponse,
} from '@kong-ui-public/analytics-utilities'
import type { useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'
import type {
  TableDataGridFetcherResult,
  TableDataGridHeader,
} from '@kong-ui-public/table-data-grid'

type TableDataGridRow = Record<string, unknown>
type StripUnknownFilters = ReturnType<typeof useDatasourceConfigStore>['stripUnknownFilters']

/**
 * Converts the platform tabular response shape into rows that TableDataGrid can render.
 * Display metadata is applied to copied row objects so the original response records are not mutated.
 *
 * @param response - Platform tabular API response, including records and optional display metadata.
 * @returns A new row array with display labels substituted where metadata provides them.
 */
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

/**
 * Builds platform table headers from configured or response-provided column names.
 * Known chart label translations are reused for user-facing labels, with the raw column as fallback.
 *
 * @param options - Header builder options.
 * @param options.canTranslate - Checks whether a chart label translation exists for a column key.
 * @param options.columns - Column keys to expose as TableDataGrid headers.
 * @param options.translate - Resolves a translation key into a display label.
 * @returns TableDataGrid header definitions for the provided columns.
 */
const platformTableDataGridHeaders = ({
  canTranslate,
  columns,
  translate,
}: {
  canTranslate: (key: string) => boolean
  columns: string[]
  translate: (key: string) => string
}): Array<TableDataGridHeader<TableDataGridRow>> => columns.map(column => {
  const labelKey = `chartLabels.${column}`

  return {
    key: column,
    label: canTranslate(labelKey) ? translate(labelKey) : column,
  }
})

/** Maps a table tile datasource to the header builder used by TableDataGridRenderer. */
export const tableDataGridHeadersByDatasource = {
  /** @deprecated Use `platform_usage`. */
  platform: platformTableDataGridHeaders,
  platform_usage: platformTableDataGridHeaders,
}

/**
 * Fetches one page of platform tabular rows, applying dashboard context filters and
 * forwarding the datasource-aware query to AnalyticsBridge.tabularQueryFn.
 *
 * @param options - Fetcher options supplied by TableDataGridRenderer.
 * @param options.abortController - Abort controller passed through to the tabular bridge request.
 * @param options.context - Dashboard renderer context used to merge tile filters with dashboard filters.
 * @param options.cursor - Optional pagination cursor supplied by TableDataGrid.
 * @param options.onResponseColumns - Optional callback for response metadata columns.
 * @param options.pageSize - Number of records to request for the current page.
 * @param options.query - Datasource-aware platform tabular query from the table tile definition.
 * @param options.stripUnknownFilters - Filter sanitizer for the target datasource.
 * @param options.tabularQueryFn - Analytics bridge function that executes the tabular query.
 * @returns A TableDataGrid page result with rows, the next cursor, and whether more pages are available.
 */
const platformTableDataGridFetcher = async ({
  abortController,
  context,
  cursor,
  pageSize,
  query,
  onResponseColumns,
  stripUnknownFilters,
  tabularQueryFn,
}: {
  abortController: AbortController
  context: DashboardRendererContextInternal
  cursor?: unknown
  onResponseColumns?: (columns: string[]) => void
  pageSize: number
  query: PlatformDatasourceTabularQuery
  stripUnknownFilters: StripUnknownFilters
  tabularQueryFn: AnalyticsBridge['tabularQueryFn']
}): Promise<TableDataGridFetcherResult<TableDataGridRow>> => {
  if (!tabularQueryFn) {
    throw new Error('AnalyticsBridge.tabularQueryFn is not defined')
  }

  const platformQuery = query.query
  const filters = stripUnknownFilters({
    datasource: 'platform',
    filters: [
      ...((platformQuery.filters ?? []) as AllFilters[]),
      ...context.filters,
    ],
    queryFields: platformQuery.entity === undefined ? undefined : [platformQuery.entity],
  }) as PlatformTabularQuery['filters']

  const response = await tabularQueryFn({
    datasource: query.datasource,
    query: {
      columns: platformQuery.columns,
      cursor: cursor === undefined ? platformQuery.cursor : String(cursor),
      entity: platformQuery.entity,
      filters,
      page_size: pageSize,
    },
  }, abortController)

  if (response.meta.columns?.length) {
    onResponseColumns?.(response.meta.columns)
  }

  return {
    data: platformTabularResponseToTableDataGridRows(response),
    cursor: response.meta.cursor,
    hasMore: Boolean(response.meta.cursor),
  }
}

/**
 * Maps a table tile datasource to the fetcher used by TableDataGridRenderer.
 */
export const tableDataGridFetcherByDatasource = {
  /** @deprecated Use `platform_usage`. */
  platform: platformTableDataGridFetcher,
  platform_usage: platformTableDataGridFetcher,
}
