// Cypress component test spec file

import Labels from './Labels.vue'

describe('<Labels />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(Labels)

    cy.get('.kong-ui-public-labels').should('be.visible')
  })
})
