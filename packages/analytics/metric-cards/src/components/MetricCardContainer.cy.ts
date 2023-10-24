// Cypress component test spec file

import MetricCardContainer from './MetricCardContainer.vue'
import { DECIMAL_DISPLAY } from '../utilities'
import { MetricCardSize, MetricCardType } from '../enums'

const cards = [
  {
    cardType: MetricCardType.TRAFFIC,
    currentValue: 192895156,
    previousValue: 236609609,
    title: 'Number of Requests',
    increaseIsBad: false,
  },
  {
    cardType: MetricCardType.ERROR_RATE,
    currentValue: 0.3014489796854011,
    previousValue: 0.29789116649461733,
    formatValueFn: (val: number) => `${val.toFixed(DECIMAL_DISPLAY)}%`,
    title: 'Average Error Rate',
    increaseIsBad: true,
  },
  {
    cardType: MetricCardType.LATENCY,
    currentValue: 335,
    previousValue: 511,
    formatValueFn: (val: number) => `${val}ms`,
    title: 'P99 Latency',
    increaseIsBad: true,
  },
  {
    cardType: MetricCardType.GENERIC_COUNT,
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

  // Should display down arrow icon, and green trend value text
  it('Upward trend displayed for diff above threshold', () => {
    cy.mount(MetricCardContainer, {
      props: {
        cards: [
          {
            cardType: MetricCardType.ERROR_RATE,
            currentValue: 0.3012,
            previousValue: 0.3013,
            formatValueFn: (val: number) => `${val.toFixed(DECIMAL_DISPLAY)}%`,
            title: 'Average Error Rate',
            increaseIsBad: true,
          },
        ],
        cardSize: MetricCardSize.Large,
        hasTrendAccess: true,
        fallbackDisplayText: 'N/A',
        loading: false,
      },
    })

    cy.get(container).should('be.visible')

    // Desktop (horiztonal layout)
    cy.viewport(1280, 400)
    cy.get(container).should('be.visible')

    // Check for upward trend, non-zero value
    cy.getTestId('metric-trend-parent').should('have.class', 'positive')
    cy.getTestId('metric-trend-parent').should('contain', '0.03%')
  })

  // Should display no icon, and gray trend value text
  it('Neutral trend displayed for diff below threshold', () => {
    cy.mount(MetricCardContainer, {
      props: {
        cards: [
          {
            cardType: MetricCardType.ERROR_RATE,
            currentValue: 0.30171,
            previousValue: 0.3017,
            formatValueFn: (val: number) => `${val.toFixed(DECIMAL_DISPLAY)}%`,
            title: 'Average Error Rate',
            increaseIsBad: true,
          },
        ],
        cardSize: MetricCardSize.Large,
        hasTrendAccess: true,
        fallbackDisplayText: 'N/A',
        loading: false,
      },
    })

    cy.get(container).should('be.visible')

    // Desktop (horiztonal layout)
    cy.viewport(1280, 400)
    cy.get(container).should('be.visible')

    // Check for neutral trend, zero value
    cy.getTestId('metric-trend-parent').should('have.class', 'neutral')
    cy.getTestId('metric-trend-parent').should('contain', '0.00%')
  })

  // Should use rounded approximate numbers by default.
  it('Values are approximate and rounded by default', () => {
    cy.mount(MetricCardContainer, {
      props: {
        cards: [
          {
            cardType: MetricCardType.TRAFFIC,
            currentValue: 1198904,
            previousValue: 1198904,
            title: 'Traffic',
            increaseIsBad: false,
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
    cy.getTestId('metric-trend-parent').should('have.class', 'neutral')
    cy.getTestId('metric-trend-parent').should('contain', '0.00%')

    // Check for approximate numbers.
    cy.getTestId('metric-value').should('contain', '1.2M')
  })

  it('Avoid divide-by-zero', () => {
    cy.mount(MetricCardContainer, {
      props: {
        cards: [
          {
            cardType: MetricCardType.TRAFFIC,
            currentValue: 1198904,
            previousValue: 0,
            title: 'Traffic',
            increaseIsBad: false,
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
    cy.getTestId('metric-trend-parent').should('have.class', 'neutral')
    cy.getTestId('metric-trend-parent').should('contain', '0.00%')
  })
})
