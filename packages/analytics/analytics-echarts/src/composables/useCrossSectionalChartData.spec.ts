import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import {
  KUI_STATUS_COLOR_200,
  KUI_STATUS_COLOR_404,
  KUI_STATUS_COLOR_500,
} from '@kong/design-tokens'
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
    expect(chartData.value.datasets.map(({ label }) => label)).toEqual(['Alpha, Beta', 'Alpha'])
  })

  it('keeps status code dimensions in lexical order', () => {
    const exploreResult = ref({
      meta: {
        metric_names: ['request_count'],
        display: {
          status_code: {
            '200': { name: '200' },
            '404': { name: '404' },
            '500': { name: '500' },
          },
        },
      },
      data: [
        {
          event: {
            status_code: '404',
            request_count: 10,
          },
        },
        {
          event: {
            status_code: '200',
            request_count: 100,
          },
        },
        {
          event: {
            status_code: '500',
            request_count: 50,
          },
        },
      ],
    } as ExploreResultV4)

    const chartData = useCrossSectionalChartData({}, exploreResult)

    expect(chartData.value.labels).toEqual(['200', '404', '500'])
    expect(chartData.value.datasets.map(({ label }) => label)).toEqual(['200', '404', '500'])
  })

  it('uses status-code colors by default for status code dimensions', () => {
    const exploreResult = ref({
      meta: {
        metric_names: ['request_count'],
        display: {
          status_code: {
            200: { name: '200' },
            404: { name: '404' },
            500: { name: '500' },
          },
        },
      },
      data: [
        {
          event: {
            status_code: '404',
            request_count: 10,
          },
        },
        {
          event: {
            status_code: '200',
            request_count: 100,
          },
        },
        {
          event: {
            status_code: '500',
            request_count: 50,
          },
        },
      ],
    } as ExploreResultV4)

    const chartData = useCrossSectionalChartData({}, exploreResult)

    expect(chartData.value.datasets.map(({ backgroundColor }) => backgroundColor)).toEqual([
      KUI_STATUS_COLOR_200,
      KUI_STATUS_COLOR_404,
      KUI_STATUS_COLOR_500,
    ])
  })

  it('keeps non-status dimensions and dataset totals in descending order', () => {
    const exploreResult = ref({
      meta: {
        metric_names: ['request_count'],
        display: {
          route: {
            alpha: { name: 'Alpha' },
            beta: { name: 'Beta' },
            gamma: { name: 'Gamma' },
          },
          service: {
            payments: { name: 'Payments' },
            search: { name: 'Search' },
          },
        },
      },
      data: [
        {
          event: {
            route: 'alpha',
            service: 'payments',
            request_count: 30,
          },
        },
        {
          event: {
            route: 'alpha',
            service: 'search',
            request_count: 15,
          },
        },
        {
          event: {
            route: 'beta',
            service: 'payments',
            request_count: 20,
          },
        },
        {
          event: {
            route: 'beta',
            service: 'search',
            request_count: 5,
          },
        },
        {
          event: {
            route: 'gamma',
            service: 'payments',
            request_count: 10,
          },
        },
        {
          event: {
            route: 'gamma',
            service: 'search',
            request_count: 60,
          },
        },
      ],
    } as ExploreResultV4)

    const chartData = useCrossSectionalChartData({}, exploreResult)

    expect(chartData.value.labels).toEqual(['Gamma', 'Alpha', 'Beta'])
    expect(chartData.value.datasets.map(({ label }) => label)).toEqual(['Search', 'Payments'])
    expect(chartData.value.datasets.map(({ total }) => total)).toEqual([80, 60])
  })
})
