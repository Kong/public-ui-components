// Cypress component test spec file

import PageLayout from './PageLayout.vue'

describe('<PageLayout />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(PageLayout)

    cy.get('.kong-ui-public-page-layout').should('be.visible')
  })
})
