import { ChartTypes } from '../types'
import { ChartMetricDisplay } from '@kong-ui-public/analytics-chart'
import { INJECT_QUERY_PROVIDER } from '../constants'
import type {
  AnalyticsBridge,
  AnalyticsConfig,
  ExploreFilter,
  ExploreQuery,
  ExploreResultV4,
  Timeframe,
} from '@kong-ui-public/analytics-utilities'
import {
  datePickerSelectionToTimeframe,
  generateSingleMetricTimeSeriesData,
  generateCrossSectionalData,
  TimeframeKeys,
  TimePeriods,
} from '@kong-ui-public/analytics-utilities'
import DashboardRenderer from './DashboardRenderer.vue'
import { nonTsExploreResponse, timeSeriesExploreResponse, summaryDashboardConfig } from '../../sandbox/mock-data'
import { createPinia, setActivePinia } from 'pinia'

describe('<DashboardRenderer />', () => {
  beforeEach(() => {
    cy.viewport(1200, 1000)
    setActivePinia(createPinia())
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

    const configFn = (): Promise<AnalyticsConfig> => Promise.resolve({
      analytics: true,
      percentiles: true,
      api_requests_retention: '24h',
      api_requests_retention_ms: 86400000,
      api_analytics_retention: '30d',
      api_analytics_retention_ms: 30 * 86400000,
    })

    return {
      queryFn: cy.spy(queryFn).as('fetcher'),
      configFn,
    }
  }

  it('Renders the correct number of tiles', () => {
    const props = {
      context: {
        filters: [],
        timeSpec: {
          type: 'relative',
          time_range: '15m',
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

  it('Changing the timeframe changes the query', () => {
    const oneDayTimeframe: Timeframe = TimePeriods.get(TimeframeKeys.ONE_DAY)!
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
    }).then(({ wrapper }) => {
      // Two queries for the metric cards, three for the charts
      cy.get('@fetcher').should('have.callCount', 5)

      cy.get('.kong-ui-public-dashboard-renderer').should('be.visible')
      cy.get('.tile-boundary').should('have.length', 4)

      cy.get('.metricscard-trend-range').eq(0).should('contain.text', 'previous 24 hours')

      cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match.hasNested('time_range'))
      cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({
        time_range: { time_range: '24h' },
      })).then(() => {
        cy.get('@fetcher').then((m) => m.resetHistory()).then(() => {

          const sevenDayTimeframe: Timeframe = TimePeriods.get(TimeframeKeys.SEVEN_DAY)!

          wrapper.setProps({
            context: {
              filters: [],
              timeSpec: sevenDayTimeframe.v4Query(),
            },
          }).then(() => {
            // Two more queries for the metric cards, three for the charts
            cy.get('@fetcher').should('have.callCount', 5)

            cy.get('.kong-ui-public-dashboard-renderer').should('be.visible')
            cy.get('.tile-boundary').should('have.length', 4)

            cy.get('.metricscard-trend-range').eq(0).should('contain.text', 'previous 7 days')

            cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match.hasNested('time_range'))
            cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({
              time_range: { time_range: '7d' },
            }))
          })
        })
      })
    })
  })

  it('Renders a dashboard with custom timeframe, checks query filter', () => {
    const customTimeframe = datePickerSelectionToTimeframe({
      timePeriodsKey: 'custom',
      start: new Date('2024-03-03T21:10:28.969Z'),
      end: new Date('2024-03-06T21:10:28.969Z'),
    }) as Timeframe

    const props = {
      context: {
        filters: [],
        timeSpec: customTimeframe.v4Query(),
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

    cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({
      time_range: { type: 'absolute' },
    }))

    cy.get('@fetcher').should('have.been.calledWithMatch', Cypress.sinon.match({
      filters: [{
        dimension: 'control_plane',
        type: 'in',
        values: ['default_uuid'],
      }],
    }))
  })

  it('has reactive contextual filters', () => {
    const filter1: ExploreFilter = {
      type: 'in',
      dimension: 'api_product',
      values: ['blah'],
    }

    const filter2: ExploreFilter = {
      type: 'in',
      dimension: 'api_product',
      values: ['arrgh'],
    }

    const oneDayTimeframe = TimePeriods.get(TimeframeKeys.ONE_DAY)!

    const props = {
      context: {
        filters: [filter1],
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
    }).then(({ wrapper }) => {
      // Two queries for the metric cards, three for the charts
      cy.get('@fetcher').should('have.callCount', 5)

      cy.get('.kong-ui-public-dashboard-renderer').should('be.visible')
      cy.get('.tile-boundary').should('have.length', 4)

      cy.get('@fetcher')
        .should('always.have.been.calledWithMatch', Cypress.sinon.match({
          filters: Cypress.sinon.match.some(Cypress.sinon.match(filter1)),
        }))
        .should('have.been.calledWithMatch', Cypress.sinon.match({
          filters: Cypress.sinon.match.some(Cypress.sinon.match({ values: ['default_uuid'] })),
        }))
        .then(() => {
          cy.get('@fetcher').then((m) => m.resetHistory()).then(() => {
            wrapper.setProps({
              context: {
                filters: [filter2],
                timeSpec: oneDayTimeframe.v4Query(),
              },
            }).then(() => {
              // Two more queries for the metric cards, three for the charts
              cy.get('@fetcher').should('have.callCount', 5)

              cy.get('.kong-ui-public-dashboard-renderer').should('be.visible')
              cy.get('.tile-boundary').should('have.length', 4)

              cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({
                filters: Cypress.sinon.match.some(Cypress.sinon.match(filter2)),
              })).should('have.been.calledWithMatch', Cypress.sinon.match({
                filters: Cypress.sinon.match.some(Cypress.sinon.match({ values: ['default_uuid'] })),
              }))
            })
          })
        })
    })
  })
})
