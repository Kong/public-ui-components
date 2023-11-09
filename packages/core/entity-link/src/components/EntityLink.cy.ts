// Cypress component test spec file

import EntityLink from './EntityLink.vue'

describe('<EntityLink />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(EntityLink)

    cy.get('.kong-ui-public-entity-link').should('be.visible')
  })
})
