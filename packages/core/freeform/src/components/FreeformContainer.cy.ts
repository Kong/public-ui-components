// Cypress component test spec file

import FreeformContainer from './FreeformContainer.vue'

describe('<FreeformContainer />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(FreeformContainer)

    cy.get('.kong-ui-public-freeform').should('be.visible')
  })
})
