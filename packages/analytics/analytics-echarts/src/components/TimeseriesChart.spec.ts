/* eslint-disable vue/one-component-per-file */
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { generateSingleMetricTimeSeriesData } from '@kong-ui-public/analytics-utilities'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import TimeseriesChart from './TimeseriesChart.vue'

const dispatchAction = vi.fn()

const BaseAnalyticsEchartsStub = defineComponent({
  name: 'BaseAnalyticsEcharts',
  props: {
    option: {
      type: Object,
      required: true,
    },
    renderMode: {
      type: String,
      default: 'svg',
    },
    theme: {
      type: String,
      default: 'light',
    },
  },
  emits: ['brush', 'zr:click', 'zr:mousedown', 'zr:mousemove', 'zr:mouseout', 'zr:mouseup'],
  setup(_props, { expose, slots }) {
    const element = ref<HTMLElement>()

    expose({
      getChart: () => ({
        $el: element.value,
        convertFromPixel: (_axis: { xAxisIndex: number }, offsetX: number) => offsetX,
        dispatchAction,
      }),
      getContainer: () => element.value,
    })

    return () => h('div', { ref: element }, slots.default?.())
  },
})

const PassthroughStub = defineComponent({
  name: 'PassthroughStub',
  setup(_props, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const EmptyStub = defineComponent({
  name: 'EmptyStub',
  setup() {
    return () => h('div')
  },
})

const createTimeseriesData = (): ExploreResultV4 => {
  return generateSingleMetricTimeSeriesData(
    { name: 'request_count', unit: 'count' },
    { status_code: ['200', '500'] },
  )
}

const mountTimeseriesChart = ({
  requestsLink,
  timeseriesZoom = false,
}: {
  requestsLink?: { href: string }
  timeseriesZoom?: boolean
} = {}) => {
  return mount(TimeseriesChart, {
    props: {
      data: createTimeseriesData(),
      type: 'timeseries_line',
      requestsLink,
      timeseriesZoom,
    },
    global: {
      stubs: {
        AnalyticsChartShell: PassthroughStub,
        BaseAnalyticsEcharts: BaseAnalyticsEchartsStub,
        ChartLegend: EmptyStub,
        ChartTooltip: EmptyStub,
      },
    },
  })
}

const getBaseChart = (wrapper: ReturnType<typeof mountTimeseriesChart>) => {
  return wrapper.findComponent({ name: 'BaseAnalyticsEcharts' })
}

describe('TimeseriesChart', () => {
  it('does not brush-select time ranges when no range action is available', async () => {
    vi.useFakeTimers()
    dispatchAction.mockClear()
    const wrapper = mountTimeseriesChart()

    getBaseChart(wrapper).vm.$emit('zr:mousedown', { offsetX: 10 })
    vi.advanceTimersByTime(151)
    await nextTick()

    expect(dispatchAction).not.toHaveBeenCalled()

    wrapper.unmount()
    vi.useRealTimers()
  })

  it('enables brush-select time ranges when a requests action is available', async () => {
    vi.useFakeTimers()
    dispatchAction.mockClear()
    const wrapper = mountTimeseriesChart({
      requestsLink: { href: '#requests' },
    })

    getBaseChart(wrapper).vm.$emit('zr:mousedown', { offsetX: 10 })
    vi.advanceTimersByTime(151)
    await nextTick()

    expect(dispatchAction).toHaveBeenCalledWith(expect.objectContaining({
      type: 'brush',
      areas: [expect.objectContaining({
        coordRange: [10, 10],
      })],
    }))

    wrapper.unmount()
    vi.useRealTimers()
  })
})
