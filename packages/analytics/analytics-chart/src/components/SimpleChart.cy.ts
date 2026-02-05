// Cypress component test spec file
import { ChartLegendPosition } from '../enums/'
import SimpleChart from './SimpleChart.vue'
import { emptyExploreResult } from '../../fixtures/mockData'

const exploreResultTruncated = {
  data: [
    {
      timestamp: '2023-05-30T13:09:00.987Z',
      event: {
        StatusCode: '200',
        TotalRequests: 255.49999999999997,
      },
    },
    {
      timestamp: '2023-05-30T13:09:00.987Z',
      event: {
        StatusCode: '300',
        TotalRequests: 182.5,
      },
    },
  ],
  meta: {
    start: '2023-05-30T13:09:00.987Z',
    end: '2023-05-30T19:09:00.987Z',
    query_id: '12346',
    display: {
      StatusCode: { 200: { name: '200' }, 300: { name: '300' } },
    },
    metric_names: ['TotalRequests'],
    metric_units: {
      TotalRequests: 'requests',
    },
    granularity_ms: 3600000,
    truncated: false,
    limit: 10,
  },
}

describe('<SimpleChart />', () => {
  it('shows the empty state with no data', () => {
    cy.mount(SimpleChart, {
      props: {
        chartData: emptyExploreResult,
        chartOptions: {
          type: 'gauge',
          stacked: true,
          fill: false,
        },
      },
    })

    cy.get('[data-testid="no-data-in-report"]').should('be.visible')
  })

  it('renders a Gauge with both metric value and total text below', () => {
    cy.mount(SimpleChart, {
      props: {
        chartData: exploreResultTruncated,
        chartOptions: {
          type: 'gauge',
          metricDisplay: 'full',
        },
        legendPosition: ChartLegendPosition.Hidden,
      },
    })

    cy.get('[data-testid="gauge-chart-metric"]').should('be.visible')
    cy.get('[data-testid="gauge-chart-total"]').should('be.visible')
  })

  it('renders a Gauge with only the large metric value', () => {
    cy.mount(SimpleChart, {
      props: {
        chartData: exploreResultTruncated,
        chartOptions: {
          type: 'gauge',
          metricDisplay: 'single',
        },
        legendPosition: ChartLegendPosition.Hidden,
      },
    })

    cy.get('[data-testid="gauge-chart-metric"]').should('be.visible')
    cy.get('[data-testid="gauge-chart-total"]').should('not.exist')
  })

  it('renders a Gauge with no text', () => {
    cy.mount(SimpleChart, {
      props: {
        chartData: exploreResultTruncated,
        chartOptions: {
          type: 'gauge',
          metricDisplay: 'hidden',
        },
        legendPosition: ChartLegendPosition.Hidden,
      },
    })

    cy.get('[data-testid="gauge-chart-metric"]').should('not.exist')
    cy.get('[data-testid="gauge-chart-total"]').should('not.exist')
  })

  it('renders Single Value chart', () => {
    cy.mount(SimpleChart, {
      props: {
        chartData: exploreResultTruncated,
        chartOptions: {
          type: 'single_value',
        },
      },
    })

    const value = parseFloat(exploreResultTruncated.data[0].event.TotalRequests.toFixed(2))

    cy.getTestId('single-value-chart').should('be.visible')
    cy.getTestId('single-value-chart').contains(value)
  })

  it('Single Value displays empty when value is `null`', () => {
    const faultyExploreResult = { ...exploreResultTruncated }
    // @ts-ignore - this is a test
    faultyExploreResult.data[0].event.TotalRequests = null

    cy.mount(SimpleChart, {
      props: {
        chartData: faultyExploreResult,
        chartOptions: {
          type: 'single_value',
        },
      },
    })

    cy.getTestId('single-value-chart').should('not.exist')
    cy.getTestId('no-data-in-report').should('be.visible')
  })

  it('Single Value displays error when value is not a number', () => {
    const faultyExploreResult = { ...exploreResultTruncated }
    // @ts-ignore - this is a test
    faultyExploreResult.data[0].event.TotalRequests = 'not a number'

    cy.mount(SimpleChart, {
      props: {
        chartData: faultyExploreResult,
        chartOptions: {
          type: 'single_value',
        },
      },
    })

    cy.getTestId('single-value-chart').should('not.exist')
    cy.getTestId('single-value-error').should('be.visible')
  })

  it('displays correct number of decimal points', () => {
    const value = 255.0004
    const alteredExploreResult = { ...exploreResultTruncated }
    alteredExploreResult.data[0].event.TotalRequests = value

    cy.mount(SimpleChart, {
      props: {
        chartData: alteredExploreResult,
        chartOptions: {
          type: 'single_value',
          decimalPoints: 4,
        },
      },
    })

    cy.getTestId('single-value-chart').should('be.visible')
    cy.getTestId('single-value-chart').contains(value)
  })

  it('Single Value displays error when metric name is not provided', () => {
    const faultyExploreResult = { ...exploreResultTruncated }
    faultyExploreResult.meta.metric_names = []

    cy.mount(SimpleChart, {
      props: {
        chartData: faultyExploreResult,
        chartOptions: {
          type: 'single_value',
        },
      },
    })

    cy.getTestId('single-value-chart').should('not.exist')
    cy.getTestId('single-value-error').should('be.visible')
  })
})
