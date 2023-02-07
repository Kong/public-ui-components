// Cypress component test spec file

import MetricCardContainer from './MetricCardContainer.vue'
// import { mount } from 'cypress/vue'

const cards = [
  {
    currentValue: 192895156,
    previousValue: 236609609,
    title: 'Traffic',
    subtitle: 'Number of Requests',
    increaseIsBad: false,
    cardSize: 'lg',
  },
  {
    currentValue: 31.076361502825918,
    previousValue: 30.59477013885772,
    title: 'Errors',
    subtitle: 'Average Error Rate',
    increaseIsBad: true,
    cardSize: 'lg',
  },
  {
    currentValue: 335,
    previousValue: 511,
    title: 'Latency',
    subtitle: 'P99 Latency',
    increaseIsBad: true,
    cardSize: 'lg',
  },
  {
    currentValue: 4,
    previousValue: 4,
    title: 'Runtimes',
    subtitle: 'Active Runtime Groups',
    increaseIsBad: true,
    cardSize: 'lg',
  },
]

const container = '.kong-ui-public-metric-cards'

describe('<MetricCardContainer />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(MetricCardContainer, {
      props: {
        cards,
        loading: false,
        hasTrendAccess: true,
        fallbackDisplayText: 'Not available',
      },
    })

    cy.get(container).should('be.visible')

    // Desktop (horiztonal layout)
    cy.viewport(1280, 400)
    cy.get(container).should('be.visible')
    cy.get(container)
      .should('have.css', 'flex-direction', 'row')

    // Mobile (vertical layout)
    cy.viewport(480, 1200)
    cy.get(container).should('be.visible')
    cy.get(container)
      .should('have.css', 'flex-direction', 'column')

  })
})
