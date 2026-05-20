import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import BaseAnalyticsEcharts from './BaseAnalyticsEcharts.vue'

const { themeKey } = vi.hoisted(() => ({
  themeKey: Symbol('THEME_KEY'),
}))

let vChartMountCount = 0

vi.mock('vue-echarts', async () => {
  const { defineComponent, h, inject, toValue } = await import('vue')

  return {
    THEME_KEY: themeKey,
    default: defineComponent({
      name: 'VChart',
      props: {
        autoresize: {
          type: [Boolean, Object],
          default: false,
        },
        initOptions: {
          type: Object,
          default: undefined,
        },
        manualUpdate: {
          type: Boolean,
          default: false,
        },
        option: {
          type: Object,
          required: true,
        },
      },
      setup(_props, { expose }) {
        const instanceId = ++vChartMountCount
        const theme = inject(themeKey, 'missing')

        expose({
          setOption: vi.fn(),
        })

        return () => h('div', {
          'data-instance-id': String(instanceId),
          'data-theme': String(toValue(theme)),
        })
      },
    }),
  }
})

const mountBaseAnalyticsEcharts = (props: {
  renderMode?: 'svg' | 'canvas'
} = {}, global: Parameters<typeof mount>[1]['global'] = {}) => {
  return mount(BaseAnalyticsEcharts, {
    props: {
      option: {},
      ...props,
    },
    global,
  })
}

const getVChart = (wrapper: ReturnType<typeof mountBaseAnalyticsEcharts>) => {
  return wrapper.findComponent({ name: 'VChart' })
}

describe('BaseAnalyticsEcharts', () => {
  it('provides the light ECharts theme by default', () => {
    const wrapper = mountBaseAnalyticsEcharts()

    expect(getVChart(wrapper).attributes('data-theme')).toBe('light')

    wrapper.unmount()
  })

  it('passes a host-provided ECharts theme through to VChart', () => {
    const wrapper = mountBaseAnalyticsEcharts({}, {
      provide: {
        [themeKey]: 'konnect',
      },
    })

    expect(getVChart(wrapper).attributes('data-theme')).toBe('konnect')

    wrapper.unmount()
  })

  it('remounts VChart when the provided ECharts theme changes', async () => {
    const theme = ref('light')
    const wrapper = mountBaseAnalyticsEcharts({}, {
      provide: {
        [themeKey]: theme,
      },
    })
    const firstInstanceId = getVChart(wrapper).attributes('data-instance-id')

    theme.value = 'konnect'
    await nextTick()

    expect(getVChart(wrapper).attributes('data-theme')).toBe('konnect')
    expect(getVChart(wrapper).attributes('data-instance-id')).not.toBe(firstInstanceId)

    wrapper.unmount()
  })

  it('passes svg as the default ECharts renderer', () => {
    const wrapper = mountBaseAnalyticsEcharts()

    expect(getVChart(wrapper).props('initOptions')).toEqual({ renderer: 'svg' })

    wrapper.unmount()
  })

  it('passes canvas as the ECharts renderer when requested', () => {
    const wrapper = mountBaseAnalyticsEcharts({ renderMode: 'canvas' })

    expect(getVChart(wrapper).props('initOptions')).toEqual({ renderer: 'canvas' })

    wrapper.unmount()
  })

  it('updates ECharts init options when render mode changes', async () => {
    const wrapper = mountBaseAnalyticsEcharts()

    await wrapper.setProps({ renderMode: 'canvas' })

    expect(getVChart(wrapper).props('initOptions')).toEqual({ renderer: 'canvas' })

    wrapper.unmount()
  })
})
