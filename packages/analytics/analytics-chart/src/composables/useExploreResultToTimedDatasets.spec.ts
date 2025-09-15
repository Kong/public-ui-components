import type { DisplayBlob, ExploreAggregations, ExploreResultV4, GroupByResult, MetricUnit, QueryResponseMeta } from '@kong-ui-public/analytics-utilities'
import { describe, it, expect, vitest } from 'vitest'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import useExploreResultToTimeDataset from './useExploreResultToTimeDatasets'
import { BORDER_WIDTH, NO_BORDER, defaultStatusCodeColors } from '../utils'
import { addHours } from 'date-fns'
import type { MockInstance } from 'vitest'
import type { Threshold } from 'src/types'

const START_FOR_DAILY_QUERY = new Date(1672560000000)
const END_FOR_DAILY_QUERY = new Date(1672646400000)

describe('useVitalsExploreDatasets', () => {
  let _consoleErrorSpy: MockInstance

  beforeEach(() => {
    vitest.restoreAllMocks()

    _consoleErrorSpy = vitest.spyOn(global.console, 'error').mockImplementation(() => vitest.fn())
  })

  it('can handle invalid step values', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [],
      meta: {
        start_ms: 1667308380000,
        end_ms: 1667481180000,
        granularity_ms: 0,
        display: { route: { 'dimension-id': { name: 'dimension-name' } } },
        metric_names: ['request_count'],
        query_id: '',
        metric_units: { request_count: 'units' },
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value).toEqual({ datasets: [], labels: [] })
    expect(_consoleErrorSpy).toHaveBeenCalled()
  })

  it('can handle empty records', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998870000,
        granularity_ms: 5000,
        display: { route: { 'dimension-id': { name: 'dimension-name' } } },
        metric_names: ['request_count'],
        query_id: '',
        metric_units: { request_count: 'units' },
      },
    }))

    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value).toEqual({ datasets: [], labels: [] })
  })

  it('fills in empty-start values', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: '2022-01-01T01:01:07Z',
          event: {
            request_count: 1,
            route: 'id',
          },
        },
      ],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998872000,
        granularity_ms: 5000,
        display: { route: { id: { name: 'label' } } },
        metric_names: ['request_count'],
        query_id: '',
        metric_units: { request_count: 'units' },
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
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            request_count: 1,
            route: 'id',
          },
        },
      ],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998872000,
        granularity_ms: 5000,
        display: { route: { id: { name: 'label' } } },
        metric_names: ['request_count'],
        query_id: '',
        metric_units: { request_count: 'units' },
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
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: '2022-01-01T01:01:02Z',
          event: {
            request_count: 1,
            route: 'id',
          },
        },
        {
          timestamp: '2022-01-01T01:01:07Z',
          event: {
            request_count: 1,
            route: 'id',
          },
        },
      ],
      meta: {
        start_ms: 1640998862000,
        end_ms: 1640998872000,
        granularity_ms: 5000,
        display: { route: { id: { name: 'label' } } },
        metric_names: ['request_count'],
        query_id: '',
        metric_units: { request_count: 'units' },
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

    expect(result.value.datasets[0].label).toEqual('label')
  })

  it('handles daily granularity and locking to localtime', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            request_count: 1,
            route: 'id',
          },
        },
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            request_count: 1,
            route: 'id',
          },
        },
      ],
      meta: {
        start_ms: Math.trunc(START_FOR_DAILY_QUERY.getTime()),
        end_ms: Math.trunc(END_FOR_DAILY_QUERY.getTime()),
        granularity_ms: 86400000,
        display: { route: { id: { name: 'label' } } },
        metric_names: ['request_count'],
        query_id: '',
        metric_units: { request_count: 'units' },
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
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 1,
            metric2: 2,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 1,
            metric2: 2,
          },
        } as GroupByResult,
      ],
      meta: {
        start_ms: Math.trunc(START_FOR_DAILY_QUERY.getTime()),
        end_ms: Math.trunc(END_FOR_DAILY_QUERY.getTime()),
        start: new Date(Math.trunc(START_FOR_DAILY_QUERY.getTime())).toISOString(),
        end: new Date(Math.trunc(END_FOR_DAILY_QUERY.getTime())).toISOString(),
        granularity_ms: 86400000,
        metric_names: ['metric1', 'metric2'] as any as ExploreAggregations[],
        display: {},
        query_id: '',
        metric_units: { metric1: 'units' } as MetricUnit,
      } as QueryResponseMeta,
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
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 2,
            metric2: 1,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 2,
            metric2: 1,
          },
        } as GroupByResult,
      ],
      meta: {
        start_ms: Math.trunc(START_FOR_DAILY_QUERY.getTime()),
        end_ms: Math.trunc(END_FOR_DAILY_QUERY.getTime()),
        granularity_ms: 86400000,
        metric_names: ['metric1', 'metric2'] as any as ExploreAggregations[],
        display: {},
        query_id: '',
        metric_units: { metric1: 'units' } as MetricUnit,
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value.datasets[0].label).toEqual('metric2')
  })

  it('special sorting for status code', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: '200',
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: '300',
            metric1: 1,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: '200',
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: '300',
            metric1: 1,
          },
        } as GroupByResult,
      ],
      meta: {
        start_ms: Math.trunc(START_FOR_DAILY_QUERY.getTime()),
        end_ms: Math.trunc(END_FOR_DAILY_QUERY.getTime()),
        granularity_ms: 86400000,
        metric_names: ['metric1'] as any as ExploreAggregations[],
        display: {
          status_code: {
            '200': {
              name: '200',
              deleted: false,
            },
            '300': {
              name: '300',
              deleted: false,
            },
          },
        },
        query_id: '',
        metric_units: { metric1: 'units' } as MetricUnit,
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    // 200 should come first, even though it has higher counts.
    expect(result.value.datasets[0].label).toEqual('200')
  })

  it('handle no dimension query', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric: 1,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric: 2,
          },
        } as GroupByResult,
      ],
      meta: {
        start_ms: Math.trunc(START_FOR_DAILY_QUERY.getTime()),
        end_ms: Math.trunc(END_FOR_DAILY_QUERY.getTime()),
        granularity_ms: 86400000,
        metric_names: ['metric'] as any as ExploreAggregations[],
        query_id: '',
        metric_units: { metric: 'units' } as MetricUnit,
        display: {},
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

    expect(result.value.datasets[0].label).toEqual('metric')
  })

  it('handles multiple metrics', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 1,
            metric2: 2,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 3,
            metric2: 4,
          },
        } as GroupByResult,
      ],
      meta: {
        start_ms: Math.trunc(START_FOR_DAILY_QUERY.getTime()),
        end_ms: Math.trunc(END_FOR_DAILY_QUERY.getTime()),
        granularity_ms: 86400000,
        metric_names: [
          'metric1',
          'metric2',
        ] as any as ExploreAggregations[],
        query_id: '',
        metric_units: { metric1: 'units', metric2: 'units' } as MetricUnit,
        display: {},
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value.datasets).toEqual(
      [
        {
          rawDimension: 'metric1',
          rawMetric: 'metric1',
          label: 'metric1',
          borderColor: '#a86cd5',
          backgroundColor: '#a86cd5',
          data: [
            {
              x: START_FOR_DAILY_QUERY.getTime(),
              y: 1,
            },
            {
              x: END_FOR_DAILY_QUERY.getTime(),
              y: 3,
            },
          ],
          total: 4,
          lineTension: 0,
          borderWidth: BORDER_WIDTH,
          pointBorderWidth: 1.2,
          borderJoinStyle: 'round',
          fill: false,
          isSegmentEmpty: false,
        },
        {
          rawDimension: 'metric2',
          rawMetric: 'metric2',
          label: 'metric2',
          borderColor: '#6a86d2',
          backgroundColor: '#6a86d2',
          data: [
            {
              x: START_FOR_DAILY_QUERY.getTime(),
              y: 2,
            },
            {
              x: END_FOR_DAILY_QUERY.getTime(),
              y: 4,
            },
          ],
          total: 6,
          lineTension: 0,
          borderWidth: BORDER_WIDTH,
          pointBorderWidth: 1.2,
          borderJoinStyle: 'round',
          fill: false,
          isSegmentEmpty: false,
        },
      ],
    )

    expect(result.value.datasets[0].label).toEqual('metric1')
  })

  it('handles empty', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            consumer: 'id',
            request_count: 1,
          },
        } as GroupByResult,
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            consumer: 'empty',
            request_count: 2,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            consumer: 'id',
            request_count: 3,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            consumer: 'empty',
            request_count: 4,
          },
        } as GroupByResult,
      ],
      meta: {
        start_ms: Math.trunc(START_FOR_DAILY_QUERY.getTime()),
        end_ms: Math.trunc(END_FOR_DAILY_QUERY.getTime()),
        granularity_ms: 86400000,
        metric_names: [
          'request_count',
        ] as any as ExploreAggregations[],
        query_id: '',
        metric_units: { request_count: 'units' } as MetricUnit,
        display: {
          consumer: {
            empty: { name: 'emptyConsumer' },
            id: { name: 'ID' },
          },
        },
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value.datasets).toEqual(
      [
        {
          rawDimension: 'ID',
          rawMetric: 'request_count',
          label: 'ID',
          borderColor: '#6a86d2',
          backgroundColor: '#6a86d2',
          data: [
            {
              x: START_FOR_DAILY_QUERY.getTime(),
              y: 1,
            },
            {
              x: END_FOR_DAILY_QUERY.getTime(),
              y: 3,
            },
          ],
          total: 4,
          lineTension: 0,
          borderWidth: BORDER_WIDTH,
          pointBorderWidth: 1.2,
          borderJoinStyle: 'round',
          fill: false,
          isSegmentEmpty: false,
        },
        {
          rawDimension: 'emptyConsumer',
          rawMetric: 'request_count',
          label: 'emptyConsumer',
          borderColor: '#afb7c5',
          backgroundColor: '#afb7c5',
          data: [
            {
              x: START_FOR_DAILY_QUERY.getTime(),
              y: 2,
            },
            {
              x: END_FOR_DAILY_QUERY.getTime(),
              y: 4,
            },
          ],
          total: 6,
          lineTension: 0,
          borderWidth: BORDER_WIDTH,
          pointBorderWidth: 1.2,
          borderJoinStyle: 'round',
          fill: false,
          isSegmentEmpty: true,
        },
      ],
    )
  })

  it('borderWidth 0 when fill === true', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 1,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 3,
          },
        } as GroupByResult,
      ],
      meta: {
        start_ms: Math.trunc(START_FOR_DAILY_QUERY.getTime()),
        end_ms: Math.trunc(END_FOR_DAILY_QUERY.getTime()),
        granularity_ms: 86400000,
        metric_names: [
          'metric1',
        ] as any as ExploreAggregations[],
        query_id: '',
        metric_units: { metric1: 'units', metric2: 'units' } as MetricUnit,
        display: {},
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: true },
      exploreResult,
    )

    expect(result.value.datasets[0].borderWidth).toEqual(NO_BORDER)
  })

  it('borderWidth set when fill === false', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 1,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            metric1: 3,
          },
        } as GroupByResult,
      ],
      meta: {
        start_ms: Math.trunc(START_FOR_DAILY_QUERY.getTime()),
        end_ms: Math.trunc(END_FOR_DAILY_QUERY.getTime()),
        granularity_ms: 86400000,
        metric_names: [
          'metric1',
        ] as any as ExploreAggregations[],
        query_id: '',
        metric_units: { metric1: 'units' } as MetricUnit,
        display: {},
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value.datasets[0].borderWidth).toEqual(BORDER_WIDTH)
  })

  it('generates correct number of datapoints for time range and granularity', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: addHours(START_FOR_DAILY_QUERY, 1).toISOString(),
          event: {
            metric: 1,
            dimension: 'id',
          },
        } as GroupByResult,
        {
          timestamp: addHours(START_FOR_DAILY_QUERY, 3).toISOString(),
          event: {
            metric: 2,
            dimension: 'id',
          },
        } as GroupByResult,
      ],
      meta: {
        start_ms: START_FOR_DAILY_QUERY.getTime(),
        end_ms: addHours(START_FOR_DAILY_QUERY, 6).getTime(),
        granularity_ms: 3600000,
        display: { dimension: { id: { name: 'label' } } } as DisplayBlob,
        metric_names: ['metric'] as any as ExploreAggregations[],
        query_id: '',
        metric_units: { metric: 'units' } as MetricUnit,
      },
    }))
    const result = useExploreResultToTimeDataset(
      { fill: false },
      exploreResult,
    )

    expect(result.value.datasets[0].data.length).toEqual(6)

    expect(result.value.datasets[0].data).toEqual(
      [
        {
          x: START_FOR_DAILY_QUERY.getTime(),
          y: 0,
        },
        {
          x: addHours(START_FOR_DAILY_QUERY, 1).getTime(),
          y: 1,
        },
        {
          x: addHours(START_FOR_DAILY_QUERY, 2).getTime(),
          y: 0,
        },
        {
          x: addHours(START_FOR_DAILY_QUERY, 3).getTime(),
          y: 2,
        },
        {
          x: addHours(START_FOR_DAILY_QUERY, 4).getTime(),
          y: 0,
        },
        {
          x: addHours(START_FOR_DAILY_QUERY, 5).getTime(),
          y: 0,
        },
      ],
    )
  })

  it('Correct status code colors', () => {
    const exploreResult: ComputedRef<ExploreResultV4> = computed(() => ({
      data: [
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: 100,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: 200,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: 300,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: 400,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: START_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: 500,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: 100,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: 200,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: 300,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: 400,
            metric1: 2,
          },
        } as GroupByResult,
        {
          timestamp: END_FOR_DAILY_QUERY.toISOString(),
          event: {
            status_code: 500,
            metric1: 2,
          },
        } as GroupByResult,
      ],
      meta: {
        start_ms: Math.trunc(START_FOR_DAILY_QUERY.getTime()),
        end_ms: Math.trunc(END_FOR_DAILY_QUERY.getTime()),
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
    const result = useExploreResultToTimeDataset(
      { fill: false, colorPalette: defaultStatusCodeColors },
      exploreResult,
    )

    expect(result.value.datasets[0].backgroundColor).toEqual('#80bfff')
    expect(result.value.datasets[1].backgroundColor).toEqual('#9edca6')
    expect(result.value.datasets[2].backgroundColor).toEqual('#ffe9b8')
    expect(result.value.datasets[3].backgroundColor).toEqual('#ffd5b1')
    expect(result.value.datasets[4].backgroundColor).toEqual('#ffb6b6')
  })
})
