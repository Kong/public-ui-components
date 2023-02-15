// Cypress component test spec file

import MetricCardContainer from './MetricCardContainer.vue'
import { DECIMAL_DISPLAY } from '../utilities'

const cards = [
  {
    currentValue: 192895156,
    previousValue: 236609609,
    title: 'Number of Requests',
    increaseIsBad: false,
  },
  {
    currentValue: 31.076361502825918,
    previousValue: 30.59477013885772,
    formatValueFn: val => `${val.toFixed(DECIMAL_DISPLAY)}%`,
    title: 'Average Error Rate',
    increaseIsBad: true,
  },
  {
    currentValue: 335,
    previousValue: 511,
    formatValueFn: val => `${val}ms`,
    title: 'P99 Latency',
    increaseIsBad: true,
  },
  {
    currentValue: 4,
    previousValue: 4,
    title: 'Active Runtime Groups',
    increaseIsBad: true,
  },
]

const container = '.kong-ui-public-metric-cards'

describe('<MetricCardContainer />', () => {
  it('layout updates on desktop vs mobile ', () => {
    cy.mount(MetricCardContainer, {
      props: {
        cards,
        cardSize: 'lg',
        fallbackDisplayText: 'Not available',
        hasTrendAccess: true,
        loading: false,
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

  // Card size is Large, so trend should be visible
  it('Small card size hides the trend value and icon', () => {
    cy.mount(MetricCardContainer, {
      props: {
        cards,
        cardSize: 'ms',
        hasTrendAccess: true,
        loading: false,
      },
    })

    cy.get(container).should('be.visible')

    // Desktop (horiztonal layout)
    cy.viewport(1280, 400)
    cy.get(container).should('be.visible')

  })
})
