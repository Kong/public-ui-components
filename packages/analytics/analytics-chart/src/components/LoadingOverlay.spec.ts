import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'

import LoadingOverlay from './LoadingOverlay.vue'

const mountOverlay = (props: { loading: boolean, delay?: number }) => mount(LoadingOverlay, {
  props,
  slots: {
    default: () => h('div', { 'data-testid': 'chart' }, 'chart'),
  },
})

describe('<LoadingOverlay />', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the slot without dimming when not loading', () => {
    const wrapper = mountOverlay({ loading: false })

    expect(wrapper.find('[data-testid="chart"]').exists()).toBe(true)
    expect(wrapper.classes()).not.toContain('active')
    expect(wrapper.find('[data-testid="loading-overlay-spinner"]').exists()).toBe(false)
    expect(wrapper.find('.loading-overlay-content').attributes('inert')).toBeUndefined()
  })

  it('waits for the delay before dimming and showing the spinner', async () => {
    const wrapper = mountOverlay({ loading: true, delay: 200 })

    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.classes()).not.toContain('active')

    await vi.advanceTimersByTimeAsync(199)
    expect(wrapper.find('[data-testid="loading-overlay-spinner"]').exists()).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.classes()).toContain('active')
    expect(wrapper.find('[data-testid="loading-overlay-spinner"]').exists()).toBe(true)
    expect(wrapper.find('.loading-overlay-content').attributes('inert')).toBeDefined()
  })

  it('clears immediately when loading finishes', async () => {
    const wrapper = mountOverlay({ loading: true, delay: 0 })
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.classes()).toContain('active')

    await wrapper.setProps({ loading: false })

    expect(wrapper.classes()).not.toContain('active')
    expect(wrapper.find('[data-testid="loading-overlay-spinner"]').exists()).toBe(false)
    expect(wrapper.find('.loading-overlay-content').attributes('inert')).toBeUndefined()
  })

  it('never dims when loading finishes within the delay', async () => {
    const wrapper = mountOverlay({ loading: true, delay: 200 })

    await vi.advanceTimersByTimeAsync(100)
    await wrapper.setProps({ loading: false })
    await vi.advanceTimersByTimeAsync(200)

    expect(wrapper.classes()).not.toContain('active')
  })
})
