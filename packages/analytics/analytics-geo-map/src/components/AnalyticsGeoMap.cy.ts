// Cypress component test spec file

import AnalyticsGeoMap from './AnalyticsGeoMap.vue'
import testGeoData from '../test-data/testGeoData.json'
import type { MapFeatureCollection } from '../types'
import { defineComponent, h, type PropType } from 'vue'

// Needs to be contained in an element that gives it height.
const WrapperComponent = defineComponent({
  props: {
    countryMetrics: {
      type: Object,
      required: true,
    },
    geoJsonData: {
      type: Object as PropType<MapFeatureCollection>,
      required: true,
    },
  },
  setup(props) {
    return () => h('div', { style: 'height: 500px; width: 500px;' }, [
      h(AnalyticsGeoMap, {
        countryMetrics: props.countryMetrics,
        geoJsonData: props.geoJsonData,
      }),
    ])
  },
})

describe('<AnalyticsGeoMap />', () => {
  beforeEach(() => {
    cy.viewport(1280, 800)
  })

  it('Renders map', () => {
    cy.mount(WrapperComponent, {
      props: {
        countryMetrics: {
          AO: 1,
        },
        geoJsonData: testGeoData,
      },
    })

    cy.get('.kong-ui-public-analytics-geo-map').should('be.visible')
    cy.get('.maplibregl-canvas').should('be.visible')
  })
})
