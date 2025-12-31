// Cypress component test spec file

import VisualEditor from './VisualEditor.vue'

describe('<VisualEditor />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(VisualEditor)

    cy.get('.kong-ui-public-visual-editor').should('be.visible')
  })
})
