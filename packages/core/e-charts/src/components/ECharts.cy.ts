// Cypress component test spec file

import ECharts from './ECharts.vue'

describe('<ECharts />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(ECharts)

    cy.get('.kong-ui-public-e-charts').should('be.visible')
  })
})
