// Cypress component test spec file

import TreeMapChart from './TreeMapChart.vue'
import type { TreeMapDataNode } from '../../types/index.ts'

const data: TreeMapDataNode[] = [
  {
    name: 'Gateways',
    children: [
      { name: 'us-east', value: 300 },
      { name: 'eu-west', value: 200 },
      { name: 'ap-south', value: 100 },
    ],
  },
  {
    name: 'Plugins',
    children: [
      { name: 'rate-limiting', value: 150 },
      { name: 'auth', value: 50 },
    ],
  },
  {
    name: 'Services',
    children: [
      { name: 'billing', value: 90 },
      { name: 'orders', value: 60 },
    ],
  },
]

const mountTreeMapChart = (props: Record<string, any> = {}) => {
  return cy.mount(TreeMapChart, {
    props: {
      data,
      seriesName: 'Resources',
      ...props,
    },
  })
}

const pixelSnapshot = (canvas: unknown): string => {
  const el = (canvas as HTMLCanvasElement[])[0] as HTMLCanvasElement
  const ctx = el.getContext('2d')

  expect(ctx, 'canvas 2d context').to.not.equal(null)

  const { data: pixels } = (ctx as CanvasRenderingContext2D).getImageData(0, 0, el.width, el.height)

  expect(pixels.some((value) => value !== 0), 'canvas has painted pixels').to.equal(true)

  return pixels.join(',')
}

describe('<TreeMapChart />', () => {
  beforeEach(() => {
    cy.viewport(600, 400)
  })

  it('renders a visible canvas', () => {
    mountTreeMapChart()

    cy.get('.kong-ui-public-echarts canvas').should('be.visible')
  })

  it('paints the treemap on the canvas', () => {
    mountTreeMapChart()

    // Unlike the vitest specs (which stub the canvas 2d context in jsdom),
    // assert in a real browser that ECharts actually painted the nodes
    cy.get('.kong-ui-public-echarts canvas').first().should((canvas) => {
      const el = canvas.get(0) as HTMLCanvasElement
      const ctx = el.getContext('2d')

      expect(ctx, 'canvas 2d context').to.not.equal(null)

      const { data: pixels } = (ctx as CanvasRenderingContext2D).getImageData(0, 0, el.width, el.height)

      expect(pixels.some((value) => value !== 0), 'canvas has painted pixels').to.equal(true)
    })
  })

  it('drills down into a node on click, keeping the canvas painted', () => {
    // Animation off so the pixel snapshots before/after the click are stable
    mountTreeMapChart({ leafDepth: 2, option: { animation: false } })

    let before = ''

    cy.get('.kong-ui-public-echarts canvas').first().should((canvas) => {
      before = pixelSnapshot(canvas)
    })

    // Click inside the largest group's area (groups are sorted largest first,
    // starting top-left), which zooms into it and shows the breadcrumb
    cy.get('.kong-ui-public-echarts canvas').first().click(200, 150)

    cy.get('.kong-ui-public-echarts canvas').first().should((canvas) => {
      const after = pixelSnapshot(canvas)

      expect(after, 'canvas changed after drilling down').to.not.equal(before)
    })
  })

  it('renders an empty chart without data props', () => {
    cy.mount(TreeMapChart)

    cy.get('.kong-ui-public-echarts canvas').should('be.visible')
  })

  it('forwards attrs to the underlying chart', () => {
    cy.mount(TreeMapChart, {
      props: { data },
      attrs: { 'data-testid': 'my-treemap' },
    })

    cy.get('[data-testid="my-treemap"]').should('exist')
  })
})
