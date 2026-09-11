// Vitest unit test spec file

import { beforeAll, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ECharts from './ECharts.vue'

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
})
