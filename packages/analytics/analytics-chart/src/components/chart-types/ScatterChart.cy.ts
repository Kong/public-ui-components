import type { KChartData } from '../../types'

import ScatterChart from './ScatterChart.vue'

const START = new Date('2024-06-16T00:00:00.000Z').valueOf()
const HOUR_MS = 60 * 60 * 1000

const points = (count: number, valueAt: (i: number) => number) =>
  Array.from({ length: count }, (_, i) => ({ x: START + i * HOUR_MS, y: valueAt(i) }))

const SERIES_COLOR = '#6f7787'
const OUTLIER_COLOR = '#d44324'
const OUTLIER_VALUE = 18

const mockChartData: KChartData = {
  datasets: [
    {
      type: 'scatter',
      label: 'Turn',
      data: points(20, i => i + 1),
      backgroundColor: SERIES_COLOR,
      borderColor: SERIES_COLOR,
      showLine: false,
      rawDimension: 'Turn',
    },
  ],
} as KChartData

const isOutlier = (raw: any): boolean => Number.isFinite(raw?.y) && raw.y > OUTLIER_VALUE

const withOutliersAndLines: KChartData = {
  outlier: { value: OUTLIER_VALUE, label: 'Outlier (> p95)', color: OUTLIER_COLOR },
  referenceLines: [
    { percentile: 50, label: 'Median', value: 10, color: '#000000', borderDash: [6, 4] },
    { percentile: 95, label: 'p95', value: OUTLIER_VALUE, color: OUTLIER_COLOR, borderDash: [2, 3] },
  ],
  datasets: [
    {
      type: 'scatter',
      label: 'Turn',
      data: points(20, i => i + 1),
      backgroundColor: (ctx: any) => isOutlier(ctx.raw) ? OUTLIER_COLOR : SERIES_COLOR,
      borderColor: (ctx: any) => isOutlier(ctx.raw) ? OUTLIER_COLOR : SERIES_COLOR,
      showLine: false,
      rawDimension: 'Turn',
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

  it('renders a legend entry per dataset, then a key per annotation', () => {
    mountScatterChart({ chartData: withOutliersAndLines })
    cy.get('[data-testid="legend"] li').should('have.length', 4)
    cy.get('[data-testid="legend"] li').eq(0).should('contain.text', 'Turn')
    cy.get('[data-testid="legend"] li').eq(1).should('contain.text', 'Outlier (> p95)')
    cy.get('[data-testid="legend"] li').eq(2).should('contain.text', 'Median')
    cy.get('[data-testid="legend"] li').eq(3).should('contain.text', 'p95')
  })

  it('shows the value each reference line sits at', () => {
    mountScatterChart({ chartData: withOutliersAndLines, metricUnit: 'usd' })
    cy.get('[data-testid="legend"] li').eq(2).should('contain.text', '$10.00')
    cy.get('[data-testid="legend"] li').eq(3).should('contain.text', '$18.00')
  })

  it('marks a reference line in the legend with the dash pattern it is drawn in', () => {
    mountScatterChart({ chartData: withOutliersAndLines })
    cy.get('[data-testid="legend"] li').eq(2).find('line').should('have.attr', 'stroke-dasharray', '6 4')
    cy.get('[data-testid="legend"] li').eq(3).find('line').should('have.attr', 'stroke-dasharray', '2 3')
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
    cy.get('[data-testid="legend"] li').eq(0).click()
    cy.get('[data-testid="legend"] li').eq(0).find('.label-container').should('have.class', 'strike-through')
  })

  it('does not toggle anything when a key is clicked', () => {
    mountScatterChart({ chartData: withOutliersAndLines })
    cy.get('[data-testid="legend"] li').eq(1).click()
    cy.get('[data-testid="legend"] li').eq(1).find('.label-container').should('not.have.class', 'strike-through')
    cy.get('[data-testid="legend"] li').eq(0).find('.label-container').should('not.have.class', 'strike-through')
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

  it('names the series an outlier belongs to, and marks it in the outlier color', () => {
    mountScatterChart({ chartData: withOutliersAndLines })
    // The highest values sit at the right of this fixture, above the outlier threshold
    sweepOverChart(540, 20, 580, 40)
    cy.get('.tooltip-container .display-label').should('have.text', 'Turn')
    cy.get('.tooltip-container .square-marker').should('have.css', 'background-color', 'rgb(212, 67, 36)')
  })

  it('marks a point below the threshold in its series color', () => {
    mountScatterChart({ chartData: withOutliersAndLines })
    sweepOverChart(200, 40, 300, 90)
    cy.get('.tooltip-container .square-marker').should('have.css', 'background-color', 'rgb(111, 119, 135)')
  })

  it('hides the tooltip when the cursor leaves the chart', () => {
    mountScatterChart()
    sweepOverChart(200, 40, 300, 90)
    cy.get('.tooltip-container').should('exist')
    cy.get('.chart-container > canvas').trigger('mouseout')
    cy.get('.tooltip-container').should('not.exist')
  })
})
