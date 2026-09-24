import type { ExploreAggregations, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { exploreAggregations } from '@kong-ui-public/analytics-utilities'

import { defineComponent, h, type PropType } from 'vue'
import type { AnalyticsChartOptions, Dataset, KChartData, Threshold } from '../types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AnalyticsChart from './AnalyticsChart.vue'

const TimeSeriesChartStub = defineComponent({
  name: 'TimeSeriesChart',
  props: {
    chartData: {
      type: Object as PropType<KChartData>,
      required: true,
    },
    metricUnit: String,
    metricAxesTitle: String,
    tooltipMetricDisplay: String,
    threshold: Object,
    rightYAxis: Object,
  },
  setup(props) {
    return () => h('div', {
      'data-testid': 'time-series-chart-stub',
      'data-metric-unit': props.metricUnit,
    })
  },
})

const groupedMetricsResult: ExploreResultV4 = {
  data: [
    {
      timestamp: '2026-09-09T15:00:00Z',
      event: { ai_gateway: 'empty', response_latency_average: 38.36, response_latency_p99: 341 },
    },
    {
      timestamp: '2026-09-09T15:00:00Z',
      event: { ai_gateway: 'gateway-id', response_latency_average: 12.34, response_latency_p99: 25 },
    },
  ],
  meta: {
    start: '2026-09-09T15:00:00Z',
    end: '2026-09-09T16:00:00Z',
    granularity_ms: 3600000,
    metric_names: ['response_latency_average', 'response_latency_p99'],
    metric_units: { response_latency_average: 'ms', response_latency_p99: 'ms' },
    query_id: 'test-query',
    display: {
      ai_gateway: {
        empty: { name: 'empty' },
        'gateway-id': { name: 'DP Mock AIGW' },
      },
    },
  },
}

const mountChart = ({ chartData = groupedMetricsResult, type = 'timeseries_line' }: {
  chartData?: ExploreResultV4
  type?: AnalyticsChartOptions['type']
} = {}) => mount(AnalyticsChart, {
  props: {
    chartData,
    chartOptions: {
      type,
      stacked: false,
    },
  },
  global: {
    stubs: {
      TimeSeriesChart: TimeSeriesChartStub,
      StackedBarChart: true,
      KTooltip: true,
      KEmptyState: true,
    },
  },
})

describe('<AnalyticsChart /> activeMetric', () => {
  it('renders the host-selected metric without an internal control', async () => {
    const wrapper = mountChart()

    expect(wrapper.find('[data-testid="metric-selector"]').exists()).toBe(false)
    const chart = wrapper.findComponent(TimeSeriesChartStub)
    expect(chart.props('chartData').datasets).toHaveLength(2)
    expect(chart.props('chartData').datasets.every((dataset: Dataset) => dataset.rawMetric === 'response_latency_average')).toBe(true)

    await wrapper.setProps({ activeMetric: 'response_latency_p99' })

    expect(chart.props('chartData').datasets).toHaveLength(2)
    expect(chart.props('chartData').datasets.every((dataset: Dataset) => dataset.rawMetric === 'response_latency_p99')).toBe(true)
    expect(chart.props('metricUnit')).toBe('ms')
    expect(chart.props('metricAxesTitle')).toBe('Response latency (p99) in ms')
    expect(chart.props('chartData').datasets).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'empty', data: [{ x: Date.parse('2026-09-09T15:00:00Z'), y: 341 }] }),
      expect.objectContaining({ label: 'DP Mock AIGW', data: [{ x: Date.parse('2026-09-09T15:00:00Z'), y: 25 }] }),
    ]))
    expect(groupedMetricsResult.meta.metric_names).toEqual(['response_latency_average', 'response_latency_p99'])
  })

  it('ignores activeMetric for a single metric timeseries', async () => {
    const singleMetricResult: ExploreResultV4 = {
      ...groupedMetricsResult,
      meta: {
        ...groupedMetricsResult.meta,
        metric_names: ['response_latency_average'],
      },
    }

    const wrapper = mountChart({ chartData: singleMetricResult })
    await wrapper.setProps({ activeMetric: 'response_latency_p99' })
    expect(wrapper.findComponent(TimeSeriesChartStub).props('chartData').datasets.every((dataset: Dataset) => dataset.rawMetric === 'response_latency_average')).toBe(true)

    expect(wrapper.find('[data-testid="metric-selector"]').exists()).toBe(false)
  })

  it('retains a valid selection on refresh and falls back when that metric disappears', async () => {
    const wrapper = mountChart()
    await wrapper.setProps({ activeMetric: 'response_latency_p99' })
    await wrapper.setProps({ chartData: { ...groupedMetricsResult, meta: { ...groupedMetricsResult.meta } } })
    const chart = wrapper.findComponent(TimeSeriesChartStub)
    expect(chart.props('chartData').datasets.every((dataset: Dataset) => dataset.rawMetric === 'response_latency_p99')).toBe(true)

    await wrapper.setProps({ chartData: {
      ...groupedMetricsResult,
      meta: { ...groupedMetricsResult.meta, metric_names: ['response_latency_average'] },
    } })
    expect(wrapper.find('[data-testid="metric-selector"]').exists()).toBe(false)
    expect(chart.props('chartData').datasets.every((dataset: Dataset) => dataset.rawMetric === 'response_latency_average')).toBe(true)
  })

  it('falls back when activeMetric is absent from the result', async () => {
    const wrapper = mountChart()
    await wrapper.setProps({ activeMetric: 'request_count' })
    expect(wrapper.findComponent(TimeSeriesChartStub).props('chartData').datasets.every((dataset: Dataset) => dataset.rawMetric === 'response_latency_average')).toBe(true)
  })

  it('preserves dimension colors when switching metrics', async () => {
    const wrapper = mountChart()
    const chart = wrapper.findComponent(TimeSeriesChartStub)
    const colors = () => Object.fromEntries(chart.props('chartData').datasets.map((dataset: Dataset) => [dataset.label, dataset.borderColor]))
    const initialColors = colors()
    await wrapper.setProps({ activeMetric: 'response_latency_p99' })
    expect(colors()).toEqual(initialColors)
  })

  it('keeps all metrics visible without grouping and does not affect non-timeseries charts', async () => {
    const wrapper = mountChart({ chartData: { ...groupedMetricsResult, meta: { ...groupedMetricsResult.meta, display: {} } } })
    expect(wrapper.find('[data-testid="metric-selector"]').exists()).toBe(false)
    await wrapper.setProps({ activeMetric: 'response_latency_p99' })
    expect(wrapper.findComponent(TimeSeriesChartStub).props('chartData').datasets).toHaveLength(2)
    const bar = mountChart({ type: 'vertical_bar' })
    const originalData = bar.findComponent({ name: 'StackedBarChart' }).props('chartData')
    await bar.setProps({ activeMetric: 'response_latency_p99' })
    expect(bar.findComponent({ name: 'StackedBarChart' }).props('chartData')).toEqual(originalData)
  })

  it('supports metric selection on a grouped timeseries bar chart', async () => {
    const wrapper = mountChart({ type: 'timeseries_bar' })
    await wrapper.setProps({ activeMetric: 'response_latency_p99' })
    expect(wrapper.findComponent(TimeSeriesChartStub).props('chartData').datasets).toHaveLength(2)
  })

  it('switches metric thresholds without mutating the supplied threshold map', async () => {
    // Every key comes from the canonical aggregation list, so this is a complete record.
    const thresholds = Object.fromEntries(exploreAggregations.map(metric => [metric, [{
      type: 'error', value: metric === 'response_latency_p99' ? 300 : 30,
    }]])) as Record<ExploreAggregations, Threshold[]>
    const wrapper = mountChart()
    await wrapper.setProps({ chartOptions: { type: 'timeseries_line', stacked: false, threshold: thresholds } })
    const chart = wrapper.findComponent(TimeSeriesChartStub)
    expect(chart.props('threshold')).toMatchObject({
      response_latency_average: [{ type: 'error', value: 30 }], response_latency_p99: [],
    })
    await wrapper.setProps({ activeMetric: 'response_latency_p99' })
    expect(chart.props('threshold')).toMatchObject({
      response_latency_average: [], response_latency_p99: [{ type: 'error', value: 300 }],
    })
    expect(thresholds.response_latency_average).toEqual([{ type: 'error', value: 30 }])
    expect(thresholds.response_latency_p99).toEqual([{ type: 'error', value: 300 }])
  })

})

