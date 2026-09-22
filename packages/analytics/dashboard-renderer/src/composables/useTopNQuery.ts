import type { ExploreResultV4, TopNTableOptions } from '@kong-ui-public/analytics-utilities'
// Reuse QueryDataProvider's error translation for the Explore fetcher path.
import type { QueryError } from '@kong-ui-public/analytics-chart'
import { handleQueryError } from '@kong-ui-public/analytics-chart'
import type { TableDataGridUnpaginatedFetcher } from '@kong-ui-public/table-data-grid'
import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'
import type { ChartRendererProps } from '../types'
import useIssueQuery from './useIssueQuery'
import { topNTableDataGridFetcher } from '../utils/table-data-grid-renderer'
import type { TopNGridRow } from '../utils/topn-columns'

/**
 * Adapt Explore queries to a grid-owned fetcher, retaining the last response during refresh.
 * Context changes cancel pending queries; only the current request may publish metadata or events.
 * Interval refresh waits for completion before scheduling the next invalidation.
 *
 * @param options - Renderer inputs and lifecycle callbacks.
 * @param options.props - Reactive query, readiness, context, and refresh inputs.
 * @param options.chartData - Publishes the original current response.
 * @param options.queryComplete - Signals completion of the current request.
 * @returns A reactive fetcher and readonly response and translated error state.
 */
export default function useTopNQuery({
  props,
  chartData,
  queryComplete,
}: {
  props: Readonly<ChartRendererProps<TopNTableOptions>>
  chartData: (result: ExploreResultV4) => void
  queryComplete: () => void
}) {
  const { issueQuery, cancelQuery } = useIssueQuery()
  const response = shallowRef<ExploreResultV4>()
  const queryError = shallowRef<QueryError | null>(null)
  const intervalRefresh = ref(0)
  let generation = 0
  let disposed = false

  const requestKey = computed(() => JSON.stringify([
    props.queryReady,
    props.query,
    props.context,
    props.refreshCounter,
    intervalRefresh.value,
  ]))

  // Invalidate before the next grid render, including when readiness removes it.
  watch(requestKey, () => {
    generation++
    clearRefreshTimer()
    cancelQuery()
  }, { flush: 'sync' })

  let refreshTimer: ReturnType<typeof setTimeout> | undefined
  const clearRefreshTimer = () => {
    clearTimeout(refreshTimer)
    refreshTimer = undefined
  }
  const scheduleRefresh = () => {
    clearRefreshTimer()
    const interval = props.context.refreshInterval
    if (disposed || !props.queryReady || !interval || interval <= 0) {
      return
    }
    refreshTimer = setTimeout(() => intervalRefresh.value++, interval)
  }

  const fetcher = computed<TableDataGridUnpaginatedFetcher<TopNGridRow>>(() => {
    const key = requestKey.value
    return async () => {
      if (disposed || !props.queryReady || key !== requestKey.value) {
        throw new DOMException('Query superseded', 'AbortError')
      }
      const current = ++generation
      const isCurrent = () => !disposed && current === generation && key === requestKey.value
      queryError.value = null
      clearRefreshTimer()

      try {
        const result = await topNTableDataGridFetcher({
          context: props.context,
          issueQuery,
          query: props.query,
        })
        if (!isCurrent()) {
          throw new DOMException('Query superseded', 'AbortError')
        }
        response.value = result.response
        chartData(result.response)
        return { data: result.data }
      } catch (error) {
        if (isCurrent()) {
          queryError.value = handleQueryError(error ?? new Error('Explore query failed'))
        }
        throw error
      } finally {
        if (isCurrent()) {
          queryComplete()
          scheduleRefresh()
        }
      }
    }
  })

  onUnmounted(() => {
    disposed = true
    clearRefreshTimer()
    generation++
    cancelQuery()
  })

  return {
    fetcher,
    response: computed(() => response.value),
    queryError: computed(() => queryError.value),
  }
}
