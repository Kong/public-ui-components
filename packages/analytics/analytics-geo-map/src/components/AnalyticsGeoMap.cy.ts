// Cypress component test spec file

import AnalyticsGeoMap from './AnalyticsGeoMap.vue'
import { defineComponent, h } from 'vue'

// Needs to be contained in an element that gives it height.
const WrapperComponent = defineComponent({
  props: {
    countryMetrics: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    return () => h('div', { style: 'height: 500px; width: 500px;' }, [
      h(AnalyticsGeoMap, {
        countryMetrics: props.countryMetrics,
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
          US: 1,
          CA: 2,
        },
      },
    })

    cy.get('.kong-ui-public-analytics-geo-map').should('be.visible')
    cy.get('.maplibregl-canvas').should('be.visible')
  })
})
