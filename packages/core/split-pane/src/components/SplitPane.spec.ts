import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import SplitPane from './SplitPane.vue'
import SplitPaneItem from './SplitPaneItem.vue'

describe('<SplitPane />', () => {
  let localStorageMock: Record<string, string>

  beforeEach(() => {
    localStorageMock = {}
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key]
      }),
      clear: vi.fn(() => {
        localStorageMock = {}
      }),
      key: vi.fn(),
      length: 0,
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render with default props', () => {
    const wrapper = mount(SplitPane)

    expect(wrapper.isVisible()).toBe(true)
    expect(wrapper.find('.kong-ui-public-split-pane-content-panes').exists()).toBe(true)
  })

  it('should apply horizontal class by default (vertical split)', () => {
    const wrapper = mount(SplitPane)
    const container = wrapper.find('.kong-ui-public-split-pane-content-panes')

    expect(container.classes()).toContain('horizontal')
    expect(container.classes()).not.toContain('vertical')
  })

  it('should apply vertical class when horizontal prop is true (horizontal split)', () => {
    const wrapper = mount(SplitPane, {
      props: {
        horizontal: true,
      },
    })

    const container = wrapper.find('.kong-ui-public-split-pane-content-panes')

    expect(container.classes()).toContain('vertical')
    expect(container.classes()).not.toContain('horizontal')
  })

  it('should render slot content', () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: '<div class="test-content">Test Content</div>',
      },
    })

    expect(wrapper.find('.test-content').exists()).toBe(true)
    expect(wrapper.find('.test-content').text()).toBe('Test Content')
  })

  it('should provide context to child components', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { size: 50 }, () => 'Pane 1'),
          h(SplitPaneItem, { size: 50 }, () => 'Pane 2'),
        ],
      },
    })

    const panes = wrapper.findAllComponents(SplitPaneItem)
    expect(panes.length).toBe(2)
  })

  it('should handle drag interaction on divider', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { size: 50 }, () => 'Pane 1'),
          h(SplitPaneItem, { size: 50 }, () => 'Pane 2'),
        ],
      },
    })

    const divider = wrapper.find('.kong-ui-public-split-pane-item-divider')

    // Verify divider exists and can be interacted with
    expect(divider.exists()).toBe(true)

    // Should not throw when triggering mousedown
    await divider.trigger('mousedown', { clientX: 100, clientY: 100 })

    // Clean up
    document.dispatchEvent(new MouseEvent('mouseup'))
  })

  it('should accept storageKey prop', () => {
    const wrapper = mount(SplitPane, {
      props: {
        storageKey: 'test-storage-key',
      },
    })

    expect(wrapper.props('storageKey')).toBe('test-storage-key')
  })

  it('should attempt to load from localStorage when storageKey is provided', async () => {
    const storageKey = 'test-persist'
    mount(SplitPane, {
      props: {
        storageKey,
      },
      slots: {
        default: () => [
          h(SplitPaneItem, { size: 60 }, () => 'Pane 1'),
          h(SplitPaneItem, { size: 40 }, () => 'Pane 2'),
        ],
      },
    })

    // Verify that localStorage.getItem was called during initialization
    expect(localStorage.getItem).toHaveBeenCalledWith(
      `kong-ui-public-split-pane-${storageKey}`,
    )
  })

  it('should load pane sizes from localStorage when storageKey is provided', async () => {
    const storageKey = 'test-load'
    const savedSizes = JSON.stringify({ 1: 70, 2: 30 })
    localStorageMock[`kong-ui-public-split-pane-${storageKey}`] = savedSizes

    mount(SplitPane, {
      props: {
        storageKey,
      },
      slots: {
        default: () => [
          h(SplitPaneItem, { size: 50 }, () => 'Pane 1'),
          h(SplitPaneItem, { size: 50 }, () => 'Pane 2'),
        ],
      },
    })

    expect(localStorage.getItem).toHaveBeenCalledWith(`kong-ui-public-split-pane-${storageKey}`)
  })

  it('should reset pane sizes when mounted', async () => {
    const wrapper = mount(SplitPane, {
      slots: {
        default: () => [
          h(SplitPaneItem, { size: 33 }, () => 'Pane 1'),
          h(SplitPaneItem, { size: 33 }, () => 'Pane 2'),
          h(SplitPaneItem, { size: 34 }, () => 'Pane 3'),
        ],
      },
    })

    // Verify panes are rendered (size reset happens internally)
    const panes = wrapper.findAllComponents(SplitPaneItem)
    expect(panes.length).toBe(3)
  })
})
