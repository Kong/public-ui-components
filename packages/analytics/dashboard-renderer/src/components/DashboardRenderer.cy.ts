// Cypress component test spec file

import DashboardRenderer from './DashboardRenderer.vue'
import { ChartTypes } from '../types'
import { ChartMetricDisplay } from '@kong-ui-public/analytics-chart'
import type { GlobalMountOptions } from '@vue/test-utils/dist/types'
import { exploreV3Response } from '../mock-data'
import type { QueryProvider } from '../types/query-provider'
import { INJECT_QUERY_PROVIDER } from '../types/query-provider'

const mockQueryProvider: QueryProvider = {
  query: async () => { return exploreV3Response },
}

const global: GlobalMountOptions = {
  provide: {
    [INJECT_QUERY_PROVIDER]: mockQueryProvider,
  },
}

describe('<DashboardRenderer />', () => {
  it('Renders the correct number of tiles', () => {
    const props = {
      context: {
        filters: {},
        timeSpec: '',
      },
      definition: {
        gridSize: {
          cols: 2,
          rows: 4,
        },
        tiles: [
          {
            title: 'Analytics chart',
            chart: {
              type: ChartTypes.HorizontalBar,
            },
            query: {},
            size: {
              cols: 2,
              rows: 2,
            },
            position: {
              col: 1,
              row: 1,
            },
          },
          {
            title: 'Simple chart',
            chart: {
              type: ChartTypes.Gauge,
              metricDisplay: ChartMetricDisplay.Full,
              reverseDataset: true,
              numerator: 0,
            },
            query: {},
            size: {
              cols: 2,
              rows: 2,
            },
            position: {
              col: 1,
              row: 3,
            },
          },
        ],
      },
    }

    cy.mount(DashboardRenderer, {
      props,
      global,
    })

    cy.get('.kong-ui-public-dashboard-renderer').should('be.visible')
    cy.get('.tile-boundary').should('have.length', 2)
  })
})
