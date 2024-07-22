import type { Ref } from 'vue'
import { watch } from 'vue'

declare global {
  interface Window {
    _AnalyticsChartDataInternal?: Map<string, any>
  }
}

const useReportChartDataForSynthetics = (
  chartData: Ref<any>,
  syntheticsDataKey: Ref<string>,
) => {
  watch(
    [chartData, syntheticsDataKey],
    (newValue, _oldValue, onCleanup) => {
      const [chartData, syntheticsDataKey] = newValue

      // Check whether we should even bother reporting data.
      if (!syntheticsDataKey || !window) {
        return
      }

      // Check whether the global variable already exists.
      if (!window._AnalyticsChartDataInternal) {
        window._AnalyticsChartDataInternal = new Map()
      }

      // Store the data in the map.
      window._AnalyticsChartDataInternal.set(
        syntheticsDataKey,
        chartData,
      )

      // Register a cleanup function.
      onCleanup(() => {
        window._AnalyticsChartDataInternal?.delete(syntheticsDataKey)
      })
    },
    { immediate: true },
  )
}

export default useReportChartDataForSynthetics
