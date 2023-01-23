// Cypress component test spec file

import AppLayout from './AppLayout.vue'

describe.skip('<AppLayout />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(AppLayout)

    cy.get('.kong-ui-app-layout').should('be.visible')
  })
})
