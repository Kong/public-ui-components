import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref, type Ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import Kongponents from '@kong/kongponents'
import PageLayoutTabs from './PageLayoutTabs.vue'
import type { PageLayoutTab } from '../types'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/tab', name: 'tab', component: { template: '<div />' } },
    { path: '/:pathMatch(.*)*', name: 'catch-all', component: { template: '<div />' } },
  ],
})

/** Simulated width of a single `li` (a tab, or the overflow dropdown) */
const TAB_WIDTH = 100
/** The horizontal padding (`KUI_SPACE_60` on both sides) the component subtracts from the container width */
const CONTAINER_PADDING = 32
/** The padding the component keeps to the right of the tabs list */
const TABS_LIST_END_PADDING = 50

/**
 * The width `.page-layout-tabs` reports. jsdom has no layout engine, so every element measures
 * 0x0 and the component's overflow math has to be fed with stubbed measurements instead.
 */
let containerWidth = 0

/**
 * Returns the container width needed for `tabCount` tabs to fit, so the tests can
 * express widths in terms of the layout they expect rather than magic numbers.
 */
const widthForTabs = (tabCount: number): number =>
  (tabCount * TAB_WIDTH) + TABS_LIST_END_PADDING + CONTAINER_PADDING

const resizeObserverCallbacks = new Set<ResizeObserverCallback>()

class ResizeObserverStub implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {
    resizeObserverCallbacks.add(callback)
  }

  observe(): void {}
  unobserve(): void {}

  disconnect(): void {
    resizeObserverCallbacks.delete(this.callback)
  }
}

global.ResizeObserver = ResizeObserverStub

/** Notifies the component's `useResizeObserver` callback, as the browser would on a container resize */
const triggerResize = async (): Promise<void> => {
  for (const callback of resizeObserverCallbacks) {
    callback([], {} as ResizeObserver)
  }

  // The component debounces the resize handler by 150ms
  await new Promise((resolve) => setTimeout(resolve, 200))
  await flushPromises()
}

/** The tabs rendered in the tab row itself, i.e. everything that is not in the overflow dropdown */
const visibleTabCount = (wrapper: VueWrapper<any>): number => wrapper.findAll('li > a.tab-link').length

const mountTabs = (options: Record<string, any> = {}) => mount(PageLayoutTabs, {
  ...options,
  global: {
    ...options.global,
    plugins: [Kongponents, router, ...(options.global?.plugins ?? [])],
  },
})

