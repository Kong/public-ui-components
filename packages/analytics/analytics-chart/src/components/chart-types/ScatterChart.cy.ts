import type { KChartData } from '../../types'

import ScatterChart from './ScatterChart.vue'

const START = new Date('2024-06-16T00:00:00.000Z').valueOf()
const HOUR_MS = 60 * 60 * 1000

const points = (count: number, valueAt: (i: number) => number) =>
  Array.from({ length: count }, (_, i) => ({ x: START + i * HOUR_MS, y: valueAt(i) }))

const mockChartData: KChartData = {
  datasets: [
    {
      type: 'scatter',
      label: 'Turn',
      data: points(20, i => i + 1),
      backgroundColor: '#6f7787',
      borderColor: '#6f7787',
      showLine: false,
      rawDimension: 'Turn',
    },
  ],
} as KChartData

const withOutliersAndLines: KChartData = {
  outlierValue: 18,
  datasets: [
    ...mockChartData.datasets,
    {
      type: 'scatter',
      label: 'Outlier (> p95)',
      data: points(2, i => 19 + i).map(point => ({ ...point, tooltipLabel: 'Turn (outlier > p95)' })),
      backgroundColor: '#d44324',
      borderColor: '#d44324',
      showLine: false,
      rawDimension: 'outlier',
    },
    {
      type: 'line',
      label: 'Median',
      data: [{ x: START, y: 10 }, { x: START + 20 * HOUR_MS, y: 10 }],
      borderColor: '#000000',
      backgroundColor: '#000000',
      borderDash: [6, 4],
      pointRadius: 0,
      total: 10,
      rawDimension: 'percentile-50',
    },
  ],
} as KChartData

const sweepOverChart = (x1: number, y1: number, x2: number, y2: number, steps = 5) => {
  const dx = (x2 - x1) / steps
  const dy = (y2 - y1) / steps

  for (let step = 0; step <= steps; step++) {
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(50)
    cy.get('.chart-container > canvas').trigger('mousemove', x1 + dx * step, y1 + dy * step)
  }
}

const mountScatterChart = (props: Record<string, any> = {}) => {
  return cy.mount(ScatterChart, {
    props: {
      chartData: mockChartData,
      granularity: 'hourly',
      tooltipTitle: 'Turn cost',
      ...props,
    },
  })
}

describe('<ScatterChart />', () => {
  beforeEach(() => {
    cy.viewport(600, 400)
  })

  it('renders the canvas', () => {
    mountScatterChart()
    cy.get('[data-testid="scatter-chart"]').should('be.visible')
  })

  it('renders a legend entry per dataset', () => {
    mountScatterChart({ chartData: withOutliersAndLines })
    cy.get('[data-testid="legend"] li').should('have.length', 3)
  })

  it('keeps dataset order in the legend rather than sorting by value', () => {
    mountScatterChart({ chartData: withOutliersAndLines })
    cy.get('[data-testid="legend"] li').eq(0).should('contain.text', 'Turn')
    cy.get('[data-testid="legend"] li').eq(1).should('contain.text', 'Outlier')
    cy.get('[data-testid="legend"] li').eq(2).should('contain.text', 'Median')
  })

  it('hides the legend when the position is hidden', () => {
    cy.mount(ScatterChart, {
      props: {
        chartData: mockChartData,
        granularity: 'hourly',
        tooltipTitle: 'Turn cost',
      },
      global: {
        provide: { legendPosition: 'hidden' },
      },
    })
    cy.get('[data-testid="legend"] li').should('not.exist')
  })

  it('toggles a dataset when its legend entry is clicked', () => {
    mountScatterChart({ chartData: withOutliersAndLines })
    cy.get('[data-testid="legend"] li').eq(1).click()
    cy.get('[data-testid="legend"] li').eq(1).find('.label-container').should('have.class', 'strike-through')
  })

  it('renders with no data without erroring', () => {
    mountScatterChart({ chartData: { datasets: [] } })
    cy.get('[data-testid="scatter-chart"]').should('be.visible')
    cy.get('[data-testid="legend"] li').should('not.exist')
  })

  it('shows the nearest point in a tooltip on hover', () => {
    mountScatterChart()
    cy.get('.tooltip-container').should('not.exist')
    sweepOverChart(200, 40, 300, 90)
    cy.get('.tooltip-container').should('exist')
    cy.get('.tooltip-container .display-label').should('contain.text', 'Turn')
  })

  it('reports a single nearest point rather than a whole index', () => {
    mountScatterChart({ chartData: withOutliersAndLines })
    sweepOverChart(200, 40, 300, 90)
    cy.get('.tooltip-container .display-label').should('have.length', 1)
  })

  it('names the source series in the tooltip for an outlier point', () => {
    mountScatterChart({ chartData: withOutliersAndLines })
    sweepOverChart(60, 20, 80, 30)
    cy.get('.tooltip-container .display-label').should('have.text', 'Turn (outlier > p95)')
  })

  it('hides the tooltip when the cursor leaves the chart', () => {
    mountScatterChart()
    sweepOverChart(200, 40, 300, 90)
    cy.get('.tooltip-container').should('exist')
    cy.get('.chart-container > canvas').trigger('mouseout')
    cy.get('.tooltip-container').should('not.exist')
  })
})
