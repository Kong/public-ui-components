import TabsNavbar from './TabsNavbar.vue'

describe('<TabsNavbar />', () => {
  it('renders tabs correctly', () => {
    const tabs = {
      overview: { name: 'Overview', to: '/overview' },
      settings: { name: 'Settings', to: '/settings' },
    }

    cy.mount(TabsNavbar, {
      props: {
        tabs,
      },
    })

    cy.getTestId('kong-ui-public-tabs-navbar').should('be.visible')
    cy.getTestId('overview-tab-link').should('be.visible').and('contain.text', 'Overview')
    cy.getTestId('settings-tab-link').should('be.visible').and('contain.text', 'Settings')
  })

  it('handles overflow correctly with overflowing tab showing in dropdown', () => {
    const tabs = {
      tab1: { name: 'Tab 1', to: '/tab1' },
      tab2: { name: 'Tab 2', to: '/tab2' },
      tab3: { name: 'Tab 3', to: '/tab3' },
      tab4: { name: 'Tab 4', to: '/tab4' },
      tab5: { name: 'Tab 5', to: '/tab5' },
      tab6: { name: 'Tab 6', to: '/tab6' },
      tab7: { name: 'Tab 7', to: '/tab7' },
      tab8: { name: 'Tab 8', to: '/tab8' },
    }

    // Use a narrow viewport to trigger overflow
    cy.viewport(300, 400)

    cy.mount(TabsNavbar, {
      props: {
        tabs,
      },
    })

    cy.getTestId('kong-ui-public-tabs-navbar').should('be.visible')

    // The "More" dropdown should be visible
    cy.getTestId('tabs-navbar-more-dropdown-button').should('be.visible')

    // Click the dropdown to reveal overflow items
    cy.getTestId('tabs-navbar-more-dropdown-button').click()

    // The last tab should be in the dropdown
    cy.getTestId('tab8-tab-dropdown-item').should('be.visible')
  })
})
