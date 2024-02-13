import type { Ref } from 'vue'
import { computed } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { formatTime } from '../utils'

export default function useChartSelectedRange(chartData: Ref<ExploreResultV4>): Ref<string> {
  const formattedTimeRange = computed(() => {
    if (!chartData.value?.meta) { return '' }

    const start = chartData.value.meta.start_ms
    const end = chartData.value.meta.end_ms

    return start && end
      ? `${formatTime(start)} - ${formatTime(end, { includeTZ: true })}`
      : ''
  })

  return formattedTimeRange
}
