// Cypress component test spec file

import SplitPane from './SplitPane.vue'

describe('<SplitPane />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(SplitPane)

    cy.get('.kong-ui-public-split-pane').should('be.visible')
  })
})
