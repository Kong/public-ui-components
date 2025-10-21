// Cypress component test spec file

import AnalyticsEcharts from './AnalyticsEcharts.vue'

describe('<AnalyticsEcharts />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(AnalyticsEcharts)

    cy.get('.kong-ui-public-analytics-echarts').should('be.visible')
  })
})
