import { defineComponent, inject, h } from 'vue'
import PageLayout from './PageLayout.vue'
import { nestedPageLayoutInjectionKey } from '../symbols'

describe('<PageLayout />', () => {
  const title = 'Test Page Title'

  it('renders breadcrumbs, title and tabs when breadcrumbs and tabs are passed', () => {
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
    cy.getTestId('page-layout-tabs').should('be.visible')
  })

  it('renders only the title when neither breadcrumbs nor tabs are passed', () => {
    cy.mount(PageLayout, {
      props: {
        title,
      },
    })

    cy.getTestId('page-layout-breadcrumbs').should('not.exist')
    cy.getTestId('page-layout-title').should('be.visible').and('contain.text', title)
    cy.getTestId('page-layout-tabs').should('not.exist')
  })

  describe('nested PageLayout detection', () => {
    it('hides its own header when a nested PageLayout is detected', () => {
      // Simulate a child PageLayout by injecting a component that calls the registration callback
      const ChildNotifier = defineComponent({
        setup() {
          const notify = inject<() => void>(nestedPageLayoutInjectionKey)
          notify?.()
          return () => null
        },
      })

      cy.mount(PageLayout, {
        props: { title: 'Parent Title' },
        slots: { default: () => h(ChildNotifier) },
      })

      cy.getTestId('page-layout-title').should('not.exist')
      cy.getTestId('page-layout-breadcrumbs').should('not.exist')
      cy.getTestId('page-layout-tabs').should('not.exist')
    })

    it('calls the parent registration callback on mount when nested inside a parent PageLayout', () => {
      let notified = false

      cy.mount(PageLayout, {
        props: { title: 'Child Title' },
        global: {
          provide: {
            [nestedPageLayoutInjectionKey]: () => {
              notified = true
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
  })
})
