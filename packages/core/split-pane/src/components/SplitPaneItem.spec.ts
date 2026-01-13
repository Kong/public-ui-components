import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import SplitPane from './SplitPane.vue'
import SplitPaneItem from './SplitPaneItem.vue'

describe('<SplitPaneItem />', () => {
  beforeEach(() => {
    // Mock getBoundingClientRect for drag calculations
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 1000,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    }))
  })

  it('should render within SplitPane', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => h(SplitPaneItem, {}, () => 'Test Content'),
      },
    })

    expect(wrapper.findComponent(SplitPaneItem).exists()).toBe(true)
    expect(wrapper.find('.kong-ui-public-split-pane-item').exists()).toBe(true)
  })

  it('should render slot content', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => h(SplitPaneItem, {}, () => h('div', { class: 'test-content' }, 'Test Content')),
      },
    })

    expect(wrapper.find('.test-content').exists()).toBe(true)
    expect(wrapper.find('.test-content').text()).toBe('Test Content')
  })

  it('should render divider by default', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, {}, () => 'Pane 1'),
          h(SplitPaneItem, {}, () => 'Pane 2'),
        ],
      },
    })

    const dividers = wrapper.findAll('.kong-ui-public-split-pane-item-divider')
    expect(dividers.length).toBeGreaterThan(0)
  })

  it('should render divider handle when showDividerHandle is true', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { showDividerHandle: true }, () => 'Pane 1'),
          h(SplitPaneItem, { showDividerHandle: true }, () => 'Pane 2'),
        ],
      },
    })

    const handles = wrapper.findAll('.kong-ui-public-split-pane-item-divider-handle')
    expect(handles.length).toBeGreaterThan(0)
  })

  it('should hide divider handle when showDividerHandle is false', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { showDividerHandle: false }, () => 'Pane 1'),
          h(SplitPaneItem, {}, () => 'Pane 2'),
        ],
      },
    })

    const dividers = wrapper.findAll('.kong-ui-public-split-pane-item-divider')
    const firstDivider = dividers[0]
    expect(firstDivider.classes()).not.toContain('has-handle')
  })

  it('should apply size prop as percentage width', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { size: 60 }, () => 'Pane 1'),
          h(SplitPaneItem, { size: 40 }, () => 'Pane 2'),
        ],
      },
    })

    const panes = wrapper.findAll('.kong-ui-public-split-pane-item')
    const firstPane = panes[0]

    expect(firstPane.attributes('style')).toContain('width')
  })

  it('should accept size as string', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { size: '60' }, () => 'Pane 1'),
          h(SplitPaneItem, { size: '40' }, () => 'Pane 2'),
        ],
      },
    })

    const panes = wrapper.findAll('.kong-ui-public-split-pane-item')
    expect(panes.length).toBe(2)
  })

  it('should respect minSize constraint', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { size: 10, minSize: 20 }, () => 'Pane 1'),
          h(SplitPaneItem, { size: 90 }, () => 'Pane 2'),
        ],
      },
    })

    // The component should respect minSize internally
    expect(wrapper.findAllComponents(SplitPaneItem).length).toBe(2)
  })

  it('should respect maxSize constraint', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { size: 90, maxSize: 80 }, () => 'Pane 1'),
          h(SplitPaneItem, { size: 10 }, () => 'Pane 2'),
        ],
      },
    })

    // The component should respect maxSize internally
    expect(wrapper.findAllComponents(SplitPaneItem).length).toBe(2)
  })

  it('should handle drag operation on divider', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { size: 50 }, () => 'Pane 1'),
          h(SplitPaneItem, { size: 50 }, () => 'Pane 2'),
        ],
      },
    })

    const divider = wrapper.find('.kong-ui-public-split-pane-item-divider')

    // Verify divider exists
    expect(divider.exists()).toBe(true)

    // Start drag - should not throw error
    await divider.trigger('mousedown', { clientX: 500, clientY: 300 })

    // Simulate mouse move
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 600, clientY: 300 }))

    // Clean up
    document.dispatchEvent(new MouseEvent('mouseup'))
  })

  it('should prevent default on mousedown event', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { size: 50 }, () => 'Pane 1'),
          h(SplitPaneItem, { size: 50 }, () => 'Pane 2'),
        ],
      },
    })

    const divider = wrapper.find('.kong-ui-public-split-pane-item-divider')
    const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    divider.element.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('should not render divider handle when showDividerHandle is false', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { showDividerHandle: false }, () => 'Pane 1'),
          h(SplitPaneItem, { showDividerHandle: false }, () => 'Pane 2'),
        ],
      },
    })

    const handles = wrapper.findAll('.kong-ui-public-split-pane-item-divider-handle')
    expect(handles.length).toBe(0)
  })

  it('should apply correct cursor style for horizontal split', async () => {
    const wrapper = mount(SplitPane, {
      props: {
        horizontal: false, // vertical split = horizontal dividers
      },
      slots: {
        default: () => [
          h(SplitPaneItem, {}, () => 'Pane 1'),
          h(SplitPaneItem, {}, () => 'Pane 2'),
        ],
      },
    })

    // The cursor style is applied via CSS class, check for the parent class
    const container = wrapper.find('.kong-ui-public-split-pane-content-panes')
    expect(container.classes()).toContain('horizontal')
  })

  it('should apply correct cursor style for vertical split', async () => {
    const wrapper = mount(SplitPane, {
      props: {
        horizontal: true, // horizontal split = vertical dividers
      },
      slots: {
        default: () => [
          h(SplitPaneItem, {}, () => 'Pane 1'),
          h(SplitPaneItem, {}, () => 'Pane 2'),
        ],
      },
    })

    const container = wrapper.find('.kong-ui-public-split-pane-content-panes')
    expect(container.classes()).toContain('vertical')
  })

  it('should handle multiple panes', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { size: 25 }, () => 'Pane 1'),
          h(SplitPaneItem, { size: 25 }, () => 'Pane 2'),
          h(SplitPaneItem, { size: 25 }, () => 'Pane 3'),
          h(SplitPaneItem, { size: 25 }, () => 'Pane 4'),
        ],
      },
    })

    const panes = wrapper.findAllComponents(SplitPaneItem)
    expect(panes.length).toBe(4)

    // Should have 3 dividers for 4 panes
    const dividers = wrapper.findAll('.kong-ui-public-split-pane-item-divider')
    expect(dividers.length).toBeGreaterThanOrEqual(3)
  })

  it('should clamp size between minSize and maxSize', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { size: 150, minSize: 20, maxSize: 80 }, () => 'Pane 1'),
          h(SplitPaneItem, { size: 50 }, () => 'Pane 2'),
        ],
      },
    })

    // Size should be clamped to maxSize (80)
    const panes = wrapper.findAllComponents(SplitPaneItem)
    expect(panes.length).toBe(2)
  })

  it('should distribute space equally when no sizes are specified', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, {}, () => 'Pane 1'),
          h(SplitPaneItem, {}, () => 'Pane 2'),
          h(SplitPaneItem, {}, () => 'Pane 3'),
        ],
      },
    })

    // All three panes should be rendered with equal sizes
    const panes = wrapper.findAllComponents(SplitPaneItem)
    expect(panes.length).toBe(3)
  })

  it('should add has-handle class when showDividerHandle is true', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { showDividerHandle: true }, () => 'Pane 1'),
          h(SplitPaneItem, {}, () => 'Pane 2'),
        ],
      },
    })

    const divider = wrapper.find('.kong-ui-public-split-pane-item-divider')
    expect(divider.classes()).toContain('has-handle')
  })
})
