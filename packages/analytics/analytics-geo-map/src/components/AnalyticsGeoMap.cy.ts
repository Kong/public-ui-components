// Cypress component test spec file
import type { CountryISOA2, ExploreAggregations } from '@kong-ui-public/analytics-utilities'
import AnalyticsGeoMap from './AnalyticsGeoMap.vue'
import { defineComponent, h, ref, type Ref } from 'vue'
import type { MetricUnits } from '../types'

const mountComponent = ({
  countryMetrics,
  fitToCountry = ref(''),
  metric = ref('request_count'),
  metricUnit = ref('requests'),
  onBoundsChange = cy.spy(),
  truncatedMetric = ref(true),
}: {
  countryMetrics: Record<string, number>
  fitToCountry?: Ref<string>
  metric?: Ref<ExploreAggregations>
  metricUnit?: Ref<MetricUnits>
  onBoundsChange?: (bounds: Array<[number, number]>) => void
  truncatedMetric?: Ref<boolean>
}) => {

  const WrapperComponent = defineComponent({
    setup() {
      return { countryMetrics, fitToCountry, metric, metricUnit, onBoundsChange, truncatedMetric }
    },
    render() {
      return h('div', { style: 'height: 500px; width: 500px;' }, [
        h(AnalyticsGeoMap, {
          countryMetrics: this.countryMetrics,
          fitToCountry: this.fitToCountry as CountryISOA2,
          metric: this.metric,
          metricUnit: this.metricUnit,
          onBoundsChange: this.onBoundsChange,
          truncatedMetric: this.truncatedMetric,
        }),
      ])
    },
  })

  return cy.mount(WrapperComponent)
}

const romaniaBounds = [
  [20.220191999999997, 42.637532231814674],
  [29.6265429999994, 49.17185755292891],
]

const COUNTRY_METRICS = {
  US: 1,
  CA: 12,
  MX: 150,
  BR: 3_100,
  AR: 75_000,
}

describe('<AnalyticsGeoMap />', () => {
  beforeEach(() => {
    cy.viewport(1280, 800)
  })

  it('Renders map', () => {

    mountComponent({
      countryMetrics: {
        US: 1,
        CA: 2,
      },
    })

    cy.get('.kong-ui-public-analytics-geo-map').should('be.visible')
    cy.get('.maplibregl-canvas').should('be.visible')
  })

  it('Emits boundsChange event on map move', () => {
    const onBoundsChange = cy.spy().as('boundsChangeSpy')
    const fitToCountry = ref('')

    mountComponent({
      countryMetrics: {
        US: 1,
        CA: 2,
      },
      fitToCountry,
      onBoundsChange,
    })

    cy.then(() => {
      fitToCountry.value = 'RO'
    })

    cy.get('@boundsChangeSpy').should('have.been.calledOnce')
    cy.get('@boundsChangeSpy').should('have.been.calledWith', romaniaBounds)
  })

  it('renders legend ranges with compact formatting when truncatedMetric is true', () => {
    mountComponent({ countryMetrics: COUNTRY_METRICS, truncatedMetric: ref(true) })

    cy.get('.legend').should('exist')
    cy.get('.legend-item').should('have.length', 5)

    // Expect at least one item to use the truncated suffix and none to contain thousands separators
    cy.get('.legend-item .legend-text').then((items) => {
      const texts = items.toArray().map(el => el.textContent?.trim() || '')

      // one or more items should include K
      expect(texts).to.satisfy((arr: string[]) => arr.some(t => /K\b/.test(t)))

      // ensure we didn't get comma-formatted numbers
      expect(texts).to.satisfy((arr: string[]) => arr.every(t => !t.includes(',')))
    })
  })


  it('renders legend ranges with comma formatting when truncatedMetric is false', () => {
    mountComponent({ countryMetrics: COUNTRY_METRICS, truncatedMetric: ref(false) })

    cy.get('.legend').should('exist')
    cy.get('.legend-item').should('have.length', 5)

    // Expect at least one item to contain thousands separator
    cy.get('.legend-item .legend-text').then((items) => {
      const texts = items.toArray().map(el => el.textContent?.trim() || '')

      expect(texts).to.satisfy((arr: string[]) => arr.some(t => t.includes(',')))
    })
  })
})
