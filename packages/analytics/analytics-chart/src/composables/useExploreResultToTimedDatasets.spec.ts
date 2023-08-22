import type { AnalyticsExploreResult } from '@kong-ui-public/analytics-utilities'
import type { SpyInstance } from 'vitest'
import { describe, it, expect, vitest } from 'vitest'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import useExploreResultToTimeDataset from './useExploreResultToTimeDatasets'

const START_FOR_DAILY_QUERY = new Date(1672560000000)
const END_FOR_DAILY_QUERY = new Date(1672646400000)

describe('useVitalsExploreDatasets', () => {
  let _consoleErrorSpy: SpyInstance

  beforeEach(() => {
    vitest.restoreAllMocks()

    _consoleErrorSpy = vitest.spyOn(global.console, 'error').mockImplementation(() => vitest.fn())
  })

  it('can handle invalid step values', () => {
    const exploreResult: ComputedRef<AnalyticsExploreResult> = computed(() => ({
      records: [],
      meta: {
        start: 1667308380,
        end: 1667481180,
        granularity: 0,
        dimensions: { dimension: ['dimension'] },
        metricNames: ['metric'],
        queryId: '',
        metricUnits: { units: 'units' },
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value).toEqual({ datasets: [] })
    expect(_consoleErrorSpy).toHaveBeenCalled()
  })

  it('can handle empty records', () => {
    const exploreResult: ComputedRef<AnalyticsExploreResult> = computed(() => ({
      records: [],
      meta: {
        start: 1640998862,
        end: 1640998870,
        granularity: 5000,
        dimensions: { dimension: ['dimension'] },
        metricNames: ['metric'],
        queryId: '',
        metricUnits: { units: 'units' },
      },
    }))

    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value).toEqual({ datasets: [] })
  })

  it('fills in empty-start values', () => {
    const exploreResult: ComputedRef<AnalyticsExploreResult> = computed(() => ({
      records: [
        {
          version: 'v1',
          timestamp: '2022-01-01T01:01:07Z',
          event: {
            metric: 1,
            dimension: 'label',
          },
        },
      ],
      meta: {
        start: 1640998862, // 2022-01-01T01:01:02Z
        end: 1640998870, // 2022-01-01T01:01:10Z
        granularity: 5000, // (5 seconds)
        dimensions: { dimension: ['dimension'] },
        metricNames: ['metric'],
        queryId: '',
        metricUnits: { units: 'units' },
      },
    }))

    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value.datasets[0].data).toEqual(
      [
        {
          x: 1640998862000,
          y: 0,
        },
        {
          x: 1640998867000,
          y: 1,
        },
      ],
    )
  })

  it('shaves off late 0s', () => {
    const exploreResult: ComputedRef<AnalyticsExploreResult> = computed(() => ({
      records: [
        {
          version: 'v1',
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            metric: 1,
            dimension: 'label',
          },
        },
      ],
      meta: {
        start: 1640998862, // 2022-01-01T01:01:02Z
        end: 1640998872, // 2022-01-01T01:01:10Z
        granularity: 5000,
        dimensions: { dimension: ['dimension'] },
        metricNames: ['metric'],
        queryId: '',
        metricUnits: { units: 'units' },
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value.datasets[0].data).toEqual(
      [
        {
          x: 1640998862000,
          y: 1,
        },
      ],
    )
  })

  it('keeps full data', () => {
    const exploreResult: ComputedRef<AnalyticsExploreResult> = computed(() => ({
      records: [
        {
          version: 'v1',
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            metric: 1,
            dimension: 'label',
          },
        },
        {
          version: 'v1',
          timestamp: '2022-01-01T01:01:07Z',
          event: {
            metric: 1,
            dimension: 'label',
          },
        },
      ],
      meta: {
        start: 1640998862,
        end: 1640998870,
        granularity: 5000,
        dimensions: { dimension: ['dimension'] },
        metricNames: ['metric'],
        queryId: '',
        metricUnits: { units: 'units' },
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value.datasets[0].data).toEqual(
      [
        {
          x: 1640998862000,
          y: 1,
        },
        {
          x: 1640998867000,
          y: 1,
        },
      ],
    )
  })

  it('handles daily granularity and locking to localtime', () => {
    const exploreResult: ComputedRef<AnalyticsExploreResult> = computed(() => ({
      records: [
        {
          version: 'v1',
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric: 1,
            dimension: 'label',
          },
        },
        {
          version: 'v1',
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric: 1,
            dimension: 'label',
          },
        },
      ],
      meta: {
        start: Math.trunc(START_FOR_DAILY_QUERY.getTime() / 1000),
        end: Math.trunc(END_FOR_DAILY_QUERY.getTime() / 1000),
        granularity: 86400000,
        dimensions: { dimension: ['dimension'] },
        metricNames: ['metric'],
        queryId: '',
        metricUnits: { units: 'units' },
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value.datasets[0].data).toEqual(
      [
        {
          x: START_FOR_DAILY_QUERY.getTime(),
          y: 1,
        },
        {
          x: END_FOR_DAILY_QUERY.getTime(),
          y: 1,
        },
      ],
    )
  })

  it('handles multi-metric/no dimension query', () => {
    const exploreResult: ComputedRef<AnalyticsExploreResult> = computed(() => ({
      records: [
        {
          version: 'v1',
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 1,
            metric2: 2,
          },
        },
        {
          version: 'v1',
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 1,
            metric2: 2,
          },
        },
      ],
      meta: {
        start: Math.trunc(START_FOR_DAILY_QUERY.getTime() / 1000),
        end: Math.trunc(END_FOR_DAILY_QUERY.getTime() / 1000),
        granularity: 86400000,
        metricNames: ['metric1', 'metric2'],
        dimensions: {},
        queryId: '',
        metricUnits: { metric1: 'units' },
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value.datasets[0].data).toEqual(
      [
        {
          x: START_FOR_DAILY_QUERY.getTime(),
          y: 1,
        },
        {
          x: END_FOR_DAILY_QUERY.getTime(),
          y: 1,
        },
      ],
    )
    expect(result.value.datasets[1].data).toEqual(
      [
        {
          x: START_FOR_DAILY_QUERY.getTime(),
          y: 2,
        },
        {
          x: END_FOR_DAILY_QUERY.getTime(),
          y: 2,
        },
      ],
    )

    expect(result.value.datasets[0].label).toEqual('metric1')
    expect(result.value.datasets[1].label).toEqual('metric2')
  })

  it('Datasets sorted by total descending', () => {
    const exploreResult: ComputedRef<AnalyticsExploreResult> = computed(() => ({
      records: [
        {
          version: 'v1',
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 2,
            metric2: 1,
          },
        },
        {
          version: 'v1',
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 2,
            metric2: 1,
          },
        },
      ],
      meta: {
        start: Math.trunc(START_FOR_DAILY_QUERY.getTime() / 1000),
        end: Math.trunc(END_FOR_DAILY_QUERY.getTime() / 1000),
        granularity: 86400000,
        metricNames: ['metric1', 'metric2'],
        dimensions: {},
        queryId: '',
        metricUnits: { metric1: 'units' },
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value.datasets[0].label).toEqual('metric2')
  })

})

it('handle no dimension query', () => {
  const exploreResult: ComputedRef<AnalyticsExploreResult> = computed(() => ({
    records: [
      {
        version: 'v1',
        timestamp: START_FOR_DAILY_QUERY.toISOString(),
        event: {
          metric1: 1,
        },
      },
      {
        version: 'v1',
        timestamp: END_FOR_DAILY_QUERY.toISOString(),
        event: {
          metric1: 2,
        },
      },
    ],
    meta: {
      start: Math.trunc(START_FOR_DAILY_QUERY.getTime() / 1000),
      end: Math.trunc(END_FOR_DAILY_QUERY.getTime() / 1000),
      granularity: 86400000,
      metricNames: ['metric1'],
      queryId: '',
      metricUnits: { metric1: 'units' },
    },
  }))
  const result = useExploreResultToTimeDataset(
    { fill: false },
    exploreResult,
  )

  expect(result.value.datasets[0].data).toEqual(
    [
      {
        x: START_FOR_DAILY_QUERY.getTime(),
        y: 1,
      },
      {
        x: END_FOR_DAILY_QUERY.getTime(),
        y: 2,
      },
    ],
  )

  expect(result.value.datasets[0].label).toEqual('metric1')
})

it('handle empty dimension query', () => {
  const exploreResult: ComputedRef<AnalyticsExploreResult> = computed(() => ({
    records: [
      {
        version: 'v1',
        timestamp: START_FOR_DAILY_QUERY.toISOString(),
        event: {
          metric1: 1,
        },
      },
      {
        version: 'v1',
        timestamp: END_FOR_DAILY_QUERY.toISOString(),
        event: {
          metric1: 2,
        },
      },
    ],
    meta: {
      start: Math.trunc(START_FOR_DAILY_QUERY.getTime() / 1000),
      end: Math.trunc(END_FOR_DAILY_QUERY.getTime() / 1000),
      granularity: 86400000,
      metricNames: ['metric1'],
      queryId: '',
      metricUnits: { metric1: 'units' },
      dimensions: {},
    },
  }))
  const result = useExploreResultToTimeDataset(
    { fill: false },
    exploreResult,
  )

  expect(result.value.datasets[0].data).toEqual(
    [
      {
        x: START_FOR_DAILY_QUERY.getTime(),
        y: 1,
      },
      {
        x: END_FOR_DAILY_QUERY.getTime(),
        y: 2,
      },
    ],
  )

  expect(result.value.datasets[0].label).toEqual('metric1')
})
