import { INJECT_QUERY_PROVIDER, CP_ID_TOKEN, ENTITY_ID_TOKEN } from '../constants'
import type {
  AdvancedDatasourceQuery,
  AnalyticsBridge,
  AnalyticsConfigV2,
  DashboardConfig,
  DatasourceAwareQuery,
  ExploreFilterAll,
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
  simpleConfigGlobalFilters,
} from '../../sandbox/mock-data'
import { createPinia, setActivePinia } from 'pinia'
import { EntityLink } from '@kong-ui-public/entities-shared'
import { dragTile } from '../test-utils'
import { ref, type Ref } from 'vue'

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

    const evaluateFeatureFlagFn: AnalyticsBridge['evaluateFeatureFlagFn'] = () => {
      return true as any
    }

    const fetchComponentFn = () => {
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
      modelValue: {
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
      modelValue: summaryDashboardConfig,
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
        cy.get('@fetcher').invoke('resetHistory').then(() => {

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
      modelValue: summaryDashboardConfig,
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
        field: 'control_plane',
        operator: 'in',
        value: ['default_uuid'],
      }],
    } }))
  })

  it('has reactive contextual filters', () => {
    const filter1: ExploreFilterAll = {
      operator: 'in',
      field: 'api_product',
      value: ['blah'],
    }

    const filter2: ExploreFilterAll = {
      operator: 'in',
      field: 'api_product',
      value: ['arrgh'],
    }

    const oneDayTimeframe = TimePeriods.get(TimeframeKeys.ONE_DAY)!

    const props = {
      context: {
        filters: [filter1],
        timeSpec: oneDayTimeframe.v4Query(),
      },
      modelValue: summaryDashboardConfig,
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
        .should('always.have.been.calledWithMatch', Cypress.sinon.match({ query: {
          filters: Cypress.sinon.match.some(Cypress.sinon.match(filter1)),
        } }))
        .should('have.been.calledWithMatch', Cypress.sinon.match({ query: {
          filters: Cypress.sinon.match.some(Cypress.sinon.match({ value: ['default_uuid'] })),
        } }))
        .then(() => {
          cy.get('@fetcher').invoke('resetHistory').then(() => {
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
              } })).should('have.been.calledWithMatch', Cypress.sinon.match({ query: {
                filters: Cypress.sinon.match.some(Cypress.sinon.match({ value: ['default_uuid'] })),
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
      modelValue: {
        tiles: [
          {
            definition: {
              chart: {
                type: 'top_n',
                entity_link: `https://test.com/cp/${CP_ID_TOKEN}/entity/${ENTITY_ID_TOKEN}`,
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
      modelValue: {
        tiles: [
          {
            definition: {
              chart: {
                type: 'top_n',
                entity_link: `https://test.com/cp/${CP_ID_TOKEN}/entity/${ENTITY_ID_TOKEN}`,
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
      modelValue: summaryDashboardConfig,
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
            field: 'api_product',
            operator: 'in',
            value: ['lower retention'],
          },
        ],
        timeSpec: ((TimePeriods.get(TimeframeKeys.ONE_DAY)) as Timeframe).v4Query(),
      },
      modelValue: summaryDashboardConfig,
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
      cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({ query: {
        time_range: { time_range: '24h' },
      } }))

      // Check that it replaces the description token.
      cy.get('.header-description').should('have.text', 'Last 24-hour summary')
    })
  })

  it('picks 7 days and basic datasource by default', () => {
    const props = {
      context: {
        // Use default timeframe for the org: don't provide one here.
        filters: [
          {
            field: 'api_product',
            operaator: 'in',
            value: ['basic'],
          },
        ],
      },
      modelValue: summaryDashboardConfig,
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
      cy.get('.header-description').should('have.text', 'Last 7-day summary')
    })
  })

  it('allows overriding the datasource in tiles', () => {
    const props = {
      context: {
        // Use default timeframe for the org: don't provide one here.
        filters: [
          // Specify a filter to avoid caching.
          {
            field: 'api_product',
            operator: 'in',
            value: ['overriding datasource'],
          },
        ],
      },
      modelValue: simpleConfigNoFilters,
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
        datasource: 'api_usage',
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
            field: 'api_product',
            operator: 'in',
            value: ['some product'],
          },
          // Invalid filter
          {
            field: 'ai_provider',
            operator: 'in',
            value: ['some provider'],
          },
        ],
      },
      modelValue: simpleConfigNoFilters,
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
        datasource: 'api_usage',
        query: {
          filters: [
            {
              field: 'api_product',
              operator: 'in',
              value: ['some product'],
            },
          ],
        },
      }))

      // Check that it replaces the description token.
      cy.get('.header-description').should('have.text', 'Last 7-day summary')
    })
  })

  it('merges global filters', () => {
    const props = {
      context: {
        filters: [
          // Valid filter
          {
            field: 'api_product',
            operator: 'in',
            value: ['some product'],
          },
        ],
      },
      modelValue: simpleConfigGlobalFilters,
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
        datasource: 'api_usage',
        query: {
          filters: [
            {
              field: 'api_product',
              operator: 'in',
              value: ['some product'],
            },
            {
              field: 'control_plane',
              operator: 'in',
              value: ['default_uuid'],
            },
          ],
        },
      }))

      // Check that it replaces the description token.
      cy.get('.header-description').should('have.text', 'Last 7-day summary')
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
      modelValue: {
        tileHeight: 167,
        tiles: [
          {
            id: 0,
            definition: {
              chart: {
                type: 'timeseries_line',
                chart_title: 'Total Traffic over Time',
              },
              query: {
                metrics: [
                  'request_count',
                ],
                dimensions: [
                  'time',
                ],
                filters: [{
                  field: 'control_plane',
                  operator: 'in',
                  value: ['default_uuid'],
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
                chart_title: 'Latency Breakdown over Time',
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
                chart_title: 'Total Traffic over Time Global Timeframe',
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
                chart_title: 'TopN',
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

    cy.get('[data-testid="tile-0"] .tile-actions .k-badge .badge-text').should('have.text', 'Last 24 hours')
    cy.get('[data-testid="tile-1"] .tile-actions .k-badge .badge-text').should('have.text', 'Jan 01, 2024 - Feb 01, 2024')
    cy.get('[data-testid="tile-2"] .tile-actions .k-badge').should('not.exist')
    cy.get('[data-testid="tile-3"] .tile-actions .k-badge .badge-text').should('have.text', 'Last 7 days')

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
      modelValue: fourByFourDashboardConfigJustCharts,
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
    const configRef = ref<DashboardConfig>(fourByFourDashboardConfigJustCharts)
    const props = {
      context: {
        filters: [],
        timeSpec: {
          type: 'relative',
          time_range: '15m',
        },
        editable: true,
      },
      modelValue: configRef.value,
    }

    cy.mount(DashboardRenderer, {
      props,
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

    cy.wrap(configRef).should((ref: Ref<DashboardConfig>) => {
      const currentOrder = ref.value.tiles.map((tile: TileConfig) => tile.id)
      expect(currentOrder).to.deep.equal(updatedTileIDOrder)

      const tileTypes = ref.value.tiles.map((tile) => tile.type)
      expect(tileTypes).to.deep.equal(Array(4).fill('chart'))
    })
  })

  it('goes fullscreen when the fullscreen method is called', () => {
    cy.stub(HTMLElement.prototype, 'requestFullscreen').as('fullscreen')
    const props = {
      context: {},
      modelValue: summaryDashboardConfig,
      showFullscreenControl: true,
    }

    cy.mount(DashboardRenderer, {
      props,
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider(),
        },
      },
    }).then(({ wrapper }) => {
      wrapper.vm.toggleFullscreen()
    })

    cy.get('@fullscreen').should('have.been.called')
  })
})
