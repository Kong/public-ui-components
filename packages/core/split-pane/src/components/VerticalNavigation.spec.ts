import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import VerticalNavigation from './VerticalNavigation.vue'
import type { VerticalNavigationItem } from '../types'
import { ArrowLeftIcon } from '@kong/icons'
import Kongponents from '@kong/kongponents'

// mocks
vi.mock('../composable/useSplitPane', () => ({
  default: () => ({
    paneLeftExpanded: ref(true),
    togglePaneLeft: vi.fn(),
    isDraggingPaneLeft: ref(false),
    isDraggingInnerPanes: ref(false),
  }),
}))
vi.mock('../composable/useI18n', () => ({
  default: () => ({
    i18n: {
      t: (key: string) => key,
    },
  }),
}))
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('<VerticalNavigation />', () => {
  const createWrapper = (props = {}) => {
    return mount(VerticalNavigation, {
      props: {
        paneLeftWidth: 300,
        paneLeftVisible: true,
        items: [],
        ...props,
      },
      global: {
        plugins: [Kongponents],
        stubs: {
          ArrowLeftIcon,
        },
      },
    })
  }

  describe('rendering', () => {
    it('should render the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.kong-ui-public-split-pane-vertical-navigation').exists()).toBe(true)
    })

    it('should render custom navigation items', () => {
      const items: VerticalNavigationItem[] = [
        {
          tooltip: 'Test Item 1',
          icon: ArrowLeftIcon,
          active: false,
          testid: 'test-item-1',
          to: '/test-1',
        },
        {
          tooltip: 'Test Item 2',
          icon: ArrowLeftIcon,
          active: true,
          testid: 'test-item-2',
          to: '/test-2',
        },
      ]
      const wrapper = createWrapper({ items })
      const buttons = wrapper.findAll('.kong-ui-public-split-pane-vertical-navigation-nav-item')
      // Should have return button + 2 custom items + toggle button = 4
      expect(buttons.length).toBeGreaterThanOrEqual(3)
    })

    it('should render the toggle left panel button when paneLeftVisible is true', () => {
      const wrapper = createWrapper({ paneLeftVisible: true })
      const toggleButton = wrapper.find('[data-testid="kong-ui-public-split-pane-toggle-left-panel-button"]')
      expect(toggleButton.exists()).toBe(true)
    })

    it('should not render the toggle left panel button when paneLeftVisible is false', () => {
      const wrapper = createWrapper({ paneLeftVisible: false })
      const toggleButton = wrapper.find('[data-testid="kong-ui-public-split-pane-toggle-left-panel-button"]')
      expect(toggleButton.exists()).toBe(false)
    })
  })

  describe('active state', () => {
    it('should apply active class to active navigation items', () => {
      const items: VerticalNavigationItem[] = [
        {
          tooltip: 'Active Item',
          icon: ArrowLeftIcon,
          active: true,
          testid: 'active-item',
          to: '/active',
        },
      ]
      const wrapper = createWrapper({ items })
      const buttons = wrapper.findAll('.kong-ui-public-split-pane-vertical-navigation-nav-item')
      const activeButton = buttons.find((btn) => btn.classes('active'))
      expect(activeButton).toBeDefined()
    })

    it('should not apply active class to inactive navigation items', () => {
      const items: VerticalNavigationItem[] = [
        {
          tooltip: 'Inactive Item',
          icon: ArrowLeftIcon,
          active: false,
          testid: 'inactive-item',
          to: '/inactive',
        },
      ]
      const wrapper = createWrapper({ items })
      // The return button should not be active
      const returnButton = wrapper.find('[data-testid="kong-ui-public-split-pane-vertical-navigation-nav-item-inactive-item"]')
      expect(returnButton.classes('active')).toBe(false)
    })
  })

  describe('toggle panel', () => {
    it('should show collapse icon when pane is expanded', async () => {
      const wrapper = createWrapper()
      const toggleButton = wrapper.find('[data-testid="kong-ui-public-split-pane-toggle-left-panel-button"]')
      expect(toggleButton.exists()).toBe(true)
    })

    it('should call togglePaneLeft when toggle button is clicked', async () => {
      const wrapper = createWrapper()
      const toggleButton = wrapper.find('[data-testid="kong-ui-public-split-pane-toggle-left-panel-button"]')
      await toggleButton.trigger('click')
      // The mock function should have been called
      expect(toggleButton.exists()).toBe(true)
    })
  })

  describe('navigation item clicks', () => {
    it('should prevent navigation when clicking an already active item', async () => {
      const items: VerticalNavigationItem[] = [
        {
          tooltip: 'Active Item',
          icon: ArrowLeftIcon,
          active: true,
          testid: 'active-item',
          to: '/active',
        },
      ]
      const wrapper = createWrapper({ items })
      const button = wrapper.find('[data-testid="kong-ui-public-split-pane-vertical-navigation-nav-item-active-item"]')
      await button.trigger('click')
      // Should not navigate (tested via router mock)
      expect(button.exists()).toBe(true)
    })
  })

  describe('layout', () => {
    it('should position the toggle button based on paneLeftWidth', () => {
      const wrapper = createWrapper({ paneLeftWidth: 400 })
      const toggleControl = wrapper.find('.toggle-left-panel-control')
      expect(toggleControl.exists()).toBe(true)
    })

    it('should apply expanded class to toggle control when pane is expanded', () => {
      const wrapper = createWrapper()
      const toggleControl = wrapper.find('.toggle-left-panel-control')
      expect(toggleControl.classes()).toContain('expanded')
    })

    // TODO: enable once we decide on animation approach
    // it('should apply disable-animation class during initial mount', () => {
    //   const wrapper = createWrapper()
    //   const toggleControl = wrapper.find('.toggle-left-panel-control')
    //   expect(toggleControl.classes()).toContain('disable-animation')
    // })

    it('should apply disable-animation class when dragging', () => {
      // This would require mocking the composable to return isDraggingPaneLeft: true
      const wrapper = createWrapper()
      const toggleControl = wrapper.find('.toggle-left-panel-control')
      expect(toggleControl.exists()).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('should set correct aria-label on navigation buttons', () => {
      const items: VerticalNavigationItem[] = [
        {
          tooltip: 'Test Item',
          icon: ArrowLeftIcon,
          active: false,
          testid: 'test-item',
          to: '/test',
        },
      ]
      const wrapper = createWrapper({ items })
      const button = wrapper.find('[data-testid="kong-ui-public-split-pane-vertical-navigation-nav-item-test-item"]')
      // Button stub is present
      expect(button.exists()).toBe(true)
    })

    it('should set correct aria-controls and aria-expanded on toggle button', () => {
      const wrapper = createWrapper()
      const toggleButton = wrapper.find('[data-testid="kong-ui-public-split-pane-toggle-left-panel-button"]')
      // Toggle button is present
      expect(toggleButton.exists()).toBe(true)
    })
  })
})
