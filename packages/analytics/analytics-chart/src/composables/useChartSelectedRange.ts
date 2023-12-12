import type { Ref } from 'vue'
import { computed } from 'vue'
import type { AnalyticsExploreResult, AnalyticsExploreV2Result } from '@kong-ui-public/analytics-utilities'
import { formatTime } from '../utils'

export default function useChartSelectedRange(chartData: AnalyticsExploreResult | AnalyticsExploreV2Result): Ref<string> {
  const formattedTimeRange = computed(() => {
    if (!chartData?.meta) { return '' }

    const start = 'startMs' in chartData.meta ? chartData.meta.startMs : chartData.meta?.start * 1000 || ''
    const end = 'endMs' in chartData.meta ? chartData.meta.endMs : chartData.meta?.end * 1000 || ''

    return start && end
      ? `${formatTime(start)} - ${formatTime(end, { includeTZ: true })}`
      : ''
  })

  return formattedTimeRange
}
