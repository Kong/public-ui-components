// Cypress component test spec file

import Documentation from './Documentation.vue'

describe('<Documentation />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(Documentation)

    cy.get('.kong-ui-public-documentation').should('be.visible')
  })
})
