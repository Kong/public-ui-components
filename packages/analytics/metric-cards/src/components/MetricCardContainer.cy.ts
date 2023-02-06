// Cypress component test spec file

import MetricCards from './MetricCards.vue'
import { mount } from 'cypress/vue'

describe('<MetricCards />', () => {
  it('TODO: This is an example test', () => {
    mount(MetricCards)

    cy.get('.kong-ui-public-metric-cards').should('be.visible')
  })
})
