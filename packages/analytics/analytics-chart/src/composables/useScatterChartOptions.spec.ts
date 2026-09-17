import type { Ref } from 'vue'
import type { ExternalTooltipContext, TooltipState } from '../types'

import { describe, it, expect } from 'vitest'
import { defineComponent, h, reactive, ref } from 'vue'
import { mount } from '@vue/test-utils'

import useScatterChartOptions from './useScatterChartOptions'
import { formatTooltipTimestampByGranularity, scatterChartColors } from '../utils'

const TIMESTAMP = new Date('2024-06-16T10:30:00.000Z').valueOf()

const tooltipState = (): TooltipState => reactive({
  showTooltip: false,
  tooltipContext: 0,
  tooltipSeries: [],
  left: '',
  top: '',
  units: 'usd',
  translateUnit: (unit: string) => unit,
  offsetX: 0,
  offsetY: 0,
  width: 0,
  height: 0,
  chartType: 'scatter',
  chartID: 'scatter-options-spec',
  interactionMode: 'idle',
  metricDisplay: '',
}) as TooltipState

const setup = (xMetric: Ref<string | undefined>, state = tooltipState()) => {
  let result: ReturnType<typeof useScatterChartOptions>

  mount(defineComponent({
    setup() {
      result = useScatterChartOptions({
        tooltipState: state,
        legendID: 'legend',
        granularity: ref('hourly'),
        timeRangeMs: ref(86400000),
        metricUnit: ref('usd'),
        xMetric,
        xMetricUnit: ref('count'),
        themeColors: ref(scatterChartColors()),
      })

      return () => h('div')
    },
  }))

  return result!.options
}

const tooltipContext = (raw: Record<string, unknown>): ExternalTooltipContext => ({
  chart: { config: { options: {} } },
  tooltip: {
    opacity: 1,
    body: [{}],
    x: 0,
    y: 0,
    labelColors: [{ backgroundColor: '#000', borderColor: '#000' }],
    dataPoints: [{ raw, parsed: { x: raw.x, y: raw.y }, dataset: { label: 'Model A' } }],
  },
}) as unknown as ExternalTooltipContext

describe('useScatterChartOptions', () => {
  it('uses a time x axis without an x metric', () => {
    const options = setup(ref(undefined))

    expect(options.value.scales.x.type).toBe('time')
  })

  it('uses a linear x axis with an x metric', () => {
    const options = setup(ref('ai_request_count'))

    expect(options.value.scales.x.type).toBe('linear')
  })

  it('switches axis type when the x metric changes', () => {
    const xMetric = ref<string | undefined>(undefined)
    const options = setup(xMetric)

    xMetric.value = 'ai_request_count'

    expect(options.value.scales.x.type).toBe('linear')
  })

  it('titles the tooltip with the point timestamp when x is a metric', () => {
    const state = tooltipState()
    const options = setup(ref('ai_request_count'), state)

    options.value.plugins.tooltip.external(tooltipContext({ x: 10, y: 1.5, timestamp: TIMESTAMP }))

    expect(state.tooltipContext).toBe(formatTooltipTimestampByGranularity({ tickValue: new Date(TIMESTAMP), granularity: 'hourly' }))
  })

  it('titles the tooltip with the x value when x is time', () => {
    const state = tooltipState()
    const options = setup(ref(undefined), state)

    options.value.plugins.tooltip.external(tooltipContext({ x: TIMESTAMP, y: 1.5 }))

    expect(state.tooltipContext).toBe(formatTooltipTimestampByGranularity({ tickValue: new Date(TIMESTAMP), granularity: 'hourly' }))
  })
})
