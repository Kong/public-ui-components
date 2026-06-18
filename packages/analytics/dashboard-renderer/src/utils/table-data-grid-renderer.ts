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

export const tableDataGridHeadersByDatasource = {
  platform: ({
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
  }),
}

export const tableDataGridFetcherByDatasource = {
  platform: async ({
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
  },
}
