// Cypress component test spec file

import HeatmapChart from './HeatmapChart.vue'
import type { HeatmapDataPoint } from '../../types/index.ts'

const xAxisLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const yAxisLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const data: HeatmapDataPoint[] = [
  [0, 0, 12],
  [1, 1, 25],
  [2, 2, 47],
  [3, 3, 88],
  [4, 4, 65],
  [5, 5, 31],
  [0, 6, 54],
  [2, 6, 9],
]

const mountHeatmapChart = (props: Record<string, any> = {}) => {
  return cy.mount(HeatmapChart, {
    props: {
      data,
      xAxisLabels,
      yAxisLabels,
      seriesName: 'Token usage',
      ...props,
    },
  })
}

describe('<HeatmapChart />', () => {
  beforeEach(() => {
    cy.viewport(600, 400)
  })

  it('renders a visible canvas', () => {
    mountHeatmapChart()

    cy.get('.kong-ui-public-echarts canvas').should('be.visible')
  })

  it('paints the heatmap on the canvas', () => {
    mountHeatmapChart()

    // Unlike the vitest specs (which stub the canvas 2d context in jsdom),
    // assert in a real browser that ECharts actually painted the cells
    cy.get('.kong-ui-public-echarts canvas').first().should((canvas) => {
      const el = canvas.get(0) as HTMLCanvasElement
      const ctx = el.getContext('2d')

      expect(ctx, 'canvas 2d context').to.not.be.null

      const { data: pixels } = (ctx as CanvasRenderingContext2D).getImageData(0, 0, el.width, el.height)

      expect(pixels.some((value) => value !== 0), 'canvas has painted pixels').to.be.true
    })
  })

  it('renders an empty chart without data props', () => {
    cy.mount(HeatmapChart)

    cy.get('.kong-ui-public-echarts canvas').should('be.visible')
  })

  it('forwards attrs to the underlying chart', () => {
    cy.mount(HeatmapChart, {
      props: { data, xAxisLabels, yAxisLabels },
      attrs: { 'data-testid': 'my-heatmap' },
    })

    cy.get('[data-testid="my-heatmap"]').should('exist')
  })
})
