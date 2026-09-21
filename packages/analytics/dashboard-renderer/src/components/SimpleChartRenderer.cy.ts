import { defineComponent } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import '@kong-ui-public/analytics-chart/dist/style.css'
import SimpleChartRenderer from './SimpleChartRenderer.vue'

const data: ExploreResultV4 = {
  data: [
    { timestamp: '2026-09-01T00:00:00Z', event: { request_count: 100 } },
    { timestamp: '2026-09-02T00:00:00Z', event: { request_count: 125 } },
  ],
  meta: {
    start: '2026-09-01T00:00:00Z',
    end: '2026-09-03T00:00:00Z',
    metric_names: ['request_count'],
    metric_units: { request_count: 'count' },
    granularity_ms: 86400000,
  },
}

describe('<SimpleChartRenderer />', () => {
  it('renders the current value and left-aligned trend for trend granularity', () => {
    cy.mount(SimpleChartRenderer, {
      props: {
        chartOptions: { type: 'single_value' },
        query: { datasource: 'basic', metrics: ['request_count'], dimensions: ['time'], granularity: 'trend' },
        context: { filters: [] },
        queryReady: true,
        height: 160,
        refreshCounter: 0,
      },
      global: {
        stubs: {
          QueryDataProvider: defineComponent({
            setup: (_, { slots }) => () => slots.default?.({ data }),
          }),
        },
      },
    }).then(({ wrapper }) => {
      cy.getTestId('single-value-chart').should('have.text', '125')
      cy.getTestId('single-value-trend').should('contain.text', '25.00%')
      cy.getTestId('single-value-parent').should('have.css', 'justify-content', 'flex-start')

      cy.then(() => wrapper.setProps({ chartOptions: { type: 'single_value', align_x: 'center' } }))
      cy.getTestId('single-value-parent').should('have.css', 'justify-content', 'center')

      cy.then(() => wrapper.setProps({ chartOptions: { type: 'single_value', align_x: 'right' } }))
      cy.getTestId('single-value-parent').should('have.css', 'justify-content', 'flex-end')

      cy.then(() => wrapper.setProps({ query: { datasource: 'basic', metrics: ['request_count'] } }))
      cy.getTestId('single-value-trend').should('not.exist')
    })
  })
})
