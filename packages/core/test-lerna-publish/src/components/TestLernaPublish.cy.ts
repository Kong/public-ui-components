// Cypress component test spec file

import TestLernaPublish from './TestLernaPublish.vue'

describe('<TestLernaPublish />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(TestLernaPublish)

    cy.get('.kong-ui-public-test-lerna-publish').should('be.visible')
  })
})
