import PageLayoutTabs from './PageLayoutTabs.vue'
import { defineComponent, h, ref, type Ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import type { PageLayoutTab } from '../types'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/tab', name: 'tab', component: { template: '<div />' } }],
})

describe('<PageLayoutTabs />', () => {
  it('renders tabs correctly', () => {
    const tabs = [
      { key: 'overview', label: 'Overview', to: '/overview' },
      { key: 'settings', label: 'Settings', to: '/settings' },
    ]

    cy.mount(PageLayoutTabs, {
      props: {
        tabs,
      },
    })

    cy.getTestId('page-layout-tabs').should('be.visible')
    cy.getTestId('page-layout-tab-overview')
      .should('be.visible')
      .and('contain.text', 'Overview')
      .and('have.attr', 'href', '/overview')
    cy.getTestId('page-layout-tab-settings')
      .should('be.visible')
      .and('contain.text', 'Settings')
      .and('have.attr', 'href', '/settings')
  })

  it('handles overflow correctly with overflowing tab showing in dropdown', () => {
    const tabs = [
      { key: 'tab1', label: 'Tab 1', to: '/tab1' },
      { key: 'tab2', label: 'Tab 2', to: '/tab2' },
      { key: 'tab3', label: 'Tab 3', to: '/tab3' },
      { key: 'tab4', label: 'Tab 4', to: '/tab4' },
      { key: 'tab5', label: 'Tab 5', to: '/tab5' },
      { key: 'tab6', label: 'Tab 6', to: '/tab6' },
      { key: 'tab7', label: 'Tab 7', to: '/tab7' },
      { key: 'tab8', label: 'Tab 8', to: '/tab8' },
    ]

    // Use a narrow viewport to trigger overflow
    cy.viewport(300, 400)

    cy.mount(PageLayoutTabs, {
      props: {
        tabs,
      },
    })

    cy.getTestId('page-layout-tabs').should('be.visible')

    // The "More" dropdown should be visible
    cy.getTestId('tabs-overflow-dropdown-button').should('be.visible')

    // Click the dropdown to reveal overflow items
    cy.getTestId('tabs-overflow-dropdown-button').click()

    // The last tab should be in the dropdown
    cy.getTestId('tabs-overflow-dropdown-popover')
      .findTestId('page-layout-tab-tab8')
      .should('be.visible')
      .and('have.attr', 'href', '/tab8')
  })

  it('recomputes the tab layout when the tabs prop changes', () => {
    const initialTabs = [
      { key: 'tab1', label: 'Tab 1', to: '/tab1' },
      { key: 'tab2', label: 'Tab 2', to: '/tab2' },
    ]

    const manyTabs = [
      { key: 'tab1', label: 'Tab 1', to: '/tab1' },
      { key: 'tab2', label: 'Tab 2', to: '/tab2' },
      { key: 'tab3', label: 'Tab 3', to: '/tab3' },
      { key: 'tab4', label: 'Tab 4', to: '/tab4' },
      { key: 'tab5', label: 'Tab 5', to: '/tab5' },
      { key: 'tab6', label: 'Tab 6', to: '/tab6' },
      { key: 'tab7', label: 'Tab 7', to: '/tab7' },
      { key: 'tab8', label: 'Tab 8', to: '/tab8' },
    ]

    cy.viewport(300, 400)

    let vueWrapper: { setProps: (props: Record<string, unknown>) => Promise<void> }

    cy.mount(PageLayoutTabs, {
      props: {
        tabs: initialTabs,
      },
    }).then(({ wrapper }) => {
      vueWrapper = wrapper
    })

    cy.getTestId('tabs-overflow-dropdown-button').should('not.exist')

    cy.then(() => vueWrapper.setProps({ tabs: manyTabs }))

    cy.getTestId('tabs-overflow-dropdown-button').should('be.visible')
  })

  it('recomputes the tab layout when tabs are pushed into the existing array', () => {
    const initialTabs: PageLayoutTab[] = [
      { key: 'tab1', label: 'Tab 1', to: '/tab1' },
      { key: 'tab2', label: 'Tab 2', to: '/tab2' },
    ]

    const tabsToAppend: PageLayoutTab[] = [
      { key: 'tab3', label: 'Tab 3', to: '/tab3' },
      { key: 'tab4', label: 'Tab 4', to: '/tab4' },
      { key: 'tab5', label: 'Tab 5', to: '/tab5' },
      { key: 'tab6', label: 'Tab 6', to: '/tab6' },
      { key: 'tab7', label: 'Tab 7', to: '/tab7' },
      { key: 'tab8', label: 'Tab 8', to: '/tab8' },
    ]

    cy.viewport(300, 400)

    const tabsRef: Ref<PageLayoutTab[]> = ref([...initialTabs])

    cy.mount(defineComponent({
      setup: () => () => h(PageLayoutTabs, { tabs: tabsRef.value }),
    }))

    cy.getTestId('tabs-overflow-dropdown-button').should('not.exist')

    cy.then(() => {
      tabsRef.value.push(...tabsToAppend)
    })

    cy.getTestId('tabs-overflow-dropdown-button').should('be.visible')
  })

  it('uses the navigateTo injectable to navigate to the tab', () => {
    const navigateToStub = cy.stub().as('navigateTo')

    const tabs = [
      { key: 'tab', label: 'Tab', to: '/tab' },
    ]

    cy.mount(PageLayoutTabs, {
      props: {
        tabs,
      },
      global: {
        provide: {
          'app:navigateTo': navigateToStub,
        },
      },
    })

    cy.getTestId('page-layout-tab-tab').click()

    cy.get('@navigateTo').should('have.been.calledWith', tabs[0].to)
  })

  it('does not use the navigateTo injectable if the tab.to is not a string', () => {
    const navigateToStub = cy.stub().as('navigateTo')

    const tabs = [
      { key: 'tab', label: 'Tab', to: { name: 'tab' } },
    ]

    cy.mount(PageLayoutTabs, {
      props: {
        tabs,
      },
      global: {
        plugins: [router],
        provide: {
          'app:navigateTo': navigateToStub,
        },
      },
    })

    cy.getTestId('page-layout-tab-tab').click()

    cy.get('@navigateTo').should('not.have.been.called')
  })

  it('uses the navigateTo injectable to navigate to the tab on Enter key press', () => {
    const navigateToStub = cy.stub().as('navigateTo')

    const tabs = [
      { key: 'tab', label: 'Tab', to: '/tab' },
    ]

    cy.mount(PageLayoutTabs, {
      props: {
        tabs,
      },
      global: {
        provide: {
          'app:navigateTo': navigateToStub,
        },
      },
    })

    cy.getTestId('page-layout-tab-tab').trigger('keydown', { key: 'Enter' })

    cy.get('@navigateTo').should('have.been.calledWith', tabs[0].to)
  })

  it('uses the navigateTo injectable to navigate to the tab on Space key press', () => {
    const navigateToStub = cy.stub().as('navigateTo')

    const tabs = [
      { key: 'tab', label: 'Tab', to: '/tab' },
    ]

    cy.mount(PageLayoutTabs, {
      props: {
        tabs,
      },
      global: {
        provide: {
          'app:navigateTo': navigateToStub,
        },
      },
    })

    cy.getTestId('page-layout-tab-tab').trigger('keydown', { key: ' ' })

    cy.get('@navigateTo').should('have.been.calledWith', tabs[0].to)
  })

  it('does not use the navigateTo injectable if the tab.to is not a string on Enter key press', () => {
    const navigateToStub = cy.stub().as('navigateTo')

    const tabs = [
      { key: 'tab', label: 'Tab', to: { name: 'tab' } },
    ]

    cy.mount(PageLayoutTabs, {
      props: {
        tabs,
      },
      global: {
        plugins: [router],
        provide: {
          'app:navigateTo': navigateToStub,
        },
      },
    })

    cy.getTestId('page-layout-tab-tab').trigger('keydown', { key: 'Enter' })

    cy.get('@navigateTo').should('not.have.been.called')
    cy.wrap(router).its('currentRoute').its('value').its('name').should('eq', 'tab')
  })

  it('does not use the navigateTo injectable if the tab.to is not a string on Space key press', () => {
    const navigateToStub = cy.stub().as('navigateTo')

    const tabs = [
      { key: 'tab', label: 'Tab', to: { name: 'tab' } },
    ]

    cy.mount(PageLayoutTabs, {
      props: {
        tabs,
      },
      global: {
        plugins: [router],
        provide: {
          'app:navigateTo': navigateToStub,
        },
      },
    })

    cy.getTestId('page-layout-tab-tab').trigger('keydown', { key: ' ' })

    cy.get('@navigateTo').should('not.have.been.called')
    cy.wrap(router).its('currentRoute').its('value').its('name').should('eq', 'tab')
  })
})
