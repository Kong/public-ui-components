// Cypress component test spec file

import ConfigEditor from './ConfigEditor.vue'

describe('<ConfigEditor />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(ConfigEditor)

    cy.get('.kong-ui-public-config-editor').should('be.visible')
  })
})
