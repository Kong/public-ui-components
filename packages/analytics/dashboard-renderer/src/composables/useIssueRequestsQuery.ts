import type {
  AllFilters,
  AnalyticsBridge,
  ApiRequestsQuery,
  FetchAllRequestsResult,
  RequestFilter,
  TimeRangeV4,
} from '@kong-ui-public/analytics-utilities'
import type { DashboardRendererContext } from '../types'

import { inject, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { fetchAllRequests } from '@kong-ui-public/analytics-utilities'
import { useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'

import { INJECT_QUERY_PROVIDER } from '../constants'
import { toRequestsTimeRange } from '../utils/requests-query'
import { limitTimeRange } from '../utils/time-range-support'

const REQUESTS_DATASOURCE = 'requests'

export default function useIssueRequestsQuery() {
  const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)
  const datasourceConfigStore = useDatasourceConfigStore()
  const { datasourceConfigMap, stripUnknownFilters } = storeToRefs(datasourceConfigStore)

  let abortController: AbortController | null = null

  onUnmounted(() => {
    abortController?.abort()
  })

  const resolveTimeRange = (query: ApiRequestsQuery, context: DashboardRendererContext) => {
    const timeRange = (query.time_range as TimeRangeV4 | undefined) ?? context.timeSpec

    return limitTimeRange(
      timeRange && { ...timeRange, tz: timeRange.tz ?? context.tz },
      datasourceConfigMap.value[REQUESTS_DATASOURCE]?.timeRangeOptions,
    )
  }

  const issueRequestsQuery = async (
    query: ApiRequestsQuery,
    context: DashboardRendererContext,
  ): Promise<FetchAllRequestsResult> => {
    const requestsQueryFn = queryBridge?.requestsQueryFn

    if (!requestsQueryFn) {
      throw new Error('Query bridge cannot fetch request records')
    }

    abortController?.abort()
    const controller = new AbortController()
    abortController = controller

    await datasourceConfigStore.isReady()

    const filters = stripUnknownFilters.value({
      datasource: REQUESTS_DATASOURCE,
      filters: [...(query.filters ?? []) as AllFilters[], ...context.filters],
    })

    return fetchAllRequests(requestsQueryFn, {
      datasource: REQUESTS_DATASOURCE,
      query: {
        filters: filters as RequestFilter[],
        time_range: toRequestsTimeRange(resolveTimeRange(query, context)),
      },
    }, controller, { maxRecords: query.max_records })
  }

  return { issueRequestsQuery }
}
