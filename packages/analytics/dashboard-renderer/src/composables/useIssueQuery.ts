import {
  type AllFilters, type AnalyticsBridge, type DatasourceAwareQuery, type ExploreFilterAll, type ExploreQuery,
  type FilterTypeMap,
  type QueryDatasource, stripUnknownFilters, type TimeRangeV4,
  type ValidDashboardQuery,
} from '@kong-ui-public/analytics-utilities'
import type { DashboardRendererContextInternal } from '../types'
import { inject, onUnmounted } from 'vue'
import { INJECT_QUERY_PROVIDER } from '../constants'

const deriveFilters = <D extends QueryDatasource>(datasource: D, queryFilters: Array<FilterTypeMap[D]> | undefined, contextFilters: AllFilters[]): Array<FilterTypeMap[D]> => {
  const mergedFilters: Array<FilterTypeMap[D]> = []

  if (queryFilters) {
    // The filters from the query should be safe -- as in, validated to be compatible
    // with the chosen endpoint.
    mergedFilters.push(...queryFilters)
  }

  // The contextual filters may not be compatible and need to be pruned.
  mergedFilters.push(...stripUnknownFilters(datasource, contextFilters))

  return mergedFilters
}

export default function useIssueQuery() {
  const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

  // Ensure that any pending requests are canceled on unmount.
  const abortController = new AbortController()

  onUnmounted(() => {
    abortController.abort()
  })


  const issueQuery = async (query: ValidDashboardQuery, context: DashboardRendererContextInternal, limitOverride?: number) => {
    if (!queryBridge) {
      throw new Error('Query bridge is not defined')
    }

    const {
      datasource: originalDatasource,
      limit,
      ...rest
    } = query

    const datasource = originalDatasource || 'basic'

    const mergedFilters = deriveFilters(datasource, query.filters as Array<FilterTypeMap[typeof datasource]>, context.filters)

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
    const mergedQuery: DatasourceAwareQuery = {
      datasource: datasource as 'api_usage',
      query: {
        ...rest as ExploreQuery,
        time_range,
        filters: mergedFilters as ExploreFilterAll[],
        limit: limitOverride ?? limit,
      },
    }

    return queryBridge.queryFn(mergedQuery, abortController)
  }

  return { issueQuery }
}
