// Cypress component test spec file

import SankeyChart from './SankeyChart.vue'
import type { SankeyLink, SankeyNode } from '../../types/index.ts'

const nodes: SankeyNode[] = [
  { id: 'model:gpt-5', name: 'gpt-5' },
  { id: 'model:claude', name: 'claude' },
  { id: 'consumer:alex', name: 'alex@example.com' },
  { id: 'consumer:sam', name: 'sam@example.com' },
]

const links: SankeyLink[] = [
  { source: 'model:gpt-5', target: 'consumer:alex', value: 300 },
  { source: 'model:gpt-5', target: 'consumer:sam', value: 100 },
  { source: 'model:claude', target: 'consumer:alex', value: 150 },
]

describe('<SankeyChart />', () => {
  beforeEach(() => {
    cy.viewport(600, 400)
  })

  it('paints the nodes and links on the canvas', () => {
    cy.mount(SankeyChart, { props: { nodes, links, seriesName: 'Requests' } })

    // Unlike the vitest specs (which stub the canvas 2d context in jsdom),
    // assert in a real browser that ECharts actually painted the chart
    cy.get('.kong-ui-public-echarts canvas').first().should((canvas) => {
      const el = canvas.get(0) as HTMLCanvasElement
      const ctx = el.getContext('2d')

      expect(ctx, 'canvas 2d context').to.not.equal(null)

      const { data: pixels } = (ctx as CanvasRenderingContext2D).getImageData(0, 0, el.width, el.height)

      expect(pixels.some((value) => value !== 0), 'canvas has painted pixels').to.equal(true)
    })
  })

  it('renders an empty chart without data props', () => {
    cy.mount(SankeyChart)

    // No canvas here: ECharts only adds one once there's something to draw
    cy.get('.kong-ui-public-echarts [_echarts_instance_]').should('be.visible')
  })

  it('forwards attrs to the underlying chart', () => {
    cy.mount(SankeyChart, {
      props: { nodes, links },
      attrs: { 'data-testid': 'my-sankey' },
    })

    cy.get('[data-testid="my-sankey"]').should('exist')
  })
})
