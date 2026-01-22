import SplitToolbar from './SplitToolbar.vue'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

describe('SplitToolbar', () => {
  it('should render the toolbar', () => {
    const wrapper = mount(SplitToolbar)
    expect(wrapper.find('[data-testid="kong-ui-public-split-pane-toolbar"]').exists()).toBe(true)
  })

  it('should render left slot when provided', () => {
    const wrapper = mount(SplitToolbar, {
      slots: {
        left: '<div class="test-left">Left Content</div>',
      },
    })
    expect(wrapper.find('[data-testid="split-toolbar-left"]').exists()).toBe(true)
    expect(wrapper.find('.test-left').text()).toBe('Left Content')
  })

  it('should render center slot when provided', () => {
    const wrapper = mount(SplitToolbar, {
      slots: {
        center: '<div class="test-center">Center Content</div>',
      },
    })
    expect(wrapper.find('[data-testid="split-toolbar-center"]').exists()).toBe(true)
    expect(wrapper.find('.test-center').text()).toBe('Center Content')
  })

  it('should render right slot when provided', () => {
    const wrapper = mount(SplitToolbar, {
      slots: {
        right: '<div class="test-right">Right Content</div>',
      },
    })
    expect(wrapper.find('[data-testid="split-toolbar-right"]').exists()).toBe(true)
    expect(wrapper.find('.test-right').text()).toBe('Right Content')
  })

  it('should not render slot content when not provided', () => {
    const wrapper = mount(SplitToolbar)
    // left slot will render an empty div so centre is in it place (centred)
    expect(wrapper.find('[data-testid="split-toolbar-left"]').text()).toBe('')
    expect(wrapper.find('[data-testid="split-toolbar-center"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="split-toolbar-right"]').exists()).toBe(false)
  })
})
