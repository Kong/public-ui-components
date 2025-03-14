import { INJECT_QUERY_PROVIDER, CP_ID_TOKEN, ENTITY_ID_TOKEN } from '../constants'
import type {
  AdvancedDatasourceQuery,
  AnalyticsBridge,
  AnalyticsConfigV2,
  DatasourceAwareQuery,
  ExploreFilter,
  ExploreResultV4,
  TileConfig,
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
import {
  nonTsExploreResponse,
  timeSeriesExploreResponse,
  routeExploreResponse,
  summaryDashboardConfig,
  simpleConfigNoFilters,
  fourByFourDashboardConfigJustCharts,
} from '../../sandbox/mock-data'
import { createPinia, setActivePinia } from 'pinia'
import { EntityLink } from '@kong-ui-public/entities-shared'
import { dragTile } from '../test-utils'

interface MockOptions {
  failToResolveConfig?: boolean
  shortRetention?: boolean
  renderEntityLink?: boolean
}

describe('<DashboardRenderer />', () => {
  beforeEach(() => {
    cy.viewport(1200, 1000)
    setActivePinia(createPinia())
  })

  const mockQueryProvider = (opts?: MockOptions): AnalyticsBridge => {
    const queryFn = (dsAwareQuery: DatasourceAwareQuery): Promise<ExploreResultV4> => {
      const { query } = dsAwareQuery as AdvancedDatasourceQuery

      // Dimensions to use if query is not provided
      const dimensionMap = { statusCode: ['1XX', '2XX', '3XX', '4XX', '5XX'] }

      if (query.dimensions && query.dimensions.findIndex(d => d === 'route') > -1) {
        return Promise.resolve(routeExploreResponse)
      }

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

    const configFn = (): Promise<AnalyticsConfigV2> => {
      console.log('Config fn')
      if (opts?.failToResolveConfig) {
        console.log('Failing to resolve config')
        // Return a promise that never resolves.
        return new Promise(() => {})
      }

      const config: AnalyticsConfigV2 = {
        analytics: {
          percentiles: true,
          retention_ms: opts?.shortRetention
            ? 86400000 // 1d
            : 2592000000, // 30d
        },
        requests: {
          retention_ms: 86400000,
        },
      }

      console.log('> Resolving config: ', config)

      return Promise.resolve(config)
    }

    const evaluateFeatureFlagFn: AnalyticsBridge['evaluateFeatureFlagFn'] = (key) => {
      return true as any
    }

    const fetchComponentFn = (name: string) => {
      return Promise.resolve(EntityLink)
    }

    return {
      queryFn: cy.spy(queryFn).as('fetcher'),
      configFn,
      evaluateFeatureFlagFn,

      fetchComponent: opts?.renderEntityLink ? fetchComponentFn : undefined,
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
                type: 'golden_signals',
              },
              query: {
                datasource: 'basic',
              },
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
                type: 'gauge',
                metricDisplay: 'full',
                reverseDataset: true,
                numerator: 0,
              },
              query: {
                datasource: 'basic',
              },
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

      cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match.hasNested('query.time_range'))
      cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({ query: {
        time_range: { time_range: '24h' },
      } })).then(() => {
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

            cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match.hasNested('query.time_range'))
            cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({ query: {
              time_range: { time_range: '7d' },
            } }))
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

    cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({ query: {
      time_range: { type: 'absolute' },
    } }))

    cy.get('@fetcher').should('have.been.calledWithMatch', Cypress.sinon.match({ query: {
      filters: [{
        dimension: 'control_plane',
        type: 'in',
        values: ['default_uuid'],
      }],
    } }))
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
        .should('always.have.been.calledWithMatch', Cypress.sinon.match({ query:{
          filters: Cypress.sinon.match.some(Cypress.sinon.match(filter1)),
        } }))
        .should('have.been.calledWithMatch', Cypress.sinon.match({ query: {
          filters: Cypress.sinon.match.some(Cypress.sinon.match({ values: ['default_uuid'] })),
        } }))
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

              cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({ query: {
                filters: Cypress.sinon.match.some(Cypress.sinon.match(filter2)),
              } })).should('have.been.calledWithMatch', Cypress.sinon.match({ query:{
                filters: Cypress.sinon.match.some(Cypress.sinon.match({ values: ['default_uuid'] })),
              } }))
            })
          })
        })
    })
  })

  it('Renders a dashboard with a TopNTable with EntityLinks', () => {
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
      config: {
        gridSize: { cols: 3, rows: 2 },
        tiles: [
          {
            definition: {
              chart: {
                type: 'top_n',
                entityLink: `https://test.com/cp/${CP_ID_TOKEN}/entity/${ENTITY_ID_TOKEN}`,
              },
              query: {
                datasource: 'basic',
                dimensions: ['route'],
              },
            },
            layout: {
              position: {
                col: 0,
                row: 0,
              },
              size: {
                cols: 3,
                rows: 2,
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
          [INJECT_QUERY_PROVIDER]: mockQueryProvider({ renderEntityLink: true }),
        },
      },
    })

    // Check value of href attribute
    cy.get('[data-testid="row-b486fb30-e058-4b5f-85c2-495ec26ba522:09ba7bc7-58d6-42d5-b9c0-3ffb28b307e6"] > .column-1 > [data-testid="entity-link-parent"] > a').should('have.attr', 'href').and('eq', 'https://test.com/cp/b486fb30-e058-4b5f-85c2-495ec26ba522/entity/09ba7bc7-58d6-42d5-b9c0-3ffb28b307e6')
  })

  it('Renders a dashboard with a TopNTable with fallback EntityLinks', () => {
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
      config: {
        gridSize: { cols: 3, rows: 2 },
        tiles: [
          {
            definition: {
              chart: {
                type: 'top_n',
                entityLink: `https://test.com/cp/${CP_ID_TOKEN}/entity/${ENTITY_ID_TOKEN}`,
              },
              query: {
                datasource: 'basic',
                dimensions: ['route'],
              },
            },
            layout: {
              position: {
                col: 0,
                row: 0,
              },
              size: {
                cols: 3,
                rows: 2,
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
          [INJECT_QUERY_PROVIDER]: mockQueryProvider({ renderEntityLink: false }),
        },
      },
    })

    cy.get('[data-testid="row-b486fb30-e058-4b5f-85c2-495ec26ba522:09ba7bc7-58d6-42d5-b9c0-3ffb28b307e6"] > .column-1 > [data-testid="entity-link-parent"]').should('have.class', 'fallback-entity-link')
    cy.get('[data-testid="row-b486fb30-e058-4b5f-85c2-495ec26ba522:09ba7bc7-58d6-42d5-b9c0-3ffb28b307e6"] > .column-1 > [data-testid="entity-link-parent"]').should('have.text', 'GetMeAKongDefault (secondaryRuntime)')
  })

  it("doesn't issue queries if it's still waiting for the timeSpec", () => {
    const props = {
      context: {
        // Use default timeframe for the org: don't provide one here.
        filters: [],
      },
      config: summaryDashboardConfig,
    }

    cy.mount(DashboardRenderer, {
      props,
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider({ failToResolveConfig: true }),
        },
      },
    }).then(() => {
      cy.get('@fetcher').should('not.have.been.called')
    })
  })

  it('picks a lower retention timeSpec if provided', () => {
    const props = {
      context: {
        // Use default timeframe for the org: don't provide one here.
        filters: [
          {
            dimension: 'api_product',
            type: 'in',
            values: ['lower retention'],
          },
        ],
        timeSpec: ((TimePeriods.get(TimeframeKeys.ONE_DAY)) as Timeframe).v4Query(),
      },
      config: summaryDashboardConfig,
    }

    cy.mount(DashboardRenderer, {
      props,
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider({ shortRetention: true }),
        },
      },
    }).then(() => {
      // Extra calls may mean we mistakenly issued queries before knowing the timeSpec.
      cy.get('@fetcher').should('have.callCount', 5)
      cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({ query:{
        time_range: { time_range: '24h' },
      } }))

      // Check that it replaces the description token.
      cy.get('.header-description').should('have.text', 'Last 24-Hour Summary')
    })
  })

  it('picks 7 days and basic datasource by default', () => {
    const props = {
      context: {
        // Use default timeframe for the org: don't provide one here.
        filters: [
          {
            dimension: 'api_product',
            type: 'in',
            values: ['basic'],
          },
        ],
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
    }).then(() => {
      // Extra calls may mean we mistakenly issued queries before knowing the timeSpec.
      cy.get('@fetcher').should('have.callCount', 5)
      cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({
        datasource: 'basic',
        query: {
          time_range: { time_range: '7d' },
        },
      }))

      // Check that it replaces the description token.
      cy.get('.header-description').should('have.text', 'Last 7-Day Summary')
    })
  })

  it('allows overriding the datasource in tiles', () => {
    const props = {
      context: {
        // Use default timeframe for the org: don't provide one here.
        filters: [
          // Specify a filter to avoid caching.
          {
            dimension: 'api_product',
            type: 'in',
            values: ['overriding datasource'],
          },
        ],
      },
      config: simpleConfigNoFilters,
    }

    cy.mount(DashboardRenderer, {
      props,
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider(),
        },
      },
    }).then(() => {
      cy.get('@fetcher').should('have.callCount', 3)
      cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({
        datasource: 'advanced',
        query: {
          time_range: { time_range: '7d' },
        },
      }))
    })
  })

  it('prunes invalid filters', () => {
    const props = {
      context: {
        filters: [
          // Valid filter
          {
            dimension: 'api_product',
            type: 'in',
            values: ['some product'],
          },
          // Invalid filter
          {
            dimension: 'ai_provider',
            type: 'in',
            values: ['some provider'],
          },
        ],
      },
      config: simpleConfigNoFilters,
    }

    cy.mount(DashboardRenderer, {
      props,
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider(),
        },
      },
    }).then(() => {
      // Extra calls may mean we mistakenly issued queries before knowing the timeSpec.
      cy.get('@fetcher').should('have.callCount', 3)
      cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({
        datasource: 'advanced',
        query: {
          filters: [
            {
              dimension: 'api_product',
              type: 'in',
              values: ['some product'],
            },
          ],
        },
      }))

      // Check that it replaces the description token.
      cy.get('.header-description').should('have.text', 'Last 7-Day Summary')
    })
  })

  it('renders tile timeframe overrides in a badge', () => {
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
          cols: 6,
          rows: 4,
        },
        tileHeight: 167,
        tiles: [
          {
            id: 0,
            definition: {
              chart: {
                type: 'timeseries_line',
                chartTitle: 'Total Traffic over Time',
              },
              query: {
                metrics: [
                  'request_count',
                ],
                dimensions: [
                  'time',
                ],
                filters: [{
                  dimension: 'control_plane',
                  type: 'in',
                  values: ['default_uuid'],
                }],
                time_range: {
                  // This should still render a badge even though it matches the global context.
                  type: 'relative',
                  time_range: '24h',
                },
              },
            },
            layout: {
              position: {
                col: 0,
                row: 0,
              },
              size: {
                cols: 3,
                rows: 2,
              },
            },
          } as unknown as TileConfig, // TODO: MA-2987: Remove default datasource concept and associated tests.
          {
            id: 1,
            definition: {
              chart: {
                type: 'timeseries_line',
                chartTitle: 'Latency Breakdown over Time',
              },
              query: {
                metrics: [
                  'response_latency_p99',
                  'response_latency_p95',
                  'response_latency_p50',
                ],
                dimensions: [
                  'time',
                ],
                time_range: {
                  type: 'absolute',
                  start: '2024-01-01',
                  end: '2024-02-01',
                },
              },
            },
            layout: {
              position: {
                col: 3,
                row: 0,
              },
              size: {
                cols: 3,
                rows: 2,
              },
            },
          } as unknown as TileConfig, // TODO: MA-2987: Remove default datasource concept and associated tests.
          {
            id: 2,
            definition: {
              chart: {
                type: 'timeseries_line',
                chartTitle: 'Total Traffic over Time Global Timeframe',
              },
              query: {
                metrics: [
                  'request_count',
                ],
                dimensions: [
                  'time',
                ],
                filters: [],
              },
            },
            layout: {
              position: {
                col: 0,
                row: 2,
              },
              size: {
                cols: 3,
                rows: 2,
              },
            },
          } as unknown as TileConfig, // TODO: MA-2987: Remove default datasource concept and associated tests.
          {
            id: 3,
            definition: {
              chart: {
                type: 'top_n',
                chartTitle: 'TopN',
              },
              query: {
                metrics: [
                  'request_count',
                ],
                dimensions: [
                  'route',
                ],
                filters: [],
                time_range: {
                  type: 'relative',
                  time_range: '7d',
                },
              },
            },
            layout: {
              position: {
                col: 3,
                row: 2,
              },
              size: {
                cols: 3,
                rows: 2,
              },
            },
          } as unknown as TileConfig, // TODO: MA-2987: Remove default datasource concept and associated tests.
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

    cy.get('[data-testid="tile-0"] .tile-actions .k-badge').should('have.text', 'Last 24 hours')
    cy.get('[data-testid="tile-1"] .tile-actions .k-badge').should('have.text', 'Jan 01, 2024 - Feb 01, 2024')
    cy.get('[data-testid="tile-2"] .tile-actions .k-badge').should('not.exist')
    cy.get('[data-testid="tile-3"] .tile-actions .k-badge').should('have.text', 'Last 7 days')

    cy.get('@fetcher').should('have.callCount', 4)

    // Global time + one overridden tile
    cy.get('@fetcher').should('have.been.calledWithMatch', Cypress.sinon.match({
      query: {
        time_range: { time_range: '24h' },
      },
    }))

    // Absolute time overridden tile
    cy.get('@fetcher').should('have.been.calledWithMatch', Cypress.sinon.match({
      query: {
        time_range: { type: 'absolute', start: '2024-01-01', end: '2024-02-01' },
      },
    }))

    // Relative time overridden tile
    cy.get('@fetcher').should('have.been.calledWithMatch', Cypress.sinon.match({
      query: {
        time_range: { type: 'relative', time_range: '7d' },
      },
    }))
  })

  it('editable dashboard', () => {
    const props = {
      context: {
        filters: [],
        timeSpec: {
          type: 'relative',
          time_range: '15m',
        },
        editable: true,
      },
      config: fourByFourDashboardConfigJustCharts,
    }

    cy.mount(DashboardRenderer, {
      props,
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider(),
        },
      },
    })

    fourByFourDashboardConfigJustCharts.tiles.forEach((tile: TileConfig) => {
      cy.getTestId(`edit-tile-${tile.id}`).should('exist')
    })

    cy.getTestId('tile-tile-1').trigger('mouseover')
    cy.getTestId('tile-tile-1').get('.ui-resizable-sw').should('exist')
    cy.getTestId('tile-tile-1').get('.ui-resizable-se').should('exist')
  })

  it('tiles maintain row-column order after reordering', () => {
    const props = {
      context: {
        filters: [],
        timeSpec: {
          type: 'relative',
          time_range: '15m',
        },
        editable: true,
      },
      config: fourByFourDashboardConfigJustCharts,
    }

    const updateTilesSpy = cy.spy().as('updateTilesSpy')

    cy.mount(DashboardRenderer, {
      props,
      attrs: {
        onUpdateTiles: updateTilesSpy,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider(),
        },
      },
    })

    const source = 'tile-tile-3'
    const destination = 'tile-tile-1'

    const updatedTileIDOrder = [
      'tile-3',
      'tile-2',
      'tile-1',
      'tile-4',
    ]

    dragTile(source, destination)

    cy.get('@updateTilesSpy').should('have.been.called')
    cy.get('@updateTilesSpy')
      .its('firstCall.args.0')
      .then(tiles => {
        expect(tiles.map((tile: TileConfig) => tile.id)).to.deep.equal(updatedTileIDOrder)
      })
  })
})
