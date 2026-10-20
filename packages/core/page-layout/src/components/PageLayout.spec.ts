import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { defineComponent, h, inject, onMounted, reactive, ref, Teleport } from 'vue'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import Kongponents from '@kong/kongponents'
import PageLayout from './PageLayout.vue'
import { NEW_APPEARANCE_INJECTION_KEY, nestedPageLayoutInjectionKey } from '../symbols'
import type { PageLayoutTab, PageShortcutData } from '../types'

const validShortcutData: PageShortcutData = {
  label: 'My Service',
  path: '/services/my-service',
  entityType: 'gateway-service',
}

const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
})

/** The component debounces `onEntityPageVisit` by 500ms */
const ENTITY_PAGE_VISIT_DEBOUNCE = 500

const flushEntityPageVisitDebounce = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ENTITY_PAGE_VISIT_DEBOUNCE + 50))
  await flushPromises()
}

/** A page shortcuts context with every callback the component looks for */
const createShortcutsContext = (overrides: Record<string, unknown> = {}) => reactive({
  isFavorite: () => false,
  onFavoriteToggle: () => {},
  onEntityPageVisit: () => {},
  ...overrides,
})

// Several tests mount to the document, so make sure nothing is left behind for the next one
enableAutoUnmount(afterEach)

describe('<PageLayout />', () => {
  let router: Router

  beforeEach(async () => {
    router = createTestRouter()
    await router.push('/services/my-service')
    await router.isReady()
  })

  const mountWithRouter = (component: any, options: Record<string, any> = {}) => mount(component, {
    ...options,
    global: {
      ...options.global,
      plugins: [Kongponents, router, ...(options.global?.plugins ?? [])],
    },
  })

  it('renders breadcrumbs, title and tabs when breadcrumbs and tabs are passed', async () => {
    const title = 'Test Page Title'

    const breadcrumbs = [
      { key: 'home', text: 'Home', to: '/' },
      { key: 'current', text: 'Current Page' },
    ]
    const tabs = [
      { key: 'overview', label: 'Overview', to: '/overview' },
      { key: 'settings', label: 'Settings', to: '/settings' },
    ]

    const wrapper = mountWithRouter(PageLayout, {
      props: {
        title,
        breadcrumbs,
        tabs,
      },
    })

    await flushPromises()

    expect(wrapper.findTestId('page-layout-breadcrumbs').exists()).toBe(true)
    expect(wrapper.getTestId('page-layout-title').text()).toContain(title)
    expect(wrapper.findTestId('page-layout-navigate-back').exists()).toBe(false)
    expect(wrapper.findTestId('page-layout-tabs').exists()).toBe(true)
  })

  it('renders the back button when the backTo prop is passed', () => {
    const backTo = '/'

    const wrapper = mountWithRouter(PageLayout, {
      props: {
        title: 'Test Page Title',
        backTo,
      },
    })

    expect(wrapper.getTestId('page-layout-navigate-back').attributes('href')).toBe(backTo)
  })

  it('renders only the title when neither breadcrumbs nor tabs are passed', () => {
    const title = 'Test Page Title'

    const wrapper = mountWithRouter(PageLayout, {
      props: {
        title,
      },
    })

    expect(wrapper.findTestId('page-layout-breadcrumbs').exists()).toBe(false)
    expect(wrapper.getTestId('page-layout-title').text()).toContain(title)
    expect(wrapper.findTestId('page-layout-tabs').exists()).toBe(false)
  })

  it('renders content passed in through actions slot', () => {
    const actionsTestId = 'page-layout-slotted-actions'
    const actionsText = 'Actions'

    const wrapper = mountWithRouter(PageLayout, {
      props: { title: 'Test Page Title' },
      slots: { actions: () => h('div', { 'data-testid': actionsTestId }, actionsText) },
    })

    expect(wrapper.getTestId(actionsTestId).text()).toContain(actionsText)
  })

  describe('Ask Kai teleport target', () => {
    const kaiTarget = '[data-teleport-target="ask-kai"]'

    it('renders the teleport target even when no actions slot content is provided', () => {
      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title' },
      })

      // The host needs the target in the DOM regardless of the actions slot
      expect(wrapper.find(kaiTarget).exists()).toBe(true)
      expect(wrapper.find('.page-header-actions-container').exists()).toBe(true)
    })

    it('renders the teleport target after the actions slot content', () => {
      const actionsTestId = 'page-layout-slotted-actions'

      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title' },
        slots: { actions: () => h('div', { 'data-testid': actionsTestId }, 'Actions') },
      })

      const children = wrapper.get('.page-header-actions-container').element.children

      expect(children).toHaveLength(2)
      expect(children[0].getAttribute('data-testid')).toBe(actionsTestId)
      expect(children[1].getAttribute('data-teleport-target')).toBe('ask-kai')
    })

    it('receives content teleported by the host application', async () => {
      const Wrapper = defineComponent({
        setup() {
          // The target is only in the document once PageLayout has mounted, which is how
          // the host app shell reaches it too
          const layoutMounted = ref(false)
          onMounted(() => {
            layoutMounted.value = true
          })

          return () => h(PageLayout, { title: 'Test Page Title' }, {
            default: () => layoutMounted.value
              ? h(Teleport, { to: kaiTarget }, [
                h('button', { 'data-testid': 'ask-kai-button' }, 'Ask Kai'),
              ])
              : null,
          })
        },
      })

      // Teleport resolves its target through `document.querySelector`, so the layout has to be in the document
      const wrapper = mountWithRouter(Wrapper, { attachTo: document.body })

      await flushPromises()

      const askKaiButton = wrapper.get(`.page-header-actions-container ${kaiTarget}`).getTestId('ask-kai-button')

      expect(askKaiButton.text()).toContain('Ask Kai')
    })
  })

  it('renders content passed in through title slot', () => {
    const titleTestId = 'page-layout-slotted-title'
    const titleText = 'Title'

    const wrapper = mountWithRouter(PageLayout, {
      props: { title: 'Test Page Title' },
      slots: { title: () => h('span', { 'data-testid': titleTestId }, titleText) },
    })

    expect(wrapper.getTestId(titleTestId).text()).toContain(titleText)
  })

  it('forwards content from the dynamic `tab-${key}` slot to PageLayoutTabs', async () => {
    const overviewTabTestId = 'custom-overview-tab'
    const overviewTabText = 'Custom Overview'
    const tabs = [
      { key: 'overview', label: 'Overview', to: '/overview' },
      { key: 'settings', label: 'Settings', to: '/settings' },
    ]

    const wrapper = mountWithRouter(PageLayout, {
      props: {
        title: 'Test Page Title',
        tabs,
      },
      slots: {
        'tab-overview': `<span data-testid="${overviewTabTestId}">${overviewTabText}</span>`,
      },
    })

    await flushPromises()

    expect(wrapper.getTestId('page-layout-tab-overview').getTestId(overviewTabTestId).text()).toContain(overviewTabText)
    expect(wrapper.getTestId('page-layout-tab-settings').text()).toContain(tabs[1].label)
  })

  it('renders content passed in through title-after slot', () => {
    const titleAfterTestId = 'page-layout-slotted-title-after'
    const titleAfterText = 'Title after'

    const wrapper = mountWithRouter(PageLayout, {
      props: { title: 'Test Page Title' },
      slots: { 'title-after': () => h('span', { 'data-testid': titleAfterTestId }, titleAfterText) },
    })

    expect(wrapper.getTestId(titleAfterTestId).text()).toContain(titleAfterText)
  })

  describe('nested PageLayout detection', () => {
    // Simulates a child PageLayout by calling the registration callback its parent provides
    const ChildNotifier = defineComponent({
      setup() {
        const register = inject<() => (() => void)>(nestedPageLayoutInjectionKey)
        register?.()
        return () => null
      },
    })

    it('hides its own header when a nested PageLayout is detected', async () => {
      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Parent Title' },
        slots: { default: () => h(ChildNotifier) },
      })

      // The child registers while the parent renders, so the parent re-renders on the next tick
      await flushPromises()

      expect(wrapper.findTestId('page-layout-title').exists()).toBe(false)
      expect(wrapper.findTestId('page-layout-breadcrumbs').exists()).toBe(false)
      expect(wrapper.findTestId('page-layout-tabs').exists()).toBe(false)
    })

    it('drops the content padding when a nested PageLayout is detected', async () => {
      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Parent Title' },
        slots: { default: () => h(ChildNotifier) },
      })

      await flushPromises()

      // The nested layout brings its own padding, so the pass-through parent drops its own
      expect(wrapper.get('.page-layout-content-container').classes()).toContain('has-nested-page-layout')
    })

    it('keeps the content padding when there is no nested PageLayout', () => {
      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title' },
        slots: { default: () => h('div', 'Page content') },
      })

      expect(wrapper.get('.page-layout-content-container').classes()).not.toContain('has-nested-page-layout')
    })

    it('calls the parent registration callback on mount when nested inside a parent PageLayout', () => {
      const register = vi.fn(() => () => {})

      mountWithRouter(PageLayout, {
        props: { title: 'Child Title' },
        global: {
          provide: {
            [nestedPageLayoutInjectionKey]: register,
          },
        },
      })

      expect(register).toHaveBeenCalled()
    })

    it('restores the parent header when the nested PageLayout is unmounted', async () => {
      const parentTitle = 'Parent Title'
      const childTitle = 'Child Title'
      const showChild = ref(true)

      const Wrapper = defineComponent({
        setup() {
          return () => h(PageLayout, { title: parentTitle }, {
            default: () => showChild.value ? h(PageLayout, { title: childTitle }) : null,
          })
        },
      })

      const wrapper = mountWithRouter(Wrapper)

      await flushPromises()

      // Child is mounted — parent header should be hidden, child header rendered
      expect(wrapper.findAll('[data-testid="page-layout-title"]')).toHaveLength(1)
      expect(wrapper.getTestId('page-layout-title').text()).toContain(childTitle)

      // Unmount the child
      showChild.value = false
      await flushPromises()

      // Parent header should reappear
      expect(wrapper.findAll('[data-testid="page-layout-title"]')).toHaveLength(1)
      expect(wrapper.getTestId('page-layout-title').text()).toContain(parentTitle)
    })

    it('only the innermost PageLayout invokes onEntityPageVisit when nested', async () => {
      const onEntityPageVisit = vi.fn()
      const ctx = createShortcutsContext({ onEntityPageVisit })

      mountWithRouter(PageLayout, {
        props: { title: 'Parent Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
        slots: {
          default: () => h(PageLayout, { title: 'Child Title', pageShortcutData: validShortcutData }),
        },
      })

      await flushEntityPageVisitDebounce()

      // Only the child (innermost) PageLayout should invoke onEntityPageVisit
      expect(onEntityPageVisit).toHaveBeenCalledOnce()
      expect(onEntityPageVisit).toHaveBeenCalledWith(validShortcutData)
    })

    it('hides the parent header when a nested PageLayout is slotted', async () => {
      const parentTitle = 'Parent Title'
      const childTitle = 'Child Title'

      const wrapper = mountWithRouter(PageLayout, {
        props: { title: parentTitle },
        slots: { default: () => h(PageLayout, { title: childTitle }) },
      })

      await flushPromises()

      expect(wrapper.findAll('[data-testid="page-layout-title"]')).toHaveLength(1)
      expect(wrapper.getTestId('page-layout-title').text()).toContain(childTitle)
      expect(wrapper.findTestId('page-layout-breadcrumbs').exists()).toBe(false)
      expect(wrapper.findTestId('page-layout-tabs').exists()).toBe(false)
    })
  })

  describe('page shortcuts', () => {
    it('does not render the favorite button when neither pageShortcutData nor pageShortcutsContext are provided', () => {
      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title' },
      })

      expect(wrapper.findTestId('page-layout-favorite-button').exists()).toBe(false)
    })

    it('does not render the favorite button when only pageShortcutData is provided', () => {
      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
      })

      expect(wrapper.findTestId('page-layout-favorite-button').exists()).toBe(false)
    })

    it('does not render the favorite button when only pageShortcutsContext is provided', () => {
      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title' },
        global: { provide: { 'app:pageShortcutsContext': createShortcutsContext() } },
      })

      expect(wrapper.findTestId('page-layout-favorite-button').exists()).toBe(false)
    })

    it('does not render the favorite button when pageShortcutData is missing required fields', () => {
      const wrapper = mountWithRouter(PageLayout, {
        props: {
          title: 'Test Page Title',
          pageShortcutData: { label: 'X' } as unknown as PageShortcutData,
        },
        global: { provide: { 'app:pageShortcutsContext': createShortcutsContext() } },
      })

      expect(wrapper.findTestId('page-layout-favorite-button').exists()).toBe(false)
    })

    it('does not render the favorite button when context lacks onFavoriteToggle', () => {
      const ctx = reactive({
        isFavorite: () => false,
        onEntityPageVisit: () => {},
      })

      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      expect(wrapper.findTestId('page-layout-favorite-button').exists()).toBe(false)
    })

    it('renders the favorite button when both pageShortcutData and pageShortcutsContext are provided', () => {
      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': createShortcutsContext() } },
      })

      const favoriteButton = wrapper.getTestId('page-layout-favorite-button')

      expect(favoriteButton.attributes('aria-label')).toBe('Save page to shortcuts')
      expect(favoriteButton.find('svg').exists()).toBe(true)
    })

    it('reflects isFavorite returning true with the filled star icon', () => {
      const ctx = createShortcutsContext({ isFavorite: () => true })

      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      const favoriteButton = wrapper.getTestId('page-layout-favorite-button')

      expect(favoriteButton.classes()).toContain('active')
      expect(favoriteButton.attributes('aria-label')).toBe('Remove page from shortcuts')
    })

    it('reflects isFavorite reactively after clicking the favorite button triggers onFavoriteToggle', async () => {
      const isFavoriteValue = ref(false)
      const onFavoriteToggle = vi.fn(() => {
        isFavoriteValue.value = true
      })
      const ctx = createShortcutsContext({
        isFavorite: () => isFavoriteValue.value,
        onFavoriteToggle,
      })

      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      expect(wrapper.getTestId('page-layout-favorite-button').classes()).not.toContain('active')

      await wrapper.getTestId('page-layout-favorite-button').trigger('click')

      expect(onFavoriteToggle).toHaveBeenCalledOnce()
      expect(wrapper.getTestId('page-layout-favorite-button').classes()).toContain('active')
    })

    it('calls isFavorite with the provided pageShortcutData', () => {
      const isFavorite = vi.fn().mockReturnValue(false)
      const ctx = createShortcutsContext({ isFavorite })

      mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      expect(isFavorite).toHaveBeenCalledWith(validShortcutData)
    })

    it('calls onFavoriteToggle when the favorite button is clicked', async () => {
      const onFavoriteToggle = vi.fn()
      const ctx = createShortcutsContext({ onFavoriteToggle })

      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      await wrapper.getTestId('page-layout-favorite-button').trigger('click')

      expect(onFavoriteToggle).toHaveBeenCalledOnce()
      expect(onFavoriteToggle).toHaveBeenCalledWith(validShortcutData)
    })

    it('calls onEntityPageVisit on mount with the provided pageShortcutData', async () => {
      const onEntityPageVisit = vi.fn()
      const ctx = createShortcutsContext({ onEntityPageVisit })

      mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      await flushEntityPageVisitDebounce()

      expect(onEntityPageVisit).toHaveBeenCalledOnce()
      expect(onEntityPageVisit).toHaveBeenCalledWith(validShortcutData)
    })

    it('calls onEntityPageVisit again when pageShortcutData changes', async () => {
      const onEntityPageVisit = vi.fn()
      const ctx = createShortcutsContext({ onEntityPageVisit })

      const data = ref<PageShortcutData>(validShortcutData)
      const Wrapper = defineComponent({
        setup() {
          return () => h(PageLayout, { title: 'Test Page Title', pageShortcutData: data.value })
        },
      })

      mountWithRouter(Wrapper, {
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      await flushEntityPageVisitDebounce()

      expect(onEntityPageVisit).toHaveBeenCalledOnce()

      data.value = { ...validShortcutData, path: '/services/another', label: 'Another' }
      await flushEntityPageVisitDebounce()

      expect(onEntityPageVisit).toHaveBeenCalledTimes(2)
      expect(onEntityPageVisit).toHaveBeenLastCalledWith(data.value)
    })

    it('does not call onEntityPageVisit when context is missing the callback', async () => {
      const ctx = reactive({
        isFavorite: () => false,
        onFavoriteToggle: () => {},
      })

      // Should not throw despite the missing callback
      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      await flushEntityPageVisitDebounce()

      expect(wrapper.findTestId('page-layout-favorite-button').exists()).toBe(true)
    })
  })

  describe('new appearance', () => {
    const breadcrumbs = [
      { key: 'home', text: 'Home', to: '/' },
      { key: 'services', text: 'Services', to: '/services' },
    ]

    it('renders the breadcrumbs and the title in the same header row', () => {
      const title = 'Test Page Title'

      const wrapper = mountWithRouter(PageLayout, {
        props: { title, breadcrumbs },
        global: { provide: { [NEW_APPEARANCE_INJECTION_KEY]: true } },
      })

      // The row itself is a flex container, so the two only have to be siblings in it
      const headerStart = wrapper.get('.page-header-start')

      expect(headerStart.findTestId('page-layout-breadcrumbs').exists()).toBe(true)
      expect(headerStart.getTestId('page-layout-title').text()).toContain(title)
    })

    it('does not render breadcrumbs when none are provided', () => {
      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title' },
        global: { provide: { [NEW_APPEARANCE_INJECTION_KEY]: true } },
      })

      expect(wrapper.findTestId('page-layout-breadcrumbs').exists()).toBe(false)
      expect(wrapper.findTestId('page-layout-title').exists()).toBe(true)
    })

    it('does not render the back button even when backTo is provided', () => {
      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', backTo: '/' },
        global: { provide: { [NEW_APPEARANCE_INJECTION_KEY]: true } },
      })

      expect(wrapper.findTestId('page-layout-navigate-back').exists()).toBe(false)
    })

    it('renders the favorite button when page shortcuts are configured', () => {
      const wrapper = mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: {
          provide: {
            'app:pageShortcutsContext': createShortcutsContext(),
            [NEW_APPEARANCE_INJECTION_KEY]: true,
          },
        },
      })

      expect(wrapper.findTestId('page-layout-favorite-button').exists()).toBe(true)
    })

    it('renders bare text in the title slot without an element wrapper', () => {
      const title = 'Umbrella R&D Development Control Plane for EMEA Production Workloads and Edge Gateways'

      const wrapper = mountWithRouter(PageLayout, {
        props: { breadcrumbs },
        // No element for the `> *` truncation rule to match, so the wrapper itself has to carry the cap
        slots: { title: () => title },
        global: { provide: { [NEW_APPEARANCE_INJECTION_KEY]: true } },
      })

      const titleWrapper = wrapper.get('.page-layout-title-wrapper')

      expect(titleWrapper.element.children).toHaveLength(0)
      expect(titleWrapper.text()).toBe(title)
    })

    describe('aside slot', () => {
      const asideTestId = 'page-layout-slotted-aside'
      const asideSlot = { aside: () => h('div', { 'data-testid': asideTestId }, 'Aside') }

      it('renders content passed in through the aside slot', () => {
        const wrapper = mountWithRouter(PageLayout, {
          props: { title: 'Test Page Title' },
          slots: asideSlot,
          global: { provide: { [NEW_APPEARANCE_INJECTION_KEY]: true } },
        })

        expect(wrapper.findTestId('page-layout-aside').exists()).toBe(true)
        expect(wrapper.getTestId(asideTestId).text()).toContain('Aside')
      })

      it('does not render the aside container when the slot is not provided', () => {
        const wrapper = mountWithRouter(PageLayout, {
          props: { title: 'Test Page Title' },
          global: { provide: { [NEW_APPEARANCE_INJECTION_KEY]: true } },
        })

        expect(wrapper.findTestId('page-layout-aside').exists()).toBe(false)
      })

      it('does not render the aside in the default appearance', () => {
        const wrapper = mountWithRouter(PageLayout, {
          props: { title: 'Test Page Title' },
          slots: asideSlot,
        })

        expect(wrapper.findTestId('page-layout-aside').exists()).toBe(false)
        expect(wrapper.findTestId(asideTestId).exists()).toBe(false)
      })

      it('renders the aside before the content, so its heading ranks early in the outline', () => {
        const wrapper = mountWithRouter(PageLayout, {
          props: { title: 'Test Page Title' },
          slots: { ...asideSlot, default: () => h('div', 'Page content') },
          global: { provide: { [NEW_APPEARANCE_INJECTION_KEY]: true } },
        })

        // The container reverses them visually, so the DOM order is what the CSS relies on
        const children = wrapper.get('.page-layout-content-container').element.children

        expect(children[0].getAttribute('data-testid')).toBe('page-layout-aside')
        expect(children[1].classList.contains('page-layout-content')).toBe(true)
      })
    })

    describe('appearance injection', () => {
      it('renders the default appearance when the injection is missing', () => {
        const wrapper = mountWithRouter(PageLayout, {
          props: { title: 'Test Page Title', backTo: '/' },
        })

        expect(wrapper.getTestId('kong-ui-public-page-layout').classes()).not.toContain('new-appearance')
        // The back button is only rendered in the default appearance
        expect(wrapper.findTestId('page-layout-navigate-back').exists()).toBe(true)
      })

      it('renders the default appearance when the injection is false', () => {
        const wrapper = mountWithRouter(PageLayout, {
          props: { title: 'Test Page Title', backTo: '/' },
          global: { provide: { [NEW_APPEARANCE_INJECTION_KEY]: false } },
        })

        expect(wrapper.getTestId('kong-ui-public-page-layout').classes()).not.toContain('new-appearance')
        expect(wrapper.findTestId('page-layout-navigate-back').exists()).toBe(true)
      })

      it('reacts to a ref passed through the injection', async () => {
        const newAppearance = ref<boolean>(false)

        const wrapper = mountWithRouter(PageLayout, {
          props: { title: 'Test Page Title', backTo: '/' },
          global: { provide: { [NEW_APPEARANCE_INJECTION_KEY]: newAppearance } },
        })

        expect(wrapper.getTestId('kong-ui-public-page-layout').classes()).not.toContain('new-appearance')

        newAppearance.value = true
        await flushPromises()

        expect(wrapper.getTestId('kong-ui-public-page-layout').classes()).toContain('new-appearance')
        expect(wrapper.findTestId('page-layout-navigate-back').exists()).toBe(false)
      })
    })

    describe('anchor navigation', () => {
      const anchors = [
        { key: 'usage', label: 'Usage', selector: '#usage' },
        { key: 'policies', label: 'Policies', selector: '#policies' },
      ]

      const tabs: PageLayoutTab[] = [
        { key: 'overview', label: 'Overview', to: '/overview' },
      ]

      it('renders the anchor navigation bar when anchors are provided', () => {
        const wrapper = mountWithRouter(PageLayout, {
          props: { title: 'Test Page Title', anchors },
          global: { provide: { [NEW_APPEARANCE_INJECTION_KEY]: true } },
        })

        expect(wrapper.findTestId('page-layout-anchor-navigation').exists()).toBe(true)
      })

      it('does not render the anchor navigation bar when no anchors are provided', () => {
        const wrapper = mountWithRouter(PageLayout, {
          props: { title: 'Test Page Title' },
          global: { provide: { [NEW_APPEARANCE_INJECTION_KEY]: true } },
        })

        expect(wrapper.findTestId('page-layout-anchor-navigation').exists()).toBe(false)
      })

      it('does not render the anchor navigation bar in the default appearance', () => {
        const wrapper = mountWithRouter(PageLayout, {
          props: { title: 'Test Page Title', anchors },
        })

        expect(wrapper.findTestId('page-layout-anchor-navigation').exists()).toBe(false)
      })

      it('renders tabs instead of the anchor navigation bar when both are provided', () => {
        const wrapper = mountWithRouter(PageLayout, {
          props: { title: 'Test Page Title', anchors, tabs },
          global: { provide: { [NEW_APPEARANCE_INJECTION_KEY]: true } },
        })

        expect(wrapper.findTestId('page-layout-tabs').exists()).toBe(true)
        expect(wrapper.findTestId('page-layout-anchor-navigation').exists()).toBe(false)
      })

      it('renders the default slot alongside the anchor navigation bar', () => {
        const wrapper = mountWithRouter(PageLayout, {
          props: { title: 'Test Page Title', anchors },
          slots: { default: () => h('div', { 'data-testid': 'anchored-page-content' }, 'Page content') },
          global: { provide: { [NEW_APPEARANCE_INJECTION_KEY]: true } },
        })

        expect(wrapper.findTestId('page-layout-anchor-navigation').exists()).toBe(true)
        expect(wrapper.getTestId('anchored-page-content').text()).toBe('Page content')
      })
    })
  })
})
