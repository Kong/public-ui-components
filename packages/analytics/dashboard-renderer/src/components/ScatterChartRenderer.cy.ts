import type { AnalyticsBridge, ApiRequestsQuery, ExploreResultV4, ValidDashboardChartQuery } from '@kong-ui-public/analytics-utilities'
import type { ScatterChartData } from '@kong-ui-public/analytics-chart'
import type { DashboardRendererContext } from '../types'

import { createPinia, setActivePinia } from 'pinia'
import ScatterChartRenderer from './ScatterChartRenderer.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'

const START = '2024-06-16T00:00:00.000Z'
const END = '2024-06-16T01:00:00.000Z'

const scatterData = (points = 3): ScatterChartData => ({
  points: Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(START).valueOf() + i * 1000,
    value: i + 1,
  })),
  metric: 'latencies_response_ms',
  start: START,
  end: END,
})

const exploreResult = (): ExploreResultV4 => ({
  data: [{ timestamp: START, event: { request_count: 3, route: 'a' } }],
  meta: {
    start: START,
    end: END,
    granularity_ms: 3_600_000,
    display: { route: { a: { name: 'Route A' } } },
    metric_names: ['request_count'],
    metric_units: { request_count: 'count' },
    query_id: '',
  },
} as unknown as ExploreResultV4)

const query: ApiRequestsQuery = {
  datasource: 'requests',
  metric: 'latencies_response_ms',
}

describe('<ScatterChartRenderer />', () => {
  beforeEach(() => {
    cy.viewport(1200, 800)
    setActivePinia(createPinia())
  })

  let refreshCounter = 0

  const render = ({
    scatterDataFn,
    queryReady = true,
    tileQuery = query,
    queryFn,
  }: {
    scatterDataFn?: DashboardRendererContext['scatterDataFn']
    queryReady?: boolean
    tileQuery?: ApiRequestsQuery | ValidDashboardChartQuery
    queryFn?: () => Promise<ExploreResultV4>
  } = {}) => {
    refreshCounter++

    cy.mount(ScatterChartRenderer, {
      props: {
        query: tileQuery,
        context: {
          filters: [],
          ...(scatterDataFn && { scatterDataFn: cy.spy(scatterDataFn).as('fetcher') }),
        } as DashboardRendererContext,
        queryReady,
        chartOptions: { type: 'scatter' },
        height: 400,
        refreshCounter,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: {
            queryFn: cy.spy(queryFn ?? (() => Promise.resolve(exploreResult()))).as('queryFn'),
            datasourceConfigFn: () => Promise.resolve([]),
          } as unknown as AnalyticsBridge,
        },
      },
    })
  }

  it('renders the chart from the data the consumer supplies', () => {
    render({ scatterDataFn: () => Promise.resolve(scatterData()) })

    cy.get('@fetcher').should('have.been.calledOnce')
    cy.get('[data-testid="scatter-chart-container"]').should('be.visible')
    cy.get('[data-testid="scatter-chart-empty-state"]').should('not.exist')
  })

  it('passes the tile query and an abort controller to the consumer', () => {
    render({ scatterDataFn: () => Promise.resolve(scatterData()) })

    cy.get('@fetcher').then((spy: any) => {
      const call = spy.getCall(0)
      expect(call.args[0]).to.deep.equal(query)
      expect(call.args[2]).to.be.instanceOf(AbortController)
    })
  })

  it('shows an empty state when the consumer supplies no scatterDataFn', () => {
    render()

    cy.get('[data-testid="scatter-chart-empty-state"]').should('be.visible')
      .and('contain.text', 'No scatter data provider supplied')
  })

  it('shows an empty state when the fetch rejects', () => {
    render({ scatterDataFn: () => Promise.reject(new Error('nope')) })

    cy.get('[data-testid="scatter-chart-empty-state"]').should('be.visible')
    cy.get('[data-testid="scatter-chart-container"]').should('not.exist')
  })

  it('surfaces a forbidden query error', () => {
    const forbidden = Object.assign(new Error('forbidden'), { response: { status: 403 } })

    render({ scatterDataFn: () => Promise.reject(forbidden) })

    cy.get('[data-testid="scatter-chart-empty-state"]').should('be.visible')
  })

  describe('explore-backed tiles', () => {
    const exploreQuery: ValidDashboardChartQuery = {
      datasource: 'api_usage',
      metrics: ['request_count'],
      dimensions: ['route'],
      granularity: 'hourly',
    } as ValidDashboardChartQuery

    it('goes through the query bridge, not the consumer fetch', () => {
      render({ tileQuery: exploreQuery, scatterDataFn: () => Promise.resolve(scatterData()) })

      cy.get('@queryFn').should('have.been.calledOnce')
      cy.get('@fetcher').should('not.have.been.called')
      cy.get('[data-testid="scatter-chart-container"]').should('be.visible')
    })

    it('renders without a scatterDataFn at all', () => {
      render({ tileQuery: exploreQuery })

      cy.get('@queryFn').should('have.been.calledOnce')
      cy.get('[data-testid="scatter-chart-container"]').should('be.visible')
      cy.get('[data-testid="scatter-chart-empty-state"]').should('not.exist')
    })
  })

  it('does not fetch until the query is ready', () => {
    render({ scatterDataFn: () => Promise.resolve(scatterData()), queryReady: false })

    cy.get('@fetcher').should('not.have.been.called')
  })
})
