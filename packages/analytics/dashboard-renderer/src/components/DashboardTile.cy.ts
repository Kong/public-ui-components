import DashboardTile from './DashboardTile.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'
import type { DashboardRendererContextInternal } from '../types'
import { generateSingleMetricTimeSeriesData, type ExploreResultV4, type TileDefinition, EXPORT_RECORD_LIMIT, COUNTRIES } from '@kong-ui-public/analytics-utilities'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'
import { useAnalyticsConfigStore } from '@kong-ui-public/analytics-config-store'

const start = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
const end = new Date().toISOString()

describe('<DashboardTile />', () => {
  const mockTileDefinition: TileDefinition = {
    chart: {
      type: 'timeseries_line',
      chart_title: 'Test Chart',
    },
    query: {
      datasource: 'api_usage',
      metrics: [],
      filters: [],
    },
  }

  const mockTileDefinitionWithTimerange: TileDefinition = {
    ...mockTileDefinition,
    query: {
      ...mockTileDefinition.query,
      time_range: {
        type: 'absolute',
        start: '2024-01-01',
        end: '2024-02-01',
      },
    },
  }

  const cacheBustTile = (tile: TileDefinition): TileDefinition => {
    // When we are mounting a component that calls useSWRV (way deep down) and
    // need to spy on the fetch, we have to force useSWRV to actually run the
    // query. Adding a filter forces a cache bust in `QueryDataProvider.vue`
    const benignFilter = {
      operator: 'not_in',
      field: 'control_plane',
      value: [`${crypto.randomUUID()}`],
    }

    return {
      ...tile,
      query: {
        ...tile.query,
        filters: [
          ...(tile.query?.filters ?? []),
          benignFilter,
        ],
      },
    } as unknown as TileDefinition
  }

  const mockContext: DashboardRendererContextInternal = {
    filters: [],
    timeSpec: {
      type: 'relative',
      time_range: '15m',
    },
    editable: true,
    tz: '',
    refreshInterval: 0,
    zoomable: false,
  }

  const mockQueryProvider = {
    exploreBaseUrl: async () => 'http://test.com/explore',
    requestsBaseUrl: async () => 'http://test.com/requests',
    evaluateFeatureFlagFn: () => true,
    queryFn: () => {
      return Promise.resolve(
        generateSingleMetricTimeSeriesData(
          { name: 'TotalRequests', unit: 'count' },
          { status_code: ['request_count'] as string[] },
          { start, end },
        ) as ExploreResultV4,
      )
    },
  }

  type MountOptions = {
    onEditTile?: sinon.SinonSpy
    onRemoveTile?: sinon.SinonSpy
    onDuplicateTile?: sinon.SinonSpy
    definition?: TileDefinition
    context?: DashboardRendererContextInternal
    extraProps?: Record<string, any>
    isFullscreen?: boolean
  }

  const mount = ({
    onEditTile = cy.spy(),
    onRemoveTile = cy.spy(),
    onDuplicateTile = cy.spy(),
    definition = mockTileDefinition,
    context = mockContext,
    extraProps = {},
    isFullscreen = false,
  }: MountOptions = {}) => {
    const attrs = {
      onEditTile,
      onRemoveTile,
      onDuplicateTile,
    }

    return cy.mount(DashboardTile, {
      props: {
        ...extraProps,
        definition,
        context,
        isFullscreen,
        queryReady: true,
        refreshCounter: 0,
        tileId: '1',
      },
      attrs,
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider,
        },
      },
    })
  }

  beforeEach(() => {
    cy.viewport(1920, 1080)
    setupPiniaTestStore({ createVueApp: true })
    const analyticsConfigStore = useAnalyticsConfigStore()
    // @ts-ignore - mocking just what we need for the test
    analyticsConfigStore.analyticsConfig = { analytics: { percentiles: true } }
  })

  it('should render tile with title', () => {
    mount()
    cy.getTestId('tile-1').should('be.visible')
    cy.get('.title').should('contain.text', 'Test Chart')
  })

  it('should emit edit-tile event when edit button is clicked', () => {
    mount({ onEditTile: cy.spy().as('editTileSpy') })
    cy.getTestId('edit-tile-1').click()
    cy.get('@editTileSpy').should('have.been.calledWith', mockTileDefinition)
  })

  it('should emit remove-tile event when remove option is clicked', () => {
    mount({ onRemoveTile: cy.spy().as('removeTileSpy') })
    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('remove-tile-1').click()
    cy.get('@removeTileSpy').should('have.been.calledWith', mockTileDefinition)
  })

  it('should emit duplicate-tile event when duplicate option is clicked', () => {
    mount({ onDuplicateTile: cy.spy().as('duplicateTileSpy') })
    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('duplicate-tile-1').click()
    cy.get('@duplicateTileSpy').should('have.been.calledWith', mockTileDefinition)
  })


  it('should show export modal when export option is clicked', () => {
    mount()
    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-csv-export-1').click()
    cy.getTestId('csv-export-modal').should('exist')
  })

  it('should show CSV export by default', () => {
    mount({
      definition: {
        query: mockTileDefinition.query,
        chart: {
          type: 'vertical_bar',
        },
      },
    })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-csv-export-1').should('exist')
  })

  it('should not show CSV export if disabled for chart', () => {
    mount({
      definition: {
        query: mockTileDefinition.query,
        chart: {
          type: 'vertical_bar',
          allow_csv_export: false,
        },
      },
    })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-csv-export-1').should('not.exist')
  })

  it('should not show edit button when context is not editable', () => {
    const nonEditableContext = { ...mockContext, editable: false }
    mount({ context: nonEditableContext })
    cy.getTestId('edit-tile-1').should('not.exist')
  })

  it('jump to explore link should be reactive', () => {
    // Force a different filter so that it actually re-issues the query.
    const context: DashboardRendererContextInternal = {
      ...mockContext,
      filters: [{ field: 'status_code', operator: 'in', value: ['test1'] }],
    }
    mount({ context })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-jump-to-explore-1').should('exist')

    // Granularity comes from the query response, so make sure that it gets picked up in the link.
    cy.getTestId('chart-jump-to-explore-1').invoke('attr', 'href').should('have.string', 'granularity')
  })

  it('should not show jump to explore link if query definition is missing', () => {
    mount({
      // @ts-ignore we're intentionally not including a query in this definition
      definition: {
        chart: mockTileDefinition.chart,
      },
    })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-jump-to-explore-1').should('not.exist')
  })

  it('excludes irrelevant context filters from the jump to explore URL', () => {
    // Passes an llm_usage filter into an api_usage tile
    const context: DashboardRendererContextInternal = {
      ...mockContext,
      filters: [{ field: 'ai_response_model', operator: 'in', value: ['my-model'] }],
    }

    mount({ context })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-jump-to-explore-1').should('exist')

    cy.getTestId('chart-jump-to-explore-1')
      .invoke('attr', 'href')
      .should('not.have.string', 'response_model')
  })

  it('excludes irrelevant context filters from the jump to requests URL', () => {
    // Passes an llm_usage filter into an api_usage tile
    const context = {
      ...mockContext,
      filters: [{ field: 'response_model', operator: 'in', value: 'my-model' }] as any,
    }

    mount({ context })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-jump-to-requests-1').should('exist')

    cy.getTestId('chart-jump-to-requests-1')
      .invoke('attr', 'href')
      .should('not.have.string', 'response_model')
  })

  it('should show aged out warning when query granularity does not match saved granularity', () => {
    mount({
      definition: {
        ...mockTileDefinitionWithTimerange,
        query: {
          ...mockTileDefinitionWithTimerange.query,
          granularity: 'minutely',
        },
      },
    })

    cy.getTestId('time-range-badge').should('exist')
    cy.getTestId('kui-icon-svg-warning-icon').should('exist')
  })

  it('should not show aged out warning when query granularity matches granularity', () => {
    mount({
      definition: {
        ...mockTileDefinitionWithTimerange,
        query: {
          ...mockTileDefinitionWithTimerange.query,
          granularity: 'hourly',
        },
      },
    })

    cy.getTestId('time-range-badge').should('exist')
    cy.getTestId('kui-icon-svg-warning-icon').should('not.exist')
  })

  it('should not show aged out warning when query is not ready', () => {
    mount({
      definition: {
        ...mockTileDefinitionWithTimerange,
        query: {
          ...mockTileDefinitionWithTimerange.query,
          granularity: 'hourly',
        },
      },
      extraProps: {
        queryReady: false,
      },
    })

    cy.getTestId('time-range-badge').should('exist')
    cy.getTestId('kui-icon-svg-warning-icon').should('not.exist')
  })

  it('should not show aged out warning when saved granularity is missing', () => {
    // No saved granularity; even with a real query granularity there should be no warning
    mount({
      definition: {
        ...mockTileDefinitionWithTimerange,
        query: {
          ...mockTileDefinitionWithTimerange.query,
          granularity: undefined,
        },
      },
      extraProps: {
        queryReady: false,
      },
    })

    cy.getTestId('time-range-badge').should('exist')
    cy.getTestId('kui-icon-svg-warning-icon').should('not.exist')
  })

  it('jump to requests link should be reactive', () => {
    // Force a different filter so that it actually re-issues the query.
    const context: DashboardRendererContextInternal = {
      ...mockContext,
      filters: [{ field: 'status_code', operator: 'in', value: ['test1'] }],
    }
    mount({ context })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-jump-to-requests-1').should('exist')

    // "status_code" is in the filter, so make sure that it gets picked up in the link.
    cy.getTestId('chart-jump-to-requests-1').invoke('attr', 'href').should('have.string', 'status_code')
  })

  it('should not show jump to requests link if query definition is missing', () => {
    mount({
      // @ts-ignore we're intentionally not including a query in this definition
      definition: {
        chart: mockTileDefinition.chart,
      },
    })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-jump-to-requests-1').should('not.exist')
  })

  it('should not show jump to requests link if datasource is llm_usage', () => {
    mount({
      definition: {
        chart: mockTileDefinition.chart,
        query: {
          datasource: 'llm_usage',
          metrics: [],
          filters: [],
        },
      },
    })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-jump-to-requests-1').should('not.exist')
  })

  it('should use start and end from explore result for request link', () => {
    mount({
      definition: {
        chart: mockTileDefinition.chart,
        query: {
          datasource: 'api_usage',
          metrics: [],
          filters: [],
          time_range: {
            type: 'absolute',
            start: '2025-01-01',
            end: '2025-02-01',
          },
        },
      },
    })

    cy.getTestId('kebab-action-menu-1').click()
    // generateSingleMetricTimeSeriesData creates data from "6 hours ago" to "now", so the link should reflect that,
    // not the time range in the query definition.
    cy.getTestId('chart-jump-to-requests-1').invoke('attr', 'href').should('have.string', `"start":"${start}","end":"${end}"`)
  })

  it('should not show explore if datasource is unsupported', () => {
    mount({
      definition: {
        chart: mockTileDefinition.chart,
        query: {
          // @ts-ignore intentionally invalid
          datasource: 'random_unsupported_source',
          metrics: [],
          filters: [],
        },
      },
    })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-jump-to-explore-1').should('not.exist')
  })

  it('should not show explore if exploreBaseUrl is undefined', () => {
    const mockQueryProviderWithEmptyExplore = {
      ...mockQueryProvider,
      exploreBaseUrl: async () => undefined,
    }
    cy.mount(DashboardTile, {
      props: {
        definition: mockTileDefinition,
        context: mockContext,
        queryReady: true,
        refreshCounter: 0,
        tileId: '1',
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProviderWithEmptyExplore,
        },
      },
    })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-jump-to-explore-1').should('not.exist')
  })

  it('should not show requests if requestsBaseUrl is undefined', () => {
    const mockQueryProviderWithEmptyRequests = {
      ...mockQueryProvider,
      requestsBaseUrl: async () => undefined,
    }
    cy.mount(DashboardTile, {
      props: {
        definition: mockTileDefinition,
        context: mockContext,
        queryReady: true,
        refreshCounter: 0,
        tileId: '1',
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProviderWithEmptyRequests,
        },
      },
    })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-jump-to-requests-1').should('not.exist')
  })

  it('should not show requests if datasource is unsupported', () => {
    mount({
      definition: {
        chart: mockTileDefinition.chart,
        query: {
          datasource: 'llm_usage',
          metrics: [],
          filters: [],
        },
      },
    })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-jump-to-requests-1').should('not.exist')
  })

  it('should hide kebab menu while fullscreen', () => {
    mount()
    cy.getTestId('kebab-action-menu-1').should('exist')
    mount({ isFullscreen: true })
    cy.getTestId('kebab-action-menu-1').should('not.exist')
  })

  it('should include limit override when chart type is choropleth', () => {
    const provider = { ...mockQueryProvider }
    cy.spy(provider, 'queryFn').as('fetcher')

    cy.mount(DashboardTile, {
      props: {
        definition: {
          chart: {
            type: 'choropleth_map',
          },
          query: {
            datasource: 'api_usage',
            dimensions: ['country_code'],
            metrics: ['request_count'],
          },
        },
        context: mockContext,
        tileId: 1,
        queryReady: true,
        refreshCounter: 0,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: provider,
        },
      },
    }).then(async () => {
      cy.get('@fetcher').should('have.been.calledOnce')
      cy.get('@fetcher')
        .its('firstCall.args.0.query.limit')
        .should('eq', COUNTRIES.length)
    })
  })

  it('hides the truncation warning when a limit is explicitly set', () => {
    const queryFn = cy.stub().as('queryFn').callsFake(() => {
      return Promise.resolve(
        generateSingleMetricTimeSeriesData(
          { name: 'TotalRequests', unit: 'count' },
          { status_code: ['request_count'] as string[] },
          { start, end, truncated: true, limit: 50 },
        ) as ExploreResultV4,
      )
    })

    // When this tile is mounted we're going to get a response with
    // `truncated: true` and `limit: 50`. We don't expect to try and hide the
    // truncation warning as the query we're running doesn't set a limit
    const noLimitTile = cacheBustTile(mockTileDefinition)
    expect(noLimitTile.query.limit).to.eq(undefined)
    cy.mount(DashboardTile, {
      props: {
        definition: noLimitTile,
        context: mockContext,
        tileId: 1,
        queryReady: true,
        refreshCounter: 0,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: { ...mockQueryProvider, queryFn },
        },
        stubs: {
          AnalyticsChart: {
            props: ['chartOptions'],
            template: '<div data-cy="stubbed" />',
            mounted() {
              expect(this.chartOptions.hideTruncationWarning).to.eq(false)
            },
          },
        },
      },
    })

    // We get the same response for this tile, but this time we're going to try
    // to hide the truncation warning because the query explicitly sets a limit
    // so we don't care what the response from the server is
    const tile = cacheBustTile(mockTileDefinition)
    const limitTile = {
      ...tile,
      query: {
        ...tile.query,
        limit: 10, // this causes `hideTruncationWarning` to be set to `true`
      },
    }
    cy.mount(DashboardTile, {
      props: {
        definition: limitTile,
        context: mockContext,
        tileId: 1,
        queryReady: true,
        refreshCounter: 0,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: { ...mockQueryProvider, queryFn },
        },
        stubs: {
          AnalyticsChart: {
            props: ['chartOptions'],
            template: '<div data-cy="stubbed" />',
            mounted() {
              expect(this.chartOptions.hideTruncationWarning).to.eq(true)
            },
          },
        },
      },
    })
  })

  context('export', () => {
    it('calls queryFn with a limit when exporting CSV (defaults to EXPORT_RECORD_LIMIT)', () => {
      const queryFn = cy.stub().as('queryFn').callsFake(() => {
        return Promise.resolve(
          generateSingleMetricTimeSeriesData(
            { name: 'TotalRequests', unit: 'count' },
            { status_code: ['request_count'] as string[] },
            { start, end },
          ) as ExploreResultV4,
        )
      })

      cy.mount(DashboardTile, {
        props: {
          definition: mockTileDefinition,
          context: mockContext,
          tileId: 1,
          queryReady: true,
          refreshCounter: 0,
        },
        global: {
          provide: {
            [INJECT_QUERY_PROVIDER]: { ...mockQueryProvider, queryFn },
          },
        },
      })

      cy.getTestId('kebab-action-menu-1').click()
      cy.getTestId('chart-csv-export-1').click()

      cy.get('@queryFn').should('have.been.calledOnce')
        .then((stub) => {
          // @ts-ignore getCall does exist. cypress being cypress
          const payload = stub.getCall(0).args[0]

          expect(payload).to.have.property('datasource', 'api_usage')
          expect(payload).to.have.property('query')
          expect(payload.query).to.have.property('limit', EXPORT_RECORD_LIMIT)
        })
    })

    it("doesn't call queryFn with increased limit when not allowed", () => {
      const queryFn = cy.stub().as('queryFn').callsFake(() => {
        return Promise.resolve(
          generateSingleMetricTimeSeriesData(
            { name: 'TotalRequests', unit: 'count' },
            { status_code: ['request_count'] as string[] },
            { start, end },
          ) as ExploreResultV4,
        )
      })

      cy.mount(DashboardTile, {
        props: {
          definition: cacheBustTile(mockTileDefinition),
          context: mockContext,
          queryReady: true,
          refreshCounter: 0,
          tileId: 1,
        },
        global: {
          provide: {
            [INJECT_QUERY_PROVIDER]: { ...mockQueryProvider, queryFn, staticConfig: { increaseCsvExportLimit: false } },
          },
        },
      })

      cy.getTestId('kebab-action-menu-1').click()
      cy.getTestId('chart-csv-export-1').click()
      cy.getTestId('csv-export-modal').find('.vitals-table').should('exist')

      cy.get('@queryFn').should('have.been.calledOnce')
        .then((stub) => {
          // @ts-ignore getCall does exist. cypress being cypress
          const payload = stub.getCall(0).args[0]

          expect(payload).to.have.property('datasource', 'api_usage')
          expect(payload).to.have.property('query')
          expect(payload.query.limit).to.equal(undefined)
        })
    })

    it('handles deferred loading', () => {
      const queryFn = cy.stub().as('queryFn').callsFake(() => {
        return Promise.resolve(
          generateSingleMetricTimeSeriesData(
            { name: 'TotalRequests', unit: 'count' },
            { status_code: ['request_count'] as string[] },
            { start, end },
          ) as ExploreResultV4,
        )
      })

      cy.mount(DashboardTile, {
        props: {
          definition: cacheBustTile(mockTileDefinition),
          context: mockContext,
          queryReady: false,
          refreshCounter: 0,
          tileId: 1,
        },
        global: {
          provide: {
            [INJECT_QUERY_PROVIDER]: { ...mockQueryProvider, queryFn, staticConfig: { increaseCsvExportLimit: false } },
          },
        },
      }).then(({ wrapper }) => {
        cy.getTestId('kebab-action-menu-1').click()
        cy.getTestId('chart-csv-export-1').click()
        cy.getTestId('csv-export-modal').should('exist')
        cy.getTestId('csv-export-modal').find('.vitals-table').should('not.exist')
        cy.getTestId('csv-export-modal').find('.chart-skeleton').should('exist')

        // Why is the 'then' needed here?  I don't know, but if it's not here, Cypress barges on and
        // sets props on the wrapper before it finishes its assertions.
        cy.get('@queryFn').should('not.have.been.called').then(() => {
          // Update the queryReady prop
          wrapper.setProps({ queryReady: true }).then(() => {
            cy.getTestId('csv-export-modal').find('.vitals-table').should('exist')

            cy.get('@queryFn').should('have.been.calledOnce')
          })
        })
      })
    })
  })
})
