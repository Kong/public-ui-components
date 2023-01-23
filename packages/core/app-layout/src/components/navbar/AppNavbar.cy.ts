// Cypress component test spec file

import AppNavbar from './AppNavbar.vue'

describe.skip('<AppNavbar />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(AppNavbar)

    cy.get('.kong-ui-app-navbar').should('be.visible')
  })
})
