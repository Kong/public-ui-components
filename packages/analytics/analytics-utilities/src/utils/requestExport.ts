import type { Ref } from 'vue'
import type { AnalyticsBridge, CsvExportState, DatasourceAwareQuery, ExploreResultV4 } from '../types'

import { inject, onUnmounted, ref } from 'vue'
import { EXPORT_RECORD_LIMIT, INJECT_QUERY_PROVIDER } from '../constants'

type RequestExportOptions = {
  /** Build a query that includes `datasource` and a `query` with `limit` already applied */
  buildQuery: (limit: number) => DatasourceAwareQuery
  /** Default limit (e.g. EXPORT_RECORD_LIMIT) */
  defaultLimit?: number
  /** Injection key (defaults to INJECT_QUERY_PROVIDER) */
  injectKey?: string
}

export function useAnalyticsRequestExport({ buildQuery, defaultLimit = EXPORT_RECORD_LIMIT, injectKey }: RequestExportOptions) {
  const queryBridge = inject<AnalyticsBridge | undefined>(injectKey ?? INJECT_QUERY_PROVIDER)

  if (!queryBridge?.queryFn) {
    throw new Error('useAnalyticsRequestExport: missing injected query bridge.')
  }

  const exportState: Ref<CsvExportState> = ref({ status: 'loading' })
  let controller: AbortController | null = null

  const cancelExport = () => {
    controller?.abort()
    controller = null
  }

  const resetExport = () => {
    exportState.value = { status: 'loading' }
  }

  onUnmounted(cancelExport)

  async function requestExport(limit: number = defaultLimit): Promise<void> {
    exportState.value = { status: 'loading' }

    controller?.abort()
    controller = new AbortController()

    try {
      if (queryBridge) {
        const payload = buildQuery(limit)
        const data: ExploreResultV4 = await queryBridge.queryFn(payload, controller)

        if (data) {
          exportState.value = { status: 'success', chartData: data }
        }
      }
    } catch (error) {
      exportState.value = { status: 'error', error }
    }
  }

  return {
    exportState,
    requestExport,
    cancelExport,
    resetExport,
  }
}
