import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import BaseAnalyticsEcharts from './BaseAnalyticsEcharts.vue'

vi.mock('vue-echarts', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    THEME_KEY: Symbol('THEME_KEY'),
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
        expose({
          setOption: vi.fn(),
        })

        return () => h('div')
      },
    }),
  }
})

const mountBaseAnalyticsEcharts = (props: {
  renderMode?: 'svg' | 'canvas'
} = {}) => {
  return mount(BaseAnalyticsEcharts, {
    props: {
      option: {},
      ...props,
    },
  })
}

const getVChart = (wrapper: ReturnType<typeof mountBaseAnalyticsEcharts>) => {
  return wrapper.findComponent({ name: 'VChart' })
}

describe('BaseAnalyticsEcharts', () => {
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
