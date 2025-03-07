// Cypress component test spec file

import TestPublishing1 from './TestPublishing1.vue'

describe('<TestPublishing1 />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(TestPublishing1)

    cy.get('.kong-ui-public-test-publishing-1').should('be.visible')
  })
})
