/* eslint-disable vue/one-component-per-file */
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import type { ECBasicOption } from 'echarts/types/dist/shared'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import CrossSectionChart from './CrossSectionChart.vue'

type DataZoomOption = {
  startValue?: number
  endValue?: number
}

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
  },
  emits: ['datazoom'],
  setup(_props, { expose, slots }) {
    const element = ref<HTMLElement>()

    expose({
      getChart: () => ({ $el: element.value }),
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

const createExploreResult = (count: number, dimension = 'route'): ExploreResultV4 => {
  const dimensionEntries = Array.from({ length: count }, (_, index) => {
    const id = dimension === 'status_code'
      ? ['200', '300', '400', '500'][index % 4]
      : `route-${index}`

    return [id, { name: id }]
  })

  return {
    meta: {
      metric_names: ['request_count'],
      display: {
        [dimension]: Object.fromEntries(dimensionEntries),
      },
    },
    data: Array.from({ length: count }, (_, index) => ({
      timestamp: new Date(index).toISOString(),
      event: {
        [dimension]: dimension === 'status_code'
          ? ['200', '300', '400', '500'][index % 4]
          : `route-${index}`,
        request_count: count - index,
      },
    })),
  } as ExploreResultV4
}

const mountCrossSectionChart = ({
  data = createExploreResult(20),
  type = 'vertical_bar',
}: {
  data?: ExploreResultV4
  type?: 'horizontal_bar' | 'vertical_bar' | 'donut'
} = {}) => {
  return mount(CrossSectionChart, {
    props: {
      data,
      type,
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

const getBaseChart = (wrapper: ReturnType<typeof mountCrossSectionChart>) => {
  return wrapper.findComponent({ name: 'BaseAnalyticsEcharts' })
}

const getDataZoom = (wrapper: ReturnType<typeof mountCrossSectionChart>) => {
  const option = getBaseChart(wrapper).props('option') as ECBasicOption

  return option.dataZoom as DataZoomOption[] | undefined
}

const expectDataZoomWindow = (
  wrapper: ReturnType<typeof mountCrossSectionChart>,
  { startValue, endValue }: DataZoomOption,
) => {
  expect(getDataZoom(wrapper)).toEqual([
    expect.objectContaining({ startValue, endValue }),
    expect.objectContaining({ startValue, endValue }),
  ])
}

describe('CrossSectionChart', () => {
  it('does not expose colorPalette as a public prop', () => {
    const props = (CrossSectionChart as unknown as { props: Record<string, unknown> }).props

    expect(props).not.toHaveProperty('colorPalette')
  })

  it('uses design-token status code colors by default', () => {
    const wrapper = mountCrossSectionChart({
      data: createExploreResult(4, 'status_code'),
    })
    const option = getBaseChart(wrapper).props('option') as {
      series: Array<{ itemStyle: { color: string } }>
    }

    expect(option.series[0].itemStyle.color).toBe('#b5ffee')

    wrapper.unmount()
  })

  it('keeps data zoom events off the render path until another option dependency changes', async () => {
    const wrapper = mountCrossSectionChart()
    const baseChart = getBaseChart(wrapper)

    expect(getDataZoom(wrapper)).toBeUndefined()

    await baseChart.vm.$emit('datazoom', { startValue: 2, endValue: 6 })
    await baseChart.vm.$emit('datazoom', { startValue: 5, endValue: 9 })
    await nextTick()

    expect(getDataZoom(wrapper)).toBeUndefined()

    await wrapper.setProps({ showAnnotations: false })
    await nextTick()

    expectDataZoomWindow(wrapper, { startValue: 5, endValue: 9 })

    wrapper.unmount()
  })

  it('preserves resized data zoom windows from slider handles on rebuild', async () => {
    const wrapper = mountCrossSectionChart()
    const baseChart = getBaseChart(wrapper)

    await baseChart.vm.$emit('datazoom', { startValue: 0, endValue: 6 })
    await nextTick()

    expect(getDataZoom(wrapper)).toBeUndefined()

    await wrapper.setProps({ showAnnotations: false })
    await nextTick()

    expectDataZoomWindow(wrapper, { startValue: 0, endValue: 6 })

    await baseChart.vm.$emit('datazoom', { startValue: 2, endValue: 4 })
    await nextTick()

    expectDataZoomWindow(wrapper, { startValue: 0, endValue: 6 })

    await wrapper.setProps({ showAnnotations: true })
    await nextTick()

    expectDataZoomWindow(wrapper, { startValue: 2, endValue: 4 })

    await baseChart.vm.$emit('datazoom', { startValue: 2, endValue: 9 })
    await nextTick()

    expectDataZoomWindow(wrapper, { startValue: 2, endValue: 4 })

    await wrapper.setProps({ showAnnotations: false })
    await nextTick()

    expectDataZoomWindow(wrapper, { startValue: 2, endValue: 9 })

    wrapper.unmount()
  })

  it('preserves percentage-based slider handle resize state on rebuild', async () => {
    const wrapper = mountCrossSectionChart()
    const baseChart = getBaseChart(wrapper)

    await baseChart.vm.$emit('datazoom', { start: 10, end: 20 })
    await nextTick()

    expect(getDataZoom(wrapper)).toBeUndefined()

    await wrapper.setProps({ showAnnotations: false })
    await nextTick()

    expectDataZoomWindow(wrapper, { startValue: 2, endValue: 4 })

    wrapper.unmount()
  })

  it('does not intercept wheel movement before ECharts handles it natively', async () => {
    const wrapper = mountCrossSectionChart()
    const baseChart = getBaseChart(wrapper)

    await baseChart.vm.$emit('datazoom', { start: 10, end: 20 })
    await nextTick()

    expect(getDataZoom(wrapper)).toBeUndefined()

    const event = new WheelEvent('wheel', {
      deltaX: 48,
      deltaY: 0,
      cancelable: true,
    })

    baseChart.element.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    await nextTick()
    expect(getDataZoom(wrapper)).toBeUndefined()

    wrapper.unmount()
  })

  it('resets the latest data zoom window after data or chart type changes', async () => {
    const wrapper = mountCrossSectionChart()
    const baseChart = getBaseChart(wrapper)

    await baseChart.vm.$emit('datazoom', { startValue: 3, endValue: 7 })
    await wrapper.setProps({ data: createExploreResult(21) })
    await nextTick()

    expect(getDataZoom(wrapper)).toBeUndefined()

    await baseChart.vm.$emit('datazoom', { startValue: 3, endValue: 7 })
    await wrapper.setProps({ type: 'donut' })
    await nextTick()

    expect(getDataZoom(wrapper)).toBeUndefined()

    await wrapper.setProps({ type: 'vertical_bar' })
    await nextTick()

    expect(getDataZoom(wrapper)).toBeUndefined()

    wrapper.unmount()
  })
})
