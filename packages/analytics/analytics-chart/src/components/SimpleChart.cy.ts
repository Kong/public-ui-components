// Cypress component test spec file
import { ChartMetricDisplay, ChartLegendPosition, ChartTypesSimple } from '../enums/'
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
    start_ms: 1685452140.987,
    end_ms: 1685473740.987,
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
          type: ChartTypesSimple.GAUGE,
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
          type: ChartTypesSimple.GAUGE,
          metricDisplay: ChartMetricDisplay.Full,
        },
        legendPosition: ChartLegendPosition.Hidden,
      },
    })

    cy.get('[data-testid="doughnut-chart-metric"]').should('be.visible')
    cy.get('[data-testid="doughnut-chart-total"]').should('be.visible')
  })

  it('renders a Gauge with only the large metric value', () => {
    cy.mount(SimpleChart, {
      props: {
        chartData: exploreResultTruncated,
        chartOptions: {
          type: ChartTypesSimple.GAUGE,
          metricDisplay: ChartMetricDisplay.SingleMetric,
        },
        legendPosition: ChartLegendPosition.Hidden,
      },
    })

    cy.get('[data-testid="doughnut-chart-metric"]').should('be.visible')
    cy.get('[data-testid="doughnut-chart-total"]').should('not.exist')
  })

  it('renders a Gauge with no text', () => {
    cy.mount(SimpleChart, {
      props: {
        chartData: exploreResultTruncated,
        chartOptions: {
          type: ChartTypesSimple.GAUGE,
          metricDisplay: ChartMetricDisplay.Hidden,
        },
        legendPosition: ChartLegendPosition.Hidden,
      },
    })

    cy.get('[data-testid="doughnut-chart-metric"]').should('not.exist')
    cy.get('[data-testid="doughnut-chart-total"]').should('not.exist')
  })
})
