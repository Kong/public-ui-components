import { useAnalyticsConfigStore } from '@kong-ui-public/analytics-config-store'
import PQueue from 'p-queue'
import type { AnalyticsBridge } from '@kong-ui-public/analytics-utilities'
import { inject, provide } from 'vue'
import { INJECT_QUERY_PROVIDER } from '../constants'

interface OverriddenAnalyticsBridge extends AnalyticsBridge {
  queryFnOverride?: boolean
}

const useRequestQueue = () => {
  const configStore = useAnalyticsConfigStore()
  const queryBridge: OverriddenAnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

  if (!queryBridge) {
    // If there's no query bridge injected, we can't make a request queue.
    return
  }

  if (queryBridge.queryFnOverride) {
    // Someone goofed; this composable isn't intended to be nested.
    // If someone has a use case for this, we should revisit the design.
    console.warn('Detected incorrect use of useRequestQueue.  This composable should not be used in nested components.  Please discuss with team-data or report an issue if you feel you have a use case.')
    return
  }

  const queue = new PQueue({
    carryoverConcurrencyCount: true,
    concurrency: configStore.maxParallelRequests,
    interval: configStore.requestInterval,
    intervalCap: configStore.requestIntervalCap,
  })

  // Override the parent `queryFn` with a new one that limits concurrency of requests.
  const newQueryBridge: OverriddenAnalyticsBridge = {
    ...queryBridge,
    queryFnOverride: true,
    queryFn: (query, abortController) => queue.add(() => {
      if (abortController.signal.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError')
      }

      return queryBridge.queryFn(query, abortController)
    }, { throwOnTimeout: true }),
  }

  provide(INJECT_QUERY_PROVIDER, newQueryBridge)
}

export default useRequestQueue
