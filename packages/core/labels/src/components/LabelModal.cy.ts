// Cypress component test spec file
import LabelModal from './LabelModal.vue'

describe('<LabelModal />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(LabelModal)

    cy.get('.kong-ui-public-label').should('be.visible')
  })
})
