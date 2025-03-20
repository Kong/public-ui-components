// Cypress component test spec file

import TestPublishTag from './TestPublishTag.vue'

describe('<TestPublishTag />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(TestPublishTag)

    cy.get('.kong-ui-public-test-publish-tag').should('be.visible')
  })
})
