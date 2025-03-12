// Cypress component test spec file

import PubsubTest from './PubsubTest.vue'

describe('<PubsubTest />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(PubsubTest)

    cy.get('.kong-ui-public-pubsub-test').should('be.visible')
  })
})
