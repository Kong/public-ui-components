import { ChartTypes } from '../types'
import { ChartMetricDisplay } from '@kong-ui-public/analytics-chart'
import { INJECT_QUERY_PROVIDER } from '../constants'
import type { AnalyticsBridge, ExploreQuery, ExploreResultV4, Timeframe } from '@kong-ui-public/analytics-utilities'
import { generateSingleMetricTimeSeriesData, generateCrossSectionalData, TimeframeKeys, TimePeriods } from '@kong-ui-public/analytics-utilities'
import DashboardRenderer from './DashboardRenderer.vue'
import { nonTsExploreResponse, timeSeriesExploreResponse, summaryDashboardConfig } from '../../sandbox/mock-data'

describe('<DashboardRenderer />', () => {
  beforeEach(() => {
    cy.viewport(1200, 1000)
  })

  const mockQueryProvider = (): AnalyticsBridge => {
    const queryFn = (query: ExploreQuery): Promise<ExploreResultV4> => {
      // Dimensions to use if query is not provided
      const dimensionMap = { statusCode: ['1XX', '2XX', '3XX', '4XX', '5XX'] }

      if (query.dimensions && query.dimensions.findIndex(d => d === 'time') > -1) {
        if (query.metrics && query.metrics[0] === 'request_count') {
        // Traffic + Error rate cards
          return Promise.resolve(nonTsExploreResponse)
        } else if (query.metrics && query.metrics[0] === 'response_latency_p99' && query.metrics.length === 1) {
        // Latency metrics card
          return Promise.resolve(timeSeriesExploreResponse)
        } else {
        // Timeseries Line chart
          const timeSeriesResponse = generateSingleMetricTimeSeriesData(
            { name: 'TotalRequests', unit: 'count' },
            { statusCode: query.metrics as string[] },
          ) as ExploreResultV4

          return Promise.resolve(timeSeriesResponse)
        }
      } else {
      // Bar charts (non-time series)
        const nonTimeSeriesResponse = generateCrossSectionalData(
          [
            { name: 'TotalRequests', unit: 'count' },
          ],
          dimensionMap,
        ) as ExploreResultV4

        return Promise.resolve(nonTimeSeriesResponse)
      }
    }

    return {
      queryFn: cy.spy(queryFn).as('fetcher'),
    }
  }

  afterEach(() => {
    const customStyles = `
      // body { height: 100%; width: 100%; display: block; position: relative;}
      .kong-ui-public-dashboard-renderer { position: absolute; width: 100vw; }
    `
    cy.document().then(document => {
      const style = document.createElement('style')
      style.appendChild(document.createTextNode(customStyles))
      document.head.appendChild(style)
    })
  })

  it('Renders the correct number of tiles', () => {
    const props = {
      context: {
        filters: [],
        timeSpec: {
          type: 'relative',
          time_range: '24h',
        },
      },
      config: {
        gridSize: {
          cols: 2,
          rows: 4,
        },
        tiles: [
          {
            definition: {
              chart: {
                type: ChartTypes.GoldenSignals,
              },
              query: {},
            },
            layout: {
              position: {
                col: 0,
                row: 0,
              },
              size: {
                cols: 6,
                rows: 1,
              },
            },
          },
          {
            definition: {
              chart: {
                type: ChartTypes.Gauge,
                metricDisplay: ChartMetricDisplay.Full,
                reverseDataset: true,
                numerator: 0,
              },
              query: { },
            },
            layout: {
              size: {
                cols: 2,
                rows: 2,
              },
              position: {
                col: 1,
                row: 3,
              },
            },
          },
        ],
      },
    }

    cy.mount(DashboardRenderer, {
      props,
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider(),
        },
      },
    })

    cy.get('.kong-ui-public-dashboard-renderer').should('be.visible')
    cy.get('.tile-boundary').should('have.length', 2)

    // Two queries for the metric cards, one for the gauge chart
    cy.get('@fetcher').should('have.been.calledThrice')
  })

  it('Renders a summary dashboard with 24h timeframe', () => {
    const oneDayTimeframe: Timeframe = TimePeriods.get(TimeframeKeys.ONE_DAY) as Timeframe
    const props = {
      context: {
        filters: [],
        timeSpec: oneDayTimeframe.v4Query(),
      },
      config: summaryDashboardConfig,
    }

    cy.mount(DashboardRenderer, {
      props,
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider(),
        },
      },
    })

    cy.get('.kong-ui-public-dashboard-renderer').should('be.visible')
    cy.get('.tile-boundary').should('have.length', 4)

    cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match.hasNested('time_range'))
    cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({
      time_range: { time_range: '24h' },
    }))

    // Two queries for the metric cards, three for the charts
    // cy.get('@fetcher').should('have.callCount', 5)
  })

  it('Renders a summary dashboard with 7d timeframe', () => {
    const sevenDayTimeframe: Timeframe = TimePeriods.get(TimeframeKeys.SEVEN_DAY) as Timeframe
    const props = {
      context: {
        filters: [],
        timeSpec: sevenDayTimeframe.v4Query(),
      },
      config: summaryDashboardConfig,
    }

    cy.mount(DashboardRenderer, {
      props,
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider(),
        },
      },
    })

    cy.get('.kong-ui-public-dashboard-renderer').should('be.visible')
    cy.get('.tile-boundary').should('have.length', 4)

    cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match.hasNested('time_range'))
    cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({
      time_range: { time_range: '7d' },
    }))

    // Two queries for the metric cards, three for the charts
    // cy.get('@fetcher').should('have.callCount', 5)
  })
})
