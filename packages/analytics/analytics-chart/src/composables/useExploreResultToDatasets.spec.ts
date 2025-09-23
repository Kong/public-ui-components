import type { AnalyticsExploreRecord, DisplayBlob, ExploreResultV4, GroupByResult, MetricUnit, QueryResponseMeta, ExploreAggregations } from '@kong-ui-public/analytics-utilities'
import { describe, it, expect } from 'vitest'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import useExploreResultToDatasets from './useExploreResultToDatasets'
import { defaultStatusCodeColors } from '../utils'

describe('useVitalsExploreDatasets', () => {
  it('can handle empty records', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [] as GroupByResult[],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998870000,
        granularity_ms: 8000,
        display: { route: { id: { name: 'dimension' } } } as DisplayBlob,
        metric_names: ['request_count'],
        query_id: '',
        metric_units: { request_count: 'units' } as MetricUnit,
        truncated: false,
        limit: 15,
      } as QueryResponseMeta,
    }))

    const result = useExploreResultToDatasets({ fill: true }, exploreResult)

    expect(result.value).toEqual({ datasets: [], labels: [] })
  })

  it('can handle null metric values', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [{
        timestamp: '2022-01-01T01:01:02Z',
        event: {
          route: 'id',
        },
      }],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998870000,
        granularity_ms: 8000,
        display: { route: { id: { name: 'dimension' } } } as DisplayBlob,
        metric_names: ['request_count'],
        query_id: '',
        metric_units: { request_count: 'units' },
        truncated: false,
        limit: 15,
      },
    } as ExploreResultV4))

    const result = useExploreResultToDatasets({ fill: true }, exploreResult)

    expect(result.value).toEqual({
      datasets: [
        {
          backgroundColor: '#a86cd5',
          data: [
            null,
          ],
          label: 'dimension',
          isSegmentEmpty: false,
        },
      ],
      labels: [
        'dimension',
      ],
      isMultiDimension: false,
      isLabelEmpty: [false],
    })
  })

  it('can handle no meta', () => {
    const exploreResult: ComputedRef = computed(() => ({
      data: [],
      meta: {},
    }))

    const result = useExploreResultToDatasets({ fill: true }, exploreResult)

    expect(result.value).toEqual({ datasets: [], labels: [] })
  })

  it('single dimension result works as normal', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            request_count: 1,
            route: 'dimension-uuid',
          },
        },
      ],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998870000,
        granularity_ms: 8000,
        display: { route: { 'dimension-uuid': { name: 'dimension1' } } },
        metric_names: ['request_count'],
        query_id: '',
        metric_units: { request_count: 'units' },
        truncated: false,
        limit: 15,
      },
    }))
    const result = useExploreResultToDatasets({ fill: true }, exploreResult)

    expect(result.value).toEqual(
      {
        labels: ['dimension1'],
        datasets: [
          { label: 'dimension1', backgroundColor: '#a86cd5', data: [1], isSegmentEmpty: false },
        ],
        isMultiDimension: false,
        isLabelEmpty: [false],
      },
    )
  })

  it('handles multi dimension query', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: '2023-02-20T21:00:00.000Z',
          event: {
            GroupBy: 'group-by-1',
            ThenBy: 'then-by-1',
            request_count: 100,
          },
        },
        {
          timestamp: '2023-02-20T21:00:00.000Z',
          event: {
            GroupBy: 'group-by-1',
            ThenBy: 'then-by-2',
            request_count: 150,
          },
        },
        {
          timestamp: '2023-02-20T21:00:00.000Z',
          event: {
            GroupBy: 'group-by-2',
            ThenBy: 'then-by-3',
            request_count: 200,
          },
        },
        {
          timestamp: '2023-02-20T21:00:00.000Z',
          event: {
            GroupBy: 'group-by-2',
            ThenBy: 'then-by-4',
            request_count: 250,
          },
        },
      ],
      meta: {
        start_ms: 1669928400000,
        end_ms: 1670014800000,
        granularity_ms: 86400000,
        metric_names: ['request_count'],
        display: {
          GroupBy: { 'group-by-1': { name: 'GroupBy1' }, 'group-by-2': { name: 'GroupBy2' } },
          ThenBy: { 'then-by-1': { name: 'ThenBy1' }, 'then-by-2': { name: 'ThenBy2' }, 'then-by-3': { name: 'ThenBy3' }, 'then-by-4': { name: 'ThenBy4' } },
        },
        query_id: '',
        metric_units: { request_count: 'units' },
        truncated: false,
        limit: 15,
      } as QueryResponseMeta,
    }))
    const result = useExploreResultToDatasets({ fill: true }, exploreResult)

    expect(result.value).toEqual(
      {
        labels: ['GroupBy2', 'GroupBy1'],
        datasets: [
          { label: 'ThenBy1', backgroundColor: '#a86cd5', data: [null, 100], isSegmentEmpty: false },
          { label: 'ThenBy2', backgroundColor: '#6a86d2', data: [null, 150], isSegmentEmpty: false },
          { label: 'ThenBy3', backgroundColor: '#00bbf9', data: [200, null], isSegmentEmpty: false },
          { label: 'ThenBy4', backgroundColor: '#00c4b0', data: [250, null], isSegmentEmpty: false },
        ],
        isLabelEmpty: [false, false],
        isMultiDimension: true,
      },
    )
  })

  it('handles empty by looking at ID', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: '2023-02-20T21:00:00.000Z',
          event: {
            GroupBy: 'empty',
            ThenBy: 'then-by-1',
            request_count: 100,
          },
        },
        {
          timestamp: '2023-02-20T21:00:00.000Z',
          event: {
            GroupBy: 'empty',
            ThenBy: 'empty',
            request_count: 150,
          },
        },
        {
          timestamp: '2023-02-20T21:00:00.000Z',
          event: {
            GroupBy: 'group-by-2',
            ThenBy: 'then-by-3',
            request_count: 200,
          },
        },
        {
          timestamp: '2023-02-20T21:00:00.000Z',
          event: {
            GroupBy: 'group-by-2',
            ThenBy: 'then-by-4',
            request_count: 250,
          },
        },
      ],
      meta: {
        start_ms: 1669928400000,
        end_ms: 1670014800000,
        granularity_ms: 86400000,
        metric_names: ['request_count'],
        display: {
          GroupBy: { 'empty': { name: 'GroupBy1' }, 'group-by-2': { name: 'GroupBy2' } },
          ThenBy: { 'then-by-1': { name: 'ThenBy1' }, 'empty': { name: 'ThenBy2' }, 'then-by-3': { name: 'ThenBy3' }, 'then-by-4': { name: 'ThenBy4' } },
        },
        query_id: '',
        metric_units: { request_count: 'units' },
        truncated: false,
        limit: 15,
      } as QueryResponseMeta,
    }))
    const result = useExploreResultToDatasets({ fill: true }, exploreResult)

    expect(result.value).toEqual(
      {
        labels: ['GroupBy2', 'GroupBy1'],
        datasets: [
          { label: 'ThenBy1', backgroundColor: '#a86cd5', data: [null, 100], isSegmentEmpty: false },
          { label: 'ThenBy3', backgroundColor: '#6a86d2', data: [200, null], isSegmentEmpty: false },
          { label: 'ThenBy4', backgroundColor: '#00bbf9', data: [250, null], isSegmentEmpty: false },
          { label: 'ThenBy2', backgroundColor: '#afb7c5', data: [null, 150], isSegmentEmpty: true },
        ],
        isLabelEmpty: [false, true],
        isMultiDimension: true,
      },
    )
  })

  it('handles no dimension', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            request_count: 1,
          },
        },
      ],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998870000,
        granularity_ms: 8000,
        metric_names: ['request_count'],
        query_id: '',
        metric_units: { request_count: 'units' },
        truncated: false,
        limit: 15,
        display: {},
      },
    }))
    const result = useExploreResultToDatasets({ fill: true }, exploreResult)

    expect(result.value).toEqual(
      {
        labels: ['Request count'],
        datasets: [
          { label: 'Request count', backgroundColor: '#a86cd5', data: [1], isSegmentEmpty: false },
        ],
        isLabelEmpty: [false],
        isMultiDimension: false,
      },
    )
  })

  it('handles multiple metrics with no dimension', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            metric1: 1,
            metric2: 2,
          },
        } as GroupByResult,
      ],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998870000,
        granularity_ms: 8000,
        metric_names: [
          'metric1',
          'metric2',
        ] as any as ExploreAggregations[],
        query_id: '',
        metric_units: { metric1: 'units', metric2: 'units' },
        truncated: false,
        limit: 15,
        display: {},
      } as QueryResponseMeta,
    }))
    const result = useExploreResultToDatasets({ fill: true }, exploreResult)

    expect(result.value).toEqual(
      {
        labels: ['metric1', 'metric2'],
        datasets: [
          { label: 'metric1', backgroundColor: '#a86cd5', data: [1, null] },
          { label: 'metric2', backgroundColor: '#6a86d2', data: [null, 2] },
        ],
        isLabelEmpty: [false, false],
        isMultiDimension: false,
      },
    )
  })

  it('handles multiple metrics with dimension', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            metric1: 1,
            metric2: 2,
            gateway_service: 'service1',
          },
        },
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            metric1: 3,
            metric2: 4,
            gateway_service: 'service2',
          },
        },
      ],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998870000,
        granularity_ms: 8000,
        metric_names: [
          'metric1',
          'metric2',
        ] as any as ExploreAggregations[],
        query_id: '',
        metric_units: { metric1: 'units', metric2: 'units' },
        truncated: false,
        limit: 15,
        display: {
          gateway_service: {
            service1: { name: 'service1' },
            service2: { name: 'service2' },
          },
        },
      } as QueryResponseMeta,
    }))
    const result = useExploreResultToDatasets({ fill: true }, exploreResult)

    expect(result.value).toEqual(
      {
        labels: ['service2', 'service1'],
        datasets: [
          { label: 'metric1', backgroundColor: '#a86cd5', data: [3, 1] },
          { label: 'metric2', backgroundColor: '#6a86d2', data: [4, 2] },
        ],
        isLabelEmpty: [false, false],
        isMultiDimension: false,
      },
    )
  })

  it('Correct status code colors', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            status_code: 100,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            status_code: 200,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            status_code: 300,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            status_code: 400,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            status_code: 500,
            metric1: 2,
          },
        } as GroupByResult,
      ],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998870000,
        granularity_ms: 86400000,
        metric_names: ['metric1'] as any as ExploreAggregations[],
        display: {
          status_code: {
            100: {
              name: '100',
              deleted: false,
            },
            200: {
              name: '200',
              deleted: false,
            },
            300: {
              name: '300',
              deleted: false,
            },
            400: {
              name: '400',
              deleted: false,
            },
            500: {
              name: '500',
              deleted: false,
            },
          },
        },
        query_id: '',
        metric_units: { metric: 'units' } as MetricUnit,
      },
    }))
    const result = useExploreResultToDatasets(
      { fill: false, colorPalette: defaultStatusCodeColors },
      exploreResult,
    )

    expect(result.value.datasets[0].backgroundColor).toEqual('#80bfff')
    expect(result.value.datasets[1].backgroundColor).toEqual('#9edca6')
    expect(result.value.datasets[2].backgroundColor).toEqual('#ffe9b8')
    expect(result.value.datasets[3].backgroundColor).toEqual('#ffd5b1')
    expect(result.value.datasets[4].backgroundColor).toEqual('#ffb6b6')
  })


  it('sorts datasets accordingly', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            route: 'route1',
            status_code: 100,
            metric1: 1,
          },
        } as GroupByResult,
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            route: 'route1',
            status_code: 200,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            route: 'route2',
            status_code: 100,
            metric1: 7,
          },
        } as GroupByResult,
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            route: 'route2',
            status_code: 200,
            metric1: 1,
          },
        } as GroupByResult,
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            route: 'route3',
            status_code: 100,
            metric1: 5,
          },
        } as GroupByResult,
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            route: 'route3',
            status_code: 200,
            metric1: 5,
          },
        } as GroupByResult,
      ],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998870000,
        granularity_ms: 86400000,
        metric_names: ['metric1'] as any as ExploreAggregations[],
        display: {
          route: {
            route1: { name: 'route1' },
            route2: { name: 'route2' },
            route3: { name: 'route3' },
          },
          status_code: {
            100: {
              name: '100',
              deleted: false,
            },
            200: {
              name: '200',
              deleted: false,
            },
          },
        },
        query_id: '',
        metric_units: { metric: 'units' } as MetricUnit,
      },
    }))
    const result = useExploreResultToDatasets(
      { fill: false, colorPalette: defaultStatusCodeColors },
      exploreResult,
    )

    expect(result.value.labels).toEqual(['route3', 'route2', 'route1'])
  })

  it('maps country_code values to full country names via getCountryName', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: '2025-01-01T00:00:00Z',
          event: { country_code: 'US', request_count: 10 },
        },
        {
          timestamp: '2025-01-01T01:00:00Z',
          event: { country_code: 'DE', request_count: 7 },
        },
      ] as AnalyticsExploreRecord[],
      meta: {
        start_ms: 1735689600000,
        end_ms: 1735693200000,
        granularity_ms: 60000,
        metric_names: ['request_count'],
        display: {
          country_code: {
            US: { name: 'US' },
            DE: { name: 'DE' },
          },
        } as DisplayBlob,
        query_id: 'test-country',
        metric_units: { request_count: 'count' },
        truncated: false,
        limit: 1000,
      } as QueryResponseMeta,
    }))

    const result = useExploreResultToDatasets(
      { fill: false, colorPalette: defaultStatusCodeColors },
      exploreResult,
    )

    expect(result.value.labels).toEqual(['United States', 'Germany'])

    expect(result.value.datasets).toHaveLength(2)
    expect(result.value.datasets[0].data).toEqual([10, null])
    expect(result.value.datasets[1].data).toEqual([null, 7])
  })
})
