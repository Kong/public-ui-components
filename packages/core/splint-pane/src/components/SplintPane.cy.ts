// Cypress component test spec file

import SplintPane from './SplintPane.vue'

describe('<SplintPane />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(SplintPane)

    cy.get('.kong-ui-public-splint-pane').should('be.visible')
  })
})
