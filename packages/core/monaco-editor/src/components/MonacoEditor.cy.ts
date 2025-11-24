// Cypress component test spec file

import MonacoEditor from './MonacoEditor.vue'

describe('<MonacoEditor />', () => {
  it.skip('TODO: This is an example test', () => {
    cy.mount(MonacoEditor)

    cy.get('.kong-ui-public-monaco-editor').should('be.visible')
  })
})
