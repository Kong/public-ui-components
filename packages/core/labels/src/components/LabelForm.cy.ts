// Cypress component test spec file
import LabelForm from './LabelForm.vue'

describe('<LabelForm />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(LabelForm)

    cy.get('.kong-ui-public-label').should('be.visible')
  })
})
