import PageLayoutTabs from './PageLayoutTabs.vue'

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
    cy.getTestId('overview-tab-link')
      .should('be.visible')
      .and('contain.text', 'Overview')
      .and('have.attr', 'href', '/overview')
    cy.getTestId('settings-tab-link')
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
      .findTestId('tab8-tab-link')
      .should('be.visible')
      .and('have.attr', 'href', '/tab8')
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

    cy.getTestId('tab-tab-link').click()

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
        provide: {
          'app:navigateTo': navigateToStub,
        },
      },
    })

    cy.getTestId('tab-tab-link').click()

    cy.get('@navigateTo').should('not.have.been.called')
  })
})
