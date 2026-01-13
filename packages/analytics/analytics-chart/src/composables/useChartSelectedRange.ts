import type { Ref } from 'vue'
import { computed } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { formatTimestamp } from '@kong-ui-public/analytics-utilities'

export default function useChartSelectedRange(chartData: Ref<ExploreResultV4>): Ref<string> {
  const formattedTimeRange = computed(() => {
    if (!chartData.value?.meta) {
      return ''
    }

    const start = chartData.value.meta.start
    const end = chartData.value.meta.end

    return start && end
      ? `${formatTimestamp(new Date(start))} - ${formatTimestamp(new Date(end), { includeTZ: true })}`
      : ''
  })

  return formattedTimeRange
}
