// Cypress component test spec file
import LabelList from './LabelList.vue'

describe('<LabelList />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(LabelList)

    cy.get('.kong-ui-public-label').should('be.visible')
  })
})
