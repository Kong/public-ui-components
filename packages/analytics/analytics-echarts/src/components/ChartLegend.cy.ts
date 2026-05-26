import type { ChartLegendItem } from '../types'
import ChartLegend from './ChartLegend.vue'

const createItems = ({ count, includeValues = false }: { count: number, includeValues?: boolean }): ChartLegendItem[] => {
  return Array.from({ length: count }, (_, index) => ({
    label: `Legend item ${index + 1}`,
    color: '#42a5f5',
    borderColor: '#42a5f5',
    value: includeValues ? {
      raw: index + 1,
      formatted: `${index + 1} requests`,
    } : undefined,
  }))
}

const mountLegend = ({
  items,
  showValues = false,
  maxHeight = '80px',
}: {
  items: ChartLegendItem[]
  showValues?: boolean
  maxHeight?: string
}) => {
  cy.mount(ChartLegend, {
    props: {
      items,
      showValues,
    },
    attrs: {
      style: `display: block; width: 280px; max-height: ${maxHeight};`,
    },
  })
}

describe('<ChartLegend />', () => {
  it('does not scroll when its items fit within two rows', () => {
    mountLegend({
      items: createItems({ count: 4 }),
    })

    cy.getTestId('legend').should(($legend) => {
      const element = $legend[0]

      expect(element.scrollHeight).to.equal(element.clientHeight)
    })
  })

  it('caps its height and scrolls once it exceeds two rows', () => {
    mountLegend({
      items: createItems({ count: 12, includeValues: true }),
      showValues: true,
      maxHeight: '80px',
    })

    cy.getTestId('legend').should(($legend) => {
      const element = $legend[0]
      const computedStyle = window.getComputedStyle(element)

      expect(element.scrollHeight).to.be.greaterThan(element.clientHeight)
      expect(element.clientHeight).to.equal(80)
      expect(computedStyle.paddingBottom).to.not.equal('0px')
    })
  })
})
