// Cypress component test spec file

import MonacoEditor from './MonacoEditor.vue'

describe('<MonacoEditor />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(MonacoEditor)

    cy.get('.kong-ui-public-monaco-editor-ui').should('be.visible')
  })
})
