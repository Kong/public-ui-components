import {
  type AllFilters, type AnalyticsBridge, type DatasourceAwareQuery, type ExploreFilterAll, type ExploreQuery,
  type TimeRangeV4,
  type ValidDashboardChartQuery,
} from '@kong-ui-public/analytics-utilities'
import { useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'
import type { DashboardRendererContextInternal } from '../types'
import { inject, onUnmounted } from 'vue'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { storeToRefs } from 'pinia'

export default function useIssueQuery() {
  const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)
  const datasourceConfigStore = useDatasourceConfigStore()
  const { stripUnknownFilters } = storeToRefs(datasourceConfigStore)

  // Ensure that any pending requests are canceled when superseded or on unmount.
  let abortController: AbortController | null = null

  onUnmounted(() => {
    abortController?.abort()
  })

  const issueQuery = async (query: ValidDashboardChartQuery, context: DashboardRendererContextInternal, limitOverride?: number) => {
    if (!queryBridge) {
      throw new Error('Query bridge is not defined')
    }

    // This will abort any previous query and pass a new controller to the bridge.
    abortController?.abort()
    const controller = new AbortController()
    abortController = controller

    await datasourceConfigStore.isReady()

    const {
      datasource: originalDatasource,
      limit,
      ...rest
    } = query

    const datasource = originalDatasource || 'basic'

    const mergedFilters = stripUnknownFilters.value({
      datasource,
      filters: [
        ...(query.filters ?? []) as AllFilters[],
        ...context.filters,
      ],
      queryFields: query.metrics,
    })

    // TODO: the cast is necessary because TimeRangeV4 specifies date objects for absolute time ranges.
    // If they're coming from a definition, they're strings; should clean this up as part of the dashboard type work.
    let time_range = query.time_range as TimeRangeV4 | undefined

    if (!time_range) {
      time_range = {
        ...context.timeSpec,
        tz: context.tz,
      }
    } else if (!time_range.tz) {
      time_range = {
        ...time_range,
        tz: context.tz,
      }
    }

    // TODO: similar to other places, consider adding a type guard to ensure the query
    // matches the datasource.  Currently, this block effectively pretends all queries
    // are advanced in order to make the types work out.
    const mergedQuery = {
      datasource,
      query: {
        ...rest as ExploreQuery,
        time_range,
        filters: mergedFilters as ExploreFilterAll[],
        limit: limitOverride ?? limit,
      },
    } as DatasourceAwareQuery

    return queryBridge.queryFn(mergedQuery, controller)
  }

  return { issueQuery }
}
