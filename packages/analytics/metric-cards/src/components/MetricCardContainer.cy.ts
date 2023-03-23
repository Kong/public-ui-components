// Cypress component test spec file

import MetricCardContainer from './MetricCardContainer.vue'
import { DECIMAL_DISPLAY, metricChange } from '../utilities'
import { MetricCardSize } from '../constants'

const cards = [
  {
    currentValue: 192895156,
    previousValue: 236609609,
    title: 'Number of Requests',
    increaseIsBad: false,
  },
  {
    currentValue: 0.3014489796854011,
    previousValue: 0.29789116649461733,
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

const container = '.kong-ui-public-metric-card-container'

describe('<MetricCardContainer />', () => {
  it('layout updates on desktop vs mobile ', () => {
    cy.mount(MetricCardContainer, {
      props: {
        cards,
        cardSize: MetricCardSize.Large,
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
        cardSize: MetricCardSize.Small,
        hasTrendAccess: true,
        loading: false,
      },
    })

    cy.get(container).should('be.visible')

    // Desktop (horiztonal layout)
    cy.viewport(1280, 400)
    cy.get(container).should('be.visible')

  })

  // Should display up arrow icon, and green trend value text
  it('Upward trend displayed for diff above threshold', () => {
    cy.mount(MetricCardContainer, {
      props: {
        cards: [
          {
            currentValue: 0.3012,
            previousValue: 0.3013,
            formatValueFn: val => `${val.toFixed(DECIMAL_DISPLAY)}%`,
            formatChangeFn: val => `${metricChange(val * 100, true, 'N/A')}`,
            title: 'Average Error Rate',
            increaseIsBad: true,
          },
        ],
        cardSize: MetricCardSize.Large,
        hasTrendAccess: true,
        loading: false,
      },
    })

    cy.get(container).should('be.visible')

    // Desktop (horiztonal layout)
    cy.viewport(1280, 400)
    cy.get(container).should('be.visible')

    // Check for upward trend, non-zero value
    cy.get('.metricscard-value-trend').should('have.class', 'positive')
    cy.get('.metricscard-value-trend').should('not.contain', '0.00%')
  })

  // Should display no icon, and gray trend value text
  it('Neutral trend displayed for diff below threshold', () => {
    cy.mount(MetricCardContainer, {
      props: {
        cards: [
          {
            currentValue: 0.3017,
            previousValue: 0.3017,
            formatValueFn: val => `${val.toFixed(DECIMAL_DISPLAY)}%`,
            formatChangeFn: val => `${metricChange(val * 100, true, 'N/A')}`,
            title: 'Average Error Rate',
            increaseIsBad: true,
          },
        ],
        cardSize: MetricCardSize.Large,
        hasTrendAccess: true,
        loading: false,
      },
    })

    cy.get(container).should('be.visible')

    // Desktop (horiztonal layout)
    cy.viewport(1280, 400)
    cy.get(container).should('be.visible')

    // Check for neutral trend, zero value
    cy.get('.metricscard-value-trend').should('have.class', 'neutral')
    cy.get('.metricscard-value-trend').should('contain', '0.00%')
  })
})