describe('<AnalyticsChart /> dual y axis', () => {
  const requestsVsSpendResult: ExploreResultV4 = {
    data: [
      { timestamp: '2026-09-09T15:00:00Z', event: { ai_request_count: 620, cost: 4.5 } },
    ],
    meta: {
      start: '2026-09-09T15:00:00Z',
      end: '2026-09-09T16:00:00Z',
      granularity_ms: 3600000,
      metric_names: ['ai_request_count', 'cost'],
      metric_units: { ai_request_count: 'count', cost: 'usd' },
      query_id: 'test-query',
      display: {},
    },
  }

  const mountDualAxis = (chartOptions: Partial<AnalyticsChartOptions> = {}) => mount(AnalyticsChart, {
    props: {
      chartData: requestsVsSpendResult,
      chartOptions: { type: 'timeseries_line', stacked: false, metricAxisMap: { cost: 'right' }, ...chartOptions },
    },
    global: {
      stubs: { TimeSeriesChart: TimeSeriesChartStub, StackedBarChart: true, KTooltip: true, KEmptyState: true },
    },
  })

  it('titles each axis with its translated metric title', () => {
    const chart = mountDualAxis().findComponent(TimeSeriesChartStub)

    expect(chart.props('metricAxesTitle')).toBe('Request count')
    expect(chart.props('rightYAxis')).toMatchObject({ title: 'Costs' })
  })

  it('prefers configured axis titles', () => {
    const chart = mountDualAxis({ yAxes: { left: { title: 'Requests' }, right: { title: 'Spend' } } }).findComponent(TimeSeriesChartStub)

    expect(chart.props('metricAxesTitle')).toBe('Requests')
    expect(chart.props('rightYAxis')).toMatchObject({ title: 'Spend' })
  })

  it('does not add a right axis for bar charts', () => {
    const chart = mountDualAxis({ type: 'timeseries_bar' }).findComponent(TimeSeriesChartStub)

    expect(chart.props('rightYAxis')).toBeUndefined()
  })
})
