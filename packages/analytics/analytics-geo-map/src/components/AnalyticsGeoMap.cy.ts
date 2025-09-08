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
}: {
  countryMetrics: Record<string, number>
  fitToCountry?: Ref<string>
  metric?: Ref<ExploreAggregations>
  metricUnit?: Ref<MetricUnits>
  onBoundsChange?: (bounds: Array<[number, number]>) => void
}) => {

  const WrapperComponent = defineComponent({
    setup() {
      return { countryMetrics, fitToCountry, metric, metricUnit, onBoundsChange }
    },
    render() {
      return h('div', { style: 'height: 500px; width: 500px;' }, [
        h(AnalyticsGeoMap, {
          countryMetrics: this.countryMetrics,
          fitToCountry: this.fitToCountry as CountryISOA2,
          metric: this.metric,
          metricUnit: this.metricUnit,
          onBoundsChange: this.onBoundsChange,
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
})
