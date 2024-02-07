import type { AnalyticsExploreResult, DisplayBlob, ExploreAggregations, ExploreResultV4, GroupByResult, QueryResponseMeta } from '@kong-ui-public/analytics-utilities'
import { describe, it, expect } from 'vitest'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import useExploreResultToDatasets from './useExploreResultToDatasets'

describe('useVitalsExploreDatasets', () => {
  it('can handle empty records', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [] as GroupByResult[],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998870000,
        granularity_ms: 8000,
        display: { dimension: { key: { name: 'dimension' } } } as DisplayBlob,
        metric_names: ['request_count'] as ExploreAggregations[],
        query_id: '',
        metric_units: { request_count: 'units' },
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
          dimension: 'dimension',
        },
      }],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998870000,
        granularity_ms: 8000,
        display: { dimension: { key: { name: 'dimension' } } } as DisplayBlob,
        metric_names: ['request_count'] as ExploreAggregations[],
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
        },
      ],
      labels: [
        'dimension',
      ],
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
            dimension: 'dimension-uuid',
          },
        },
      ],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998870000,
        granularity_ms: 8000,
        display: { dimension: { 'dimension-uuid': { name: 'dimension1' } } } as DisplayBlob,
        metric_names: ['request_count'] as ExploreAggregations[],
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
          { label: 'dimension1', backgroundColor: '#a86cd5', data: [1] },
        ],
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
        granularity: 86400000,
        metric_names: ['request_count'] as ExploreAggregations[],
        display: {
          GroupBy: { 'group-by-1': { name: 'GroupBy1' }, 'group-by-2': { name: 'GroupBy2' } },
          ThenBy: { 'then-by-1': { name: 'ThenBy1' }, 'then-by-2': { name: 'ThenBy2' }, 'then-by-3': { name: 'ThenBy3' }, 'then-by-4': { name: 'ThenBy4' } },
        },
        query_id: '',
        metric_units: { request_count: 'units' },
        truncated: false,
        limit: 15,
      },
    }))
    const result = useExploreResultToDatasets({ fill: true }, exploreResult)

    expect(result.value).toEqual(
      {
        labels: ['GroupBy1', 'GroupBy2'],
        datasets: [
          { label: 'ThenBy1', backgroundColor: '#a86cd5', data: [100, null] },
          { label: 'ThenBy2', backgroundColor: '#6a86d2', data: [150, null] },
          { label: 'ThenBy3', backgroundColor: '#00bbf9', data: [null, 200] },
          { label: 'ThenBy4', backgroundColor: '#00c4b0', data: [null, 250] },
        ],
      },
    )
  })

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
      labels: ['Request Count'],
      datasets: [
        { label: 'Request Count', backgroundColor: '#a86cd5', data: [1] },
      ],
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
      },
    ],
    meta: {
      start_ms: 1640998862000,
      end_ms: 1640998870000,
      granularity_ms: 8000,
      metric_names: [
        'metric1',
        'metric2',
      // we just care about how the data gets formatted, not if it's a vald metric.
      ] as unknown as ExploreAggregations[],
      query_id: '',
      metric_units: { metric1: 'units', metric2: 'units' },
      truncated: false,
      limit: 15,
      display: {},
    },
  }))
  const result = useExploreResultToDatasets({ fill: true }, exploreResult)

  expect(result.value).toEqual(
    {
      labels: ['metric1', 'metric2'],
      datasets: [
        { label: 'metric1', backgroundColor: '#a86cd5', data: [1, null] },
        { label: 'metric2', backgroundColor: '#6a86d2', data: [null, 2] },
      ],
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
          Service: 'service1',
        },
      },
      {
        timestamp: '2022-01-01T01:01:02Z',
        event: {
          metric1: 3,
          metric2: 4,
          Service: 'service2',
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
      ] as unknown as ExploreAggregations[],
      query_id: '',
      metric_units: { metric1: 'units', metric2: 'units' },
      truncated: false,
      limit: 15,
      display: {
        Service: {
          service1: { name: 'service1' },
          service2: { name: 'service2' },
        },
      },
    },
  }))
  const result = useExploreResultToDatasets({ fill: true }, exploreResult)

  expect(result.value).toEqual(
    {
      labels: ['service1', 'service2'],
      datasets: [
        { label: 'metric1', backgroundColor: '#a86cd5', data: [1, 3] },
        { label: 'metric2', backgroundColor: '#6a86d2', data: [2, 4] },
      ],
    },
  )
})