describe('<PageLayoutTabs />', () => {
  beforeEach(async () => {
    // The router is shared across tests, so reset it off of any tab route
    await router.push('/')

    // Wide enough that nothing overflows unless a test narrows it
    containerWidth = widthForTabs(20)

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function(this: Element): DOMRect {
      let width = 0

      if (this.classList.contains('page-layout-tabs')) {
        width = containerWidth
      } else if (this.tagName === 'UL' && this.parentElement?.classList.contains('page-layout-tabs')) {
        // Every `li` in the list — the visible tabs plus the overflow dropdown — is `TAB_WIDTH` wide
        width = this.children.length * TAB_WIDTH
      }

      return { width, height: 0, top: 0, right: width, bottom: 0, left: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resizeObserverCallbacks.clear()
  })

  it('renders tabs correctly', async () => {
    const tabs: PageLayoutTab[] = [
      { key: 'overview', label: 'Overview', to: '/overview' },
      { key: 'settings', label: 'Settings', to: '/settings' },
    ]

    const wrapper = mountTabs({ props: { tabs } })

    await flushPromises()

    expect(wrapper.getTestId('page-layout-tabs').exists()).toBe(true)

    const overviewTab = wrapper.getTestId('page-layout-tab-overview')

    expect(overviewTab.text()).toContain(tabs[0].label)
    expect(overviewTab.attributes('href')).toBe(tabs[0].to)

    const settingsTab = wrapper.getTestId('page-layout-tab-settings')

    expect(settingsTab.text()).toContain(tabs[1].label)
    expect(settingsTab.attributes('href')).toBe(tabs[1].to)
  })

  it('handles overflow correctly with overflowing tab showing in dropdown', async () => {
    const tabs: PageLayoutTab[] = Array.from({ length: 8 }, (_, i) => ({
      key: `tab${i + 1}`,
      label: `Tab ${i + 1}`,
      to: `/tab${i + 1}`,
    }))

    // Only wide enough for a couple of tabs, so the rest overflow
    containerWidth = widthForTabs(3)

    const wrapper = mountTabs({ props: { tabs } })

    await flushPromises()

    expect(wrapper.getTestId('page-layout-tabs').exists()).toBe(true)

    // Only the tabs that fit stay in the tab row
    const visibleTabs = wrapper.findAll('li > a.tab-link')

    expect(visibleTabs.length).toBeGreaterThan(0)
    expect(visibleTabs.length).toBeLessThan(tabs.length)

    // The "More" dropdown should be rendered
    const dropdownButton = wrapper.getTestId('tabs-overflow-dropdown-button')

    expect(dropdownButton.exists()).toBe(true)

    // Click the dropdown to reveal overflow items
    await dropdownButton.trigger('click')
    await flushPromises()

    // The last tab should be in the dropdown
    const lastTab = tabs[tabs.length - 1]
    const overflowingTab = wrapper.getTestId('tabs-overflow-dropdown-popover')
      .getTestId(`page-layout-tab-${lastTab.key}`)

    expect(overflowingTab.text()).toContain(lastTab.label)
    expect(overflowingTab.attributes('href')).toBe(lastTab.to)
  })

  it('recomputes the tab layout when the tabs prop changes', async () => {
    const initialTabs: PageLayoutTab[] = [
      { key: 'tab1', label: 'Tab 1', to: '/tab1' },
      { key: 'tab2', label: 'Tab 2', to: '/tab2' },
    ]

    const manyTabs: PageLayoutTab[] = Array.from({ length: 8 }, (_, i) => ({
      key: `tab${i + 1}`,
      label: `Tab ${i + 1}`,
      to: `/tab${i + 1}`,
    }))

    // Room for 5 `li`s: 4 tabs plus the overflow dropdown
    containerWidth = widthForTabs(5)

    const wrapper = mountTabs({ props: { tabs: initialTabs } })

    await flushPromises()

    expect(wrapper.findTestId('tabs-overflow-dropdown-button').exists()).toBe(false)

    await wrapper.setProps({ tabs: manyTabs })
    await flushPromises()

    expect(wrapper.findTestId('tabs-overflow-dropdown-button').exists()).toBe(true)
    // The count is recomputed for the new tabs rather than left at the two tabs rendered before
    expect(visibleTabCount(wrapper)).toBe(4)
  })

  it('recomputes the tab layout when tabs are pushed into the existing array', async () => {
    const tabsRef: Ref<PageLayoutTab[]> = ref([
      { key: 'tab1', label: 'Tab 1', to: '/tab1' },
      { key: 'tab2', label: 'Tab 2', to: '/tab2' },
    ])

    const tabsToAppend: PageLayoutTab[] = Array.from({ length: 6 }, (_, i) => ({
      key: `tab${i + 3}`,
      label: `Tab ${i + 3}`,
      to: `/tab${i + 3}`,
    }))

    // Room for 5 `li`s: 4 tabs plus the overflow dropdown
    containerWidth = widthForTabs(5)

    const wrapper = mount(defineComponent({
      setup: () => () => h(PageLayoutTabs, { tabs: tabsRef.value }),
    }), {
      global: {
        plugins: [Kongponents, router],
      },
    })

    await flushPromises()

    expect(wrapper.findTestId('tabs-overflow-dropdown-button').exists()).toBe(false)

    tabsRef.value.push(...tabsToAppend)
    await flushPromises()

    expect(wrapper.findTestId('tabs-overflow-dropdown-button').exists()).toBe(true)
    // The count is recomputed for the appended tabs rather than left at the two tabs rendered before
    expect(visibleTabCount(wrapper)).toBe(4)
  })

  it('recomputes the tab layout when its container is resized', async () => {
    const tabs: PageLayoutTab[] = Array.from({ length: 8 }, (_, i) => ({
      key: `tab${i + 1}`,
      label: `Tab ${i + 1}`,
      to: `/tab${i + 1}`,
    }))

    // All tabs fit to begin with, so the overflow dropdown should not appear
    containerWidth = widthForTabs(tabs.length)

    const wrapper = mountTabs({ props: { tabs } })

    await flushPromises()

    expect(wrapper.findTestId('tabs-overflow-dropdown-button').exists()).toBe(false)

    // Shrink the container; the ResizeObserver should detect the change and recompute overflow
    containerWidth = widthForTabs(3)
    await triggerResize()

    expect(wrapper.findTestId('tabs-overflow-dropdown-button').exists()).toBe(true)

    // Grow the container back; the dropdown should disappear once everything fits again
    containerWidth = widthForTabs(tabs.length)
    await triggerResize()

    expect(wrapper.findTestId('tabs-overflow-dropdown-button').exists()).toBe(false)
  })

  it('renders custom content via the dynamic `tab-${key}` slot', async () => {
    const customOverviewTestId = 'custom-overview'
    const customOverviewText = 'Custom Overview'
    const tabs: PageLayoutTab[] = [
      { key: 'overview', label: 'Overview', to: '/overview' },
      { key: 'settings', label: 'Settings', to: '/settings' },
    ]

    const wrapper = mountTabs({
      props: { tabs },
      slots: {
        'tab-overview': `<span data-testid="${customOverviewTestId}">${customOverviewText}</span>`,
      },
    })

    await flushPromises()

    expect(wrapper.getTestId('page-layout-tab-overview').getTestId(customOverviewTestId).text()).toBe(customOverviewText)
    // Tabs without a matching slot fall back to the label
    expect(wrapper.getTestId('page-layout-tab-settings').text()).toContain(tabs[1].label)
  })

  it('exposes the tab as a slot prop on the dynamic `tab-${key}` slot', async () => {
    const slotPropLabelTestId = 'slot-prop-label'
    const tabs: PageLayoutTab[] = [
      { key: 'overview', label: 'Overview', to: '/overview' },
    ]

    const wrapper = mountTabs({
      props: { tabs },
      slots: {
        'tab-overview': ({ tab }: { tab: PageLayoutTab }) =>
          h('span', { 'data-testid': slotPropLabelTestId }, tab.label),
      },
    })

    await flushPromises()

    expect(wrapper.getTestId(slotPropLabelTestId).text()).toBe(tabs[0].label)
  })

  it('uses the navigateTo injectable to navigate to the tab', async () => {
    const navigateTo = vi.fn()
    const tabs: PageLayoutTab[] = [
      { key: 'tab', label: 'Tab', to: '/tab' },
    ]

    const wrapper = mountTabs({
      props: { tabs },
      global: {
        provide: { 'app:navigateTo': navigateTo },
      },
    })

    await flushPromises()
    await wrapper.getTestId('page-layout-tab-tab').trigger('click')

    expect(navigateTo).toHaveBeenCalledWith(tabs[0].to)
  })

  it('does not use the navigateTo injectable if the tab.to is not a string', async () => {
    const navigateTo = vi.fn()
    const tabs: PageLayoutTab[] = [
      { key: 'tab', label: 'Tab', to: { name: 'tab' } },
    ]

    const wrapper = mountTabs({
      props: { tabs },
      global: {
        provide: { 'app:navigateTo': navigateTo },
      },
    })

    await flushPromises()
    await wrapper.getTestId('page-layout-tab-tab').trigger('click')
    await flushPromises()

    expect(navigateTo).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('tab')
  })

  it('uses the navigateTo injectable to navigate to the tab on Enter key press', async () => {
    const navigateTo = vi.fn()
    const tabs: PageLayoutTab[] = [
      { key: 'tab', label: 'Tab', to: '/tab' },
    ]

    const wrapper = mountTabs({
      props: { tabs },
      global: {
        provide: { 'app:navigateTo': navigateTo },
      },
    })

    await flushPromises()
    await wrapper.getTestId('page-layout-tab-tab').trigger('keydown.enter')

    expect(navigateTo).toHaveBeenCalledWith(tabs[0].to)
  })

  it('does not use the navigateTo injectable if the tab.to is not a string on Enter key press', async () => {
    const navigateTo = vi.fn()
    const tabs: PageLayoutTab[] = [
      { key: 'tab', label: 'Tab', to: { name: 'tab' } },
    ]

    const wrapper = mountTabs({
      props: { tabs },
      global: {
        provide: { 'app:navigateTo': navigateTo },
      },
    })

    await flushPromises()
    await wrapper.getTestId('page-layout-tab-tab').trigger('keydown.enter')
    await flushPromises()

    expect(navigateTo).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('tab')
  })
})
