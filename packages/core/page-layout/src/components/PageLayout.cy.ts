import { defineComponent, inject, h, ref } from 'vue'
import PageLayout from './PageLayout.vue'
import { nestedPageLayoutInjectionKey } from '../symbols'

describe('<PageLayout />', () => {
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

    cy.mount(PageLayout, {
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

    cy.mount(PageLayout, {
      props: {
        title: 'Test Page Title',
        backTo,
      },
    })

    cy.getTestId('page-layout-navigate-back').should('be.visible').should('have.attr', 'href', backTo)
  })

  it('renders only the title when neither breadcrumbs nor tabs are passed', () => {
    const title = 'Test Page Title'

    cy.mount(PageLayout, {
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

    cy.mount(PageLayout, {
      props: { title: 'Test Page Title' },
      slots: { actions: () => h('div', { 'data-testid': actionsTestId }, actionsText) },
    })

    cy.getTestId(actionsTestId).should('be.visible').and('contain.text', actionsText)
  })

  it('renders content passed in through title-after slot', () => {
    const titleAfterTestId = 'page-layout-slotted-title-after'
    const titleAfterText = 'Title after'

    cy.mount(PageLayout, {
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

      cy.mount(PageLayout, {
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

      cy.mount(PageLayout, {
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

      cy.mount(Wrapper)

      // Child is mounted — parent header should be hidden, child header visible
      cy.getTestId('page-layout-title').should('have.length', 1).and('contain.text', childTitle)

      // Unmount the child
      cy.then(() => {
        showChild.value = false
      })

      // Parent header should reappear
      cy.getTestId('page-layout-title').should('have.length', 1).and('contain.text', parentTitle)
    })

    it('hides the parent header when a nested PageLayout is slotted', () => {
      const parentTitle = 'Parent Title'
      const childTitle = 'Child Title'

      cy.mount(PageLayout, {
        props: { title: parentTitle },
        slots: { default: () => h(PageLayout, { title: childTitle }) },
      })

      cy.getTestId('page-layout-title').should('have.length', 1).and('contain.text', childTitle)
      cy.getTestId('page-layout-breadcrumbs').should('not.exist')
      cy.getTestId('page-layout-tabs').should('not.exist')
    })
  })
})
