import { defineComponent, inject, h, reactive, ref } from 'vue'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import type { OptionsParam } from '../../../../../cypress/types'
import PageLayout from './PageLayout.vue'
import { nestedPageLayoutInjectionKey } from '../symbols'
import type { PageShortcutData } from '../types'

const validShortcutData: PageShortcutData = {
  label: 'My Service',
  path: '/services/my-service',
  entityType: 'gateway-service',
}

const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
})

describe('<PageLayout />', () => {
  let router: Router

  beforeEach(() => {
    router = createTestRouter()
    cy.wrap(router.push('/services/my-service').then(() => router.isReady()))
  })

  const mountWithRouter = (
    component: Parameters<typeof cy.mount>[0],
    options: OptionsParam = {},
  ) => cy.mount(component, { ...options, router } as OptionsParam)
  it('renders breadcrumbs, title and tabs when breadcrumbs and tabs are passed', () => {
    const title = 'Test Page Title'

    const breadcrumbs = [
      { key: 'home', text: 'Home', to: '/' },
      { key: 'current', text: 'Current Page' },
    ]
    const tabs = [
      { key: 'overview', label: 'Overview', to: '/overview' },
      { key: 'settings', label: 'Settings', to: '/settings' },
    ]

    mountWithRouter(PageLayout, {
      props: {
        title,
        breadcrumbs,
        tabs,
      },
    })

    cy.getTestId('page-layout-breadcrumbs').should('be.visible')
    cy.getTestId('page-layout-title').should('be.visible').and('contain.text', title)
    cy.getTestId('page-layout-navigate-back').should('not.exist')
    cy.getTestId('page-layout-tabs').should('be.visible')
  })

  it('renders the back button when the backTo prop is passed', () => {
    const backTo = '/'

    mountWithRouter(PageLayout, {
      props: {
        title: 'Test Page Title',
        backTo,
      },
    })

    cy.getTestId('page-layout-navigate-back').should('be.visible').should('have.attr', 'href', backTo)
  })

  it('renders only the title when neither breadcrumbs nor tabs are passed', () => {
    const title = 'Test Page Title'

    mountWithRouter(PageLayout, {
      props: {
        title,
      },
    })

    cy.getTestId('page-layout-breadcrumbs').should('not.exist')
    cy.getTestId('page-layout-title').should('be.visible').and('contain.text', title)
    cy.getTestId('page-layout-tabs').should('not.exist')
  })

  it('renders content passed in through actions slot', () => {
    const actionsTestId = 'page-layout-slotted-actions'
    const actionsText = 'Actions'

    mountWithRouter(PageLayout, {
      props: { title: 'Test Page Title' },
      slots: { actions: () => h('div', { 'data-testid': actionsTestId }, actionsText) },
    })

    cy.getTestId(actionsTestId).should('be.visible').and('contain.text', actionsText)
  })

  it('renders content passed in through title-after slot', () => {
    const titleAfterTestId = 'page-layout-slotted-title-after'
    const titleAfterText = 'Title after'

    mountWithRouter(PageLayout, {
      props: { title: 'Test Page Title' },
      slots: { 'title-after': () => h('span', { 'data-testid': titleAfterTestId }, titleAfterText) },
    })

    cy.getTestId(titleAfterTestId).should('be.visible').and('contain.text', titleAfterText)
  })

  describe('nested PageLayout detection', () => {
    it('hides its own header when a nested PageLayout is detected', () => {
      const parentTitle = 'Parent Title'
      // Simulate a child PageLayout by injecting a component that calls the registration callback
      const ChildNotifier = defineComponent({
        setup() {
          const register = inject<() => (() => void)>(nestedPageLayoutInjectionKey)
          register?.()
          return () => null
        },
      })

      mountWithRouter(PageLayout, {
        props: { title: parentTitle },
        slots: { default: () => h(ChildNotifier) },
      })

      cy.getTestId('page-layout-title').should('not.exist')
      cy.getTestId('page-layout-breadcrumbs').should('not.exist')
      cy.getTestId('page-layout-tabs').should('not.exist')
    })

    it('calls the parent registration callback on mount when nested inside a parent PageLayout', () => {
      const childTitle = 'Child Title'
      let notified = false

      mountWithRouter(PageLayout, {
        props: { title: childTitle },
        global: {
          provide: {
            [nestedPageLayoutInjectionKey]: () => {
              notified = true
              return () => { }
            },
          },
        },
      })

      // cy.wrap(null).should defers the callback so `notified` is read after mount, not at call time
      cy.wrap(null).should(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(notified).to.be.true
      })
    })

    it('restores the parent header when the nested PageLayout is unmounted', () => {
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

      mountWithRouter(Wrapper)

      // Child is mounted — parent header should be hidden, child header visible
      cy.getTestId('page-layout-title').should('have.length', 1).and('contain.text', childTitle)

      // Unmount the child
      cy.then(() => {
        showChild.value = false
      })

      // Parent header should reappear
      cy.getTestId('page-layout-title').should('have.length', 1).and('contain.text', parentTitle)
    })

    it('only the innermost PageLayout invokes onEntityPageVisit when nested', () => {
      const onEntityPageVisit = cy.stub().as('onEntityPageVisit')
      const ctx = reactive({
        isFavorite: false,
        onFavoriteToggle: () => { },
        onEntityPageVisit,
      })

      mountWithRouter(PageLayout, {
        props: { title: 'Parent Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
        slots: {
          default: () => h(PageLayout, { title: 'Child Title', pageShortcutData: validShortcutData }),
        },
      })

      // Only the child (innermost) PageLayout should invoke onEntityPageVisit
      cy.get('@onEntityPageVisit').should('have.been.calledOnce')
      cy.get('@onEntityPageVisit').should('have.been.calledWith', validShortcutData)
    })

    it('hides the parent header when a nested PageLayout is slotted', () => {
      const parentTitle = 'Parent Title'
      const childTitle = 'Child Title'

      mountWithRouter(PageLayout, {
        props: { title: parentTitle },
        slots: { default: () => h(PageLayout, { title: childTitle }) },
      })

      cy.getTestId('page-layout-title').should('have.length', 1).and('contain.text', childTitle)
      cy.getTestId('page-layout-breadcrumbs').should('not.exist')
      cy.getTestId('page-layout-tabs').should('not.exist')
    })
  })

  describe('page shortcuts', () => {
    it('does not render the favorite button when neither pageShortcutData nor pageShortcutsContext are provided', () => {
      mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title' },
      })

      cy.getTestId('page-layout-favorite-button').should('not.exist')
    })

    it('does not render the favorite button when only pageShortcutData is provided', () => {
      mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
      })

      cy.getTestId('page-layout-favorite-button').should('not.exist')
    })

    it('does not render the favorite button when only pageShortcutsContext is provided', () => {
      const ctx = reactive({
        isFavorite: false,
        onFavoriteToggle: () => { },
        onEntityPageVisit: () => { },
      })

      mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title' },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      cy.getTestId('page-layout-favorite-button').should('not.exist')
    })

    it('does not render the favorite button when pageShortcutData is missing required fields', () => {
      const ctx = reactive({
        isFavorite: false,
        onFavoriteToggle: () => { },
        onEntityPageVisit: () => { },
      })

      mountWithRouter(PageLayout, {
        // @ts-expect-error testing invalid shape
        props: { title: 'Test Page Title', pageShortcutData: { label: 'X' } },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      cy.getTestId('page-layout-favorite-button').should('not.exist')
    })

    it('does not render the favorite button when context lacks onFavoriteToggle', () => {
      const ctx = reactive({
        isFavorite: false,
        onEntityPageVisit: () => { },
      })

      mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      cy.getTestId('page-layout-favorite-button').should('not.exist')
    })

    it('renders the favorite button when both pageShortcutData and pageShortcutsContext are provided', () => {
      const ctx = reactive({
        isFavorite: false,
        onFavoriteToggle: () => { },
        onEntityPageVisit: () => { },
      })

      mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      cy.getTestId('page-layout-favorite-button')
        .should('be.visible')
        .and('have.attr', 'aria-label', 'Save page to shortcuts')
        .find('svg')
        .should('exist')
    })

    it('reflects isFavorite=true with the filled star icon', () => {
      const ctx = reactive({
        isFavorite: true,
        onFavoriteToggle: () => { },
        onEntityPageVisit: () => { },
      })

      mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      cy.getTestId('page-layout-favorite-button').should('have.class', 'active')
    })

    it('calls onFavoriteToggle when the favorite button is clicked', () => {
      const onFavoriteToggle = cy.stub().as('onFavoriteToggle')
      const ctx = reactive({
        isFavorite: false,
        onFavoriteToggle,
        onEntityPageVisit: () => { },
      })

      mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      cy.getTestId('page-layout-favorite-button').click()
      cy.get('@onFavoriteToggle').should('have.been.calledOnce')
      cy.get('@onFavoriteToggle').should('have.been.calledWith', validShortcutData)
    })

    it('calls onEntityPageVisit on mount with the provided pageShortcutData', () => {
      const onEntityPageVisit = cy.stub().as('onEntityPageVisit')
      const ctx = reactive({
        isFavorite: false,
        onFavoriteToggle: () => { },
        onEntityPageVisit,
      })

      mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      cy.get('@onEntityPageVisit').should('have.been.calledOnce')
      cy.get('@onEntityPageVisit').should('have.been.calledWith', validShortcutData)
    })

    it('calls onEntityPageVisit again when pageShortcutData changes', () => {
      const onEntityPageVisit = cy.stub().as('onEntityPageVisit')
      const ctx = reactive({
        isFavorite: false,
        onFavoriteToggle: () => { },
        onEntityPageVisit,
      })

      const data = ref<PageShortcutData>(validShortcutData)
      const Wrapper = defineComponent({
        setup() {
          return () => h(PageLayout, { title: 'Test Page Title', pageShortcutData: data.value })
        },
      })

      mountWithRouter(Wrapper, {
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      cy.get('@onEntityPageVisit').should('have.been.calledOnce')

      cy.then(() => {
        data.value = { ...validShortcutData, path: '/services/another', label: 'Another' }
      })

      cy.get('@onEntityPageVisit').should('have.been.calledTwice')
      cy.get('@onEntityPageVisit').should('have.been.calledWith', data.value)
    })

    it('does not call onEntityPageVisit when context is missing the callback', () => {
      const ctx = reactive({
        isFavorite: false,
        onFavoriteToggle: () => { },
      })

      // Should not throw despite the missing callback
      mountWithRouter(PageLayout, {
        props: { title: 'Test Page Title', pageShortcutData: validShortcutData },
        global: { provide: { 'app:pageShortcutsContext': ctx } },
      })

      cy.getTestId('page-layout-favorite-button').should('be.visible')
    })
  })
})
