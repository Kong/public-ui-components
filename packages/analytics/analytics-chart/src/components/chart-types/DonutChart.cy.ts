import DonutChart from './DonutChart.vue'
import type { KChartData } from '../../types'

const mockChartData: KChartData = {
  datasets: [
    {
      label: '200',
      data: [52428, 38020],
      backgroundColor: '#0BB652',
      rawDimension: '200',
    },
    {
      label: '500',
      data: [12897, 9100],
      backgroundColor: '#FF4545',
      rawDimension: '500',
    },
  ],
  labels: ['2024-02-05T22:00:00.000Z', '2024-02-06T22:00:00.000Z'],
}

const mountDonutChart = (props: Record<string, any> = {}) => {
  return cy.mount(DonutChart, {
    props: {
      chartData: mockChartData,
      tooltipTitle: 'Requests',
      ...props,
    },
  })
}

describe('<DonutChart />', () => {
  beforeEach(() => {
    cy.viewport(600, 400)
  })

  describe('center metric', () => {
    it('does not show center metric by default', () => {
      mountDonutChart()
      cy.get('.chart-center-metric').should('not.exist')
    })

    it('does not show center metric when showCenterMetric is true but unit is non-summable', () => {
      mountDonutChart({ showCenterMetric: true, metricUnit: 'ms' })
      cy.get('.chart-center-metric').should('not.exist')
    })

    it('does not show center metric for bytes unit', () => {
      mountDonutChart({ showCenterMetric: true, metricUnit: 'bytes' })
      cy.get('.chart-center-metric').should('not.exist')
    })

    it('shows center metric when showCenterMetric is true and unit is count', () => {
      mountDonutChart({ showCenterMetric: true, metricUnit: 'count' })
      cy.get('.chart-center-metric').should('be.visible')
    })

    it('shows center metric for requests unit', () => {
      mountDonutChart({ showCenterMetric: true, metricUnit: 'requests' })
      cy.get('.chart-center-metric').should('be.visible')
    })

    it('shows center metric for usd unit', () => {
      mountDonutChart({ showCenterMetric: true, metricUnit: 'usd' })
      cy.get('.chart-center-metric').should('be.visible')
    })

    it('shows center metric for token count unit', () => {
      mountDonutChart({ showCenterMetric: true, metricUnit: 'token count' })
      cy.get('.chart-center-metric').should('be.visible')
    })
  })

  describe('grand total value', () => {
    it('sums all dataset values', () => {
      // datasets: [52428 + 38020] + [12897 + 9100] = 112445 → approx "112K"
      mountDonutChart({ showCenterMetric: true, metricUnit: 'count' })
      cy.get('.chart-center-total').should('be.visible').and('contain', 'K')
    })

    it('formats usd values with currency symbol', () => {
      mountDonutChart({ showCenterMetric: true, metricUnit: 'usd' })
      cy.get('.chart-center-total').should('contain', '$')
    })

    it('does not include unit text in the number for count', () => {
      mountDonutChart({ showCenterMetric: true, metricUnit: 'count' })
      cy.get('.chart-center-total').invoke('text').should('not.match', /requests/i)
    })

    it('does not include unit text in the number for token count', () => {
      mountDonutChart({ showCenterMetric: true, metricUnit: 'token count' })
      cy.get('.chart-center-total').invoke('text').should('not.match', /token/i)
    })
  })

  describe('center metric label', () => {
    it('shows metric display label using tooltipMetricDisplay', () => {
      mountDonutChart({
        showCenterMetric: true,
        metricUnit: 'count',
        tooltipMetricDisplay: 'Request count',
      })
      cy.get('.chart-center-unit').should('contain', 'Request count')
    })

    it('shows metric display label as-is without lowercasing', () => {
      mountDonutChart({
        showCenterMetric: true,
        metricUnit: 'usd',
        tooltipMetricDisplay: 'Costs',
      })
      cy.get('.chart-center-unit').should('contain', 'Costs')
    })

    it('does not show a label when tooltipMetricDisplay is empty', () => {
      mountDonutChart({
        showCenterMetric: true,
        metricUnit: 'count',
        tooltipMetricDisplay: '',
      })
      cy.get('.chart-center-unit').should('not.exist')
    })
  })

  describe('segment styling', () => {
    it('renders the chart canvas', () => {
      mountDonutChart()
      cy.get('canvas').should('be.visible')
    })
  })
})
