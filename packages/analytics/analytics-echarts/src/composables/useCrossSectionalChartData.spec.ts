import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import useCrossSectionalChartData from './useCrossSectionalChartData'

describe('useCrossSectionalChartData', () => {
  it('preserves full primary dimension ids when sorting labels', () => {
    const exploreResult = ref({
      meta: {
        metric_names: ['request_count'],
        display: {
          route: {
            alpha: { name: 'Alpha' },
            'alpha,beta': { name: 'Alpha, Beta' },
          },
        },
      },
      data: [
        {
          event: {
            route: 'alpha',
            request_count: 10,
          },
        },
        {
          event: {
            route: 'alpha,beta',
            request_count: 100,
          },
        },
      ],
    } as ExploreResultV4)

    const chartData = useCrossSectionalChartData({}, exploreResult)

    expect(chartData.value.labels).toEqual(['Alpha, Beta', 'Alpha'])
  })
})
