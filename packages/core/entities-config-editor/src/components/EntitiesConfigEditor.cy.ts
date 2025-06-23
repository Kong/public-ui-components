// Cypress component test spec file

import EntitiesConfigEditor from './EntitiesConfigEditor.vue'

describe('<EntitiesConfigEditor />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(EntitiesConfigEditor)

    cy.get('.kong-ui-public-entities-config-editor').should('be.visible')
  })
})
