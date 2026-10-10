// Vitest unit test spec file

import { beforeAll, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import VChart from 'vue-echarts'
import ECharts from './ECharts.vue'
import { KUI_COLOR_TEXT } from '@kong/design-tokens'

// jsdom does not implement ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(global as any).ResizeObserver = ResizeObserver

describe('<ECharts />', () => {
  beforeAll(() => {
    // jsdom does not implement the canvas 2d context; stub it so zrender can initialize
    const contextStub = new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'measureText') {
          return () => ({ width: 0 })
        }

        return () => undefined
      },
      set: () => true,
    })

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(contextStub as unknown as CanvasRenderingContext2D)
  })

  it('renders', () => {
    const wrapper = mount(ECharts)

    expect(wrapper.isVisible()).toBe(true)
  })

  it('applies the chart class used for the CSS-driven height', () => {
    const wrapper = mount(ECharts)

    expect(wrapper.find('.chart').classes()).toContain('chart')
  })

  it('forwards attrs to the underlying chart', () => {
    const wrapper = mount(ECharts, {
      attrs: { 'data-testid': 'my-chart' },
    })

    expect(wrapper.find('[data-testid="my-chart"]').exists()).toBe(true)
  })

  it('passes a theme built from resolved design-token colors to the underlying chart', () => {
    const wrapper = mount(ECharts, {
      global: { stubs: { VChart: true } },
    })

    const theme = wrapper.getComponent(VChart).props('theme') as { textStyle: { color: string } }

    expect(theme.textStyle.color).toBe(KUI_COLOR_TEXT)
  })

  const tooltipOption = (props: Record<string, unknown>) => {
    const wrapper = mount(ECharts, { props, global: { stubs: { VChart: true } } })

    return wrapper.getComponent(VChart).props('option') as { tooltip: { confine?: boolean, formatter: (params: unknown) => HTMLElement } }
  }

  const renderedText = (element: HTMLElement, selector: string) => [...element.querySelectorAll(selector)].map((el) => el.textContent?.trim())

  it('always renders the shared tooltip, keeping the rest of the tooltip option', () => {
    const option = tooltipOption({ option: { tooltip: { confine: true } } })

    expect(option.tooltip.confine).toBe(true)
    expect(typeof option.tooltip.formatter).toBe('function')
  })

  it('uses the series name, color and value by default', () => {
    const element = tooltipOption({}).tooltip.formatter({ name: 'Jun 16', seriesName: 'Requests', color: '#ff0000', value: 12 })

    expect(renderedText(element, '.context')).toEqual(['Jun 16'])
    expect(renderedText(element, '.display-label')).toEqual(['Requests'])
    expect(renderedText(element, '.display-value')).toEqual(['12'])
  })

  it('uses the chart type content', () => {
    const element = tooltipOption({
      tooltipContent: () => ({ title: 'Last 7 days', context: 'Jun 16', metric: 'Error rate', rows: [{ color: '#ff0000', label: 'gpt-4o', value: '12.5%' }] }),
    }).tooltip.formatter({})

    expect(renderedText(element, '.title')).toEqual(['Last 7 days'])
    expect(renderedText(element, '.context')).toEqual(['Jun 16'])
    expect(renderedText(element, '.metric')).toEqual(['Error rate'])
    expect(renderedText(element, '.display-label')).toEqual(['gpt-4o'])
  })

  it('replaces option.tooltip.formatter with the shared tooltip', () => {
    const formatter = () => 'custom'

    expect(tooltipOption({ option: { tooltip: { formatter } } }).tooltip.formatter).not.toBe(formatter)
  })
})
