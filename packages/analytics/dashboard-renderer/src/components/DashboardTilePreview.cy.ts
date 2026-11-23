import DashboardTilePreview from './DashboardTilePreview.vue'
import DashboardTile from './DashboardTile.vue'
import TimeseriesChartRenderer from './TimeseriesChartRenderer.vue'
import { defineComponent, h, onMounted } from 'vue'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'
import { INJECT_QUERY_PROVIDER, TILE_DATA_EMPTY, TILE_DATA_LOADING } from '../constants'
import type { DashboardRendererContext, SuppliedTileData } from '../types'
import type {
  AllFilters,
  ApiRequestsResult,
  ExploreResultV4,
  PlatformTabularResponse,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'
import { useAnalyticsConfigStore } from '@kong-ui-public/analytics-config-store'

describe('<DashboardTilePreview />', () => {
  beforeEach(() => {
    setupPiniaTestStore()
  })

  const setup = async ({
    definition: definitionOverride,
    editable,
    wrappedInDivWithHeight,
    metrics = ['response_size_p99'],
  }: {
    definition?: TileDefinition
    editable?: boolean
    wrappedInDivWithHeight?: number
    metrics?: any[]
  } = {}) => {
    const globalFilters: AllFilters[] = []

    const context: DashboardRendererContext = {
      filters: [],
      ...(editable !== undefined && {
        editable: editable,
      }),
    }

    const definition: TileDefinition = definitionOverride ?? {
      chart: {
        type: 'horizontal_bar',
      },
      query: {
        datasource: 'api_usage',
        metrics,
        dimensions: ['control_plane'],
        filters: [],
      },
    }

    cy.mount(DashboardTilePreview, {
      attachTo: document.body,
      devTools: false,
      props: {
        globalFilters,
        context,
        definition,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: {
            configFn: () => Promise.resolve(),
            datasourceConfigFn: () => Promise.resolve([]),
          },
        },
        stubs: {
          // eslint-disable-next-line vue/one-component-per-file
          DashboardTile: defineComponent({
            name: 'DashboardTile',
            props: Object.keys(DashboardTile.props ?? {}),
            emits: ['update:refreshCounter'],
            setup(props) {
              return () => h(
                'pre',
                {
                  'data-testid': 'test-stub',
                  'data-props': JSON.stringify(props),
                  'data-preview-props': JSON.stringify({ context, definition, globalFilters }),
                },
                `Stubbed DashboardTile DashboardTilePreview props:
                  ${JSON.stringify({ context, definition, globalFilters }, null, 2)}
                  DashboardTile props:
                  ${JSON.stringify(props, null, 2)}`,
              )
            },
          }),
        },
      },
    }).then(() => {
      if (wrappedInDivWithHeight) {
        // cypress wraps all mounted components in a `<div data-v-app>` with a default
        // height of 500ish.
        const wrappers = document.querySelectorAll('[data-v-app]')
        wrappers.forEach((ell) => {
          const el = ell as HTMLElement
          if (el.querySelector('[data-testid="dashboard-tile-preview-root"]')) {
            el.style.height = `${wrappedInDivWithHeight}px`
          } else {
            // get rid of all other nonsense vue debugger stuff just so the test looks nice
            el.style.display = 'none'
          }
        })
      }
    })
  }

  const getTileProps = (attr = 'data-props') => {
    return cy.getTestId('test-stub')
      .invoke('attr', attr)
      .then(JSON.parse)
  }

  const expectPropIs = (propPath: string, expectedValue: any, fromPreview = false) => {
    cy.getTestId('test-stub').should(($el: any) => {
      const el = $el[0] as HTMLElement
      const props = fromPreview
        ? JSON.parse(el.getAttribute('data-preview-props') ?? '')
        : JSON.parse(el.getAttribute('data-props') ?? '')

      const actualValue: any = propPath.split('.').reduce((acc, key) => acc[key], props)
      expect(actualValue).to.deep.eq(expectedValue)
    })
  }

  const expectPreviewPropIs = (propPath: string, expectedValue: any) => {
    return expectPropIs(propPath, expectedValue, true)
  }

  const expectTilePropIs = (propPath: string, expectedValue: any) => {
    return expectPropIs(propPath, expectedValue, false)
  }

  it('uses the height of its parent as the DashboardTile prop', () => {
    setup({ wrappedInDivWithHeight: 100 })
    expectPropIs('height', 100)
  })

  it('always sets a non-interactive context', () => {
    setup({ editable: true })
    expectPreviewPropIs('context.editable', true)
    expectTilePropIs('context.editable', false)

    setup({ editable: false })
    expectPreviewPropIs('context.editable', false)
    expectTilePropIs('context.editable', false)
  })

  it('sets hideActions', () => {
    setup()
    expectTilePropIs('hideActions', '') // this is actually `true` because of how simple props work in vue
  })

  it('sets showRefresh', () => {
    setup()
    expectTilePropIs('showRefresh', '') // this is actually `true` because of how simple props work in vue
  })

  it('sets a random tile id for each instance', () => {
    setup()
    let firstTileId: string
    getTileProps().then((props: any) => {
      expect(props.tileId).to.not.eq(undefined)
      firstTileId = props.tileId
    })

    setup()
    getTileProps().then((props: any) => {
      expect(props.tileId).to.not.eq(undefined)
      expect(props.tileId).to.not.eq(firstTileId)
    })
  })

  it('sets a default timeSpec when one is not provided', () => {
    setup()
    const configStore = useAnalyticsConfigStore()
    expectPreviewPropIs('context.timeSpec', undefined)
    expectTilePropIs('context.timeSpec', {
      type: 'relative',
      time_range: configStore.defaultQueryTimeForOrg,
    })
  })

  it('shows the "Chart not configured" empty state when metrics are not provided', () => {
    setup({ metrics: [] })
    cy.getTestId('chart-not-configured-empty-state').should('exist')
    cy.getTestId('test-stub').should('not.exist')
  })

  it('passes table chart definitions to DashboardTile without showing the chart empty state', () => {
    const definition: TileDefinition = {
      chart: {
        type: 'table',
        chart_title: 'Routes',
      },
      query: {
        datasource: 'platform',
        entity: 'route',
        columns: ['name', 'control_plane'],
      },
    }

    setup({ definition })

    cy.getTestId('chart-not-configured-empty-state').should('not.exist')
    cy.getTestId('test-stub').should('exist')
    expectPreviewPropIs('definition', definition)
    expectTilePropIs('definition', definition)
    expectTilePropIs('tileType', undefined)
  })

  it('shows the "Chart not configured" empty state for table chart definitions without columns', () => {
    const definition: TileDefinition = {
      chart: {
        type: 'table',
        chart_title: 'Routes',
      },
      query: {
        datasource: 'platform',
        entity: 'route',
        columns: [],
      },
    }

    setup({ definition })

    cy.getTestId('chart-not-configured-empty-state').should('exist')
    cy.getTestId('test-stub').should('not.exist')
  })

  it('passes table chart definitions that rely on response metadata columns to DashboardTile', () => {
    const definition: TileDefinition = {
      chart: {
        type: 'table',
        chart_title: 'Routes',
      },
      query: {
        datasource: 'platform',
        entity: 'route',
      },
    }

    setup({ definition })

    cy.getTestId('chart-not-configured-empty-state').should('not.exist')
    cy.getTestId('test-stub').should('exist')
    expectTilePropIs('definition', definition)
  })

  it('forwards getExportData to child DashboardTile', () => {
    const mockExportData = {
      data: [{ event: { request_count: 42 }, timestamp: '2024-01-01T00:00:00Z' }],
      meta: {
        start_ms: 1704067200000,
        end_ms: 1704153600000,
        granularity_ms: 3600000,
        metric_names: ['request_count'],
        metric_units: { request_count: 'count' },
        display: {},
        query_id: '',
      },
    }

    const context: DashboardRendererContext = {
      filters: [],
    }

    const definition: TileDefinition = {
      chart: {
        type: 'horizontal_bar',
      },
      query: {
        datasource: 'api_usage',
        metrics: ['request_count'],
        dimensions: ['control_plane'],
        filters: [],
      },
    }

    cy.mount(DashboardTilePreview, {
      props: {
        globalFilters: [],
        context,
        definition,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: {
            configFn: () => Promise.resolve(),
            datasourceConfigFn: () => Promise.resolve([]),
          },
        },
        stubs: {
          // eslint-disable-next-line vue/one-component-per-file
          DashboardTile: defineComponent({
            name: 'DashboardTile',
            props: Object.keys(DashboardTile.props ?? {}),
            emits: ['update:refreshCounter', 'chart-data'],
            setup(_props, { expose }) {
              expose({
                getExportData: () => Promise.resolve(mockExportData),
              })

              return () => h('div', { 'data-testid': 'export-stub' }, 'Stub')
            },
          }),
        },
      },
    }).then(({ wrapper }) => {
      const exposed = wrapper.vm.$.exposed

      return cy.wrap(exposed?.getExportData()).then((result: any) => {
        expect(result).to.deep.equal(mockExportData)
      })
    })
  })

  it('forwards chart-data emit from DashboardTile', () => {
    const chartDataSpy = cy.spy().as('chartDataSpy')
    const mockChartData = {
      data: [{ event: { request_count: 100 }, timestamp: '2024-01-01T00:00:00Z' }],
      meta: {
        start_ms: 1704067200000,
        end_ms: 1704153600000,
        granularity_ms: 3600000,
        metric_names: ['request_count'],
        metric_units: { request_count: 'count' },
        display: {},
        query_id: '',
      },
    }

    const context: DashboardRendererContext = {
      filters: [],
    }

    const definition: TileDefinition = {
      chart: {
        type: 'horizontal_bar',
      },
      query: {
        datasource: 'api_usage',
        metrics: ['request_count'],
        dimensions: ['control_plane'],
        filters: [],
      },
    }

    cy.mount(DashboardTilePreview, {
      attachTo: document.body,
      props: {
        globalFilters: [],
        context,
        definition,
      },
      attrs: {
        onChartData: chartDataSpy,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: {
            configFn: () => Promise.resolve(),
            datasourceConfigFn: () => Promise.resolve([]),
          },
        },
        stubs: {
          // eslint-disable-next-line vue/one-component-per-file
          DashboardTile: defineComponent({
            name: 'DashboardTile',
            props: Object.keys(DashboardTile.props ?? {}),
            emits: ['update:refreshCounter', 'chart-data'],
            setup(_props, { emit }) {
              onMounted(() => {
                emit('chart-data', mockChartData)
              })

              return () => h('div', { 'data-testid': 'chart-data-stub' }, 'Stub')
            },
          }),
        },
      },
    })

    cy.get('@chartDataSpy').should('have.been.calledOnce').then(() => {
      const emitted = chartDataSpy.getCall(0).args[0]
      expect(emitted).to.have.property('meta')
      expect(emitted.meta).to.have.property('granularity_ms', 3600000)
    })
  })
})

describe('<DashboardTilePreview /> with supplied data', () => {
  const START = '2024-06-16T00:00:00.000Z'
  const END = '2024-06-16T01:00:00.000Z'

  const exploreResult: ExploreResultV4 = {
    data: [
      { timestamp: START, event: { request_count: 3 } },
      { timestamp: END, event: { request_count: 5 } },
    ],
    meta: {
      start: START,
      end: END,
      granularity_ms: 3_600_000,
      display: {},
      metric_names: ['request_count'],
      metric_units: { request_count: 'count' },
      query_id: '',
    },
  } as unknown as ExploreResultV4

  const tabularResponse: PlatformTabularResponse = {
    records: [
      { name: 'route-a', control_plane: 'cp-1' },
      { name: 'route-b', control_plane: 'cp-2' },
    ],
    meta: {
      query_id: '',
      entity: 'route',
      columns: ['name', 'control_plane'],
      page_size: 25,
      display: {},
    },
  }

  const requestsResult: ApiRequestsResult = {
    results: [
      { request_start: START, latencies_response_ms: 10 },
      { request_start: END, latencies_response_ms: 20 },
    ],
    meta: { query_id: '', time_range: { start: START, end: END }, size: 2 },
  }

  const timeseriesDefinition: TileDefinition = {
    chart: { type: 'timeseries_line', chart_title: 'Requests' },
    query: { datasource: 'api_usage', metrics: ['request_count'], dimensions: ['time'] },
  }

  const tableDefinition: TileDefinition = {
    chart: { type: 'table', chart_title: 'Routes' },
    query: { datasource: 'platform', entity: 'route', columns: ['name', 'control_plane'] },
  }

  const scatterDefinition: TileDefinition = {
    chart: { type: 'scatter', chart_title: 'Latency' },
    query: { datasource: 'requests', metric: 'latencies_response_ms' },
  } as TileDefinition

  beforeEach(() => {
    cy.viewport(1200, 800)
    setupPiniaTestStore()
  })

  const mountPreview = ({
    definition,
    attrs = {},
    data,
  }: {
    definition: TileDefinition
    attrs?: Record<string, unknown>
    data?: SuppliedTileData
  }) => {
    const bridge = {
      configFn: () => Promise.resolve({ analytics: { percentiles: true } }),
      datasourceConfigFn: () => Promise.resolve([]),
      evaluateFeatureFlagFn: () => true,
      exploreBaseUrl: async () => 'http://test.com/explore',
      requestsBaseUrl: async () => 'http://test.com/requests',
      queryFn: cy.stub().as('queryFn').resolves(exploreResult),
      tabularQueryFn: cy.stub().as('tabularQueryFn').resolves(tabularResponse),
      requestsQueryFn: cy.stub().as('requestsQueryFn').resolves(requestsResult),
    }

    return cy.mount(DashboardTilePreview, {
      props: {
        context: { filters: [], timeSpec: { type: 'relative', time_range: '1h' } },
        definition,
        data,
      },
      attrs,
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: bridge,
        },
      },
    })
  }

  const expectNoBridgeQuery = () => {
    cy.get('@queryFn').should('not.have.been.called')
    cy.get('@tabularQueryFn').should('not.have.been.called')
    cy.get('@requestsQueryFn').should('not.have.been.called')
  }

  it('renders a chart tile from supplied data and emits chart-data', () => {
    const onChartData = cy.spy().as('chartData')
    mountPreview({ definition: timeseriesDefinition, data: exploreResult, attrs: { onChartData } })

    cy.get('.tile-content canvas').should('exist')
    cy.get('@chartData').should('have.been.calledWith', exploreResult)
    expectNoBridgeQuery()
  })

  it('renders a table tile from supplied data', () => {
    mountPreview({ definition: tableDefinition, data: tabularResponse })

    cy.get('.table-data-grid-renderer').should('contain.text', 'route-a')
    cy.get('.table-data-grid-renderer').should('contain.text', 'route-b')
    expectNoBridgeQuery()
  })

  it('renders a scatter tile from supplied data', () => {
    mountPreview({ definition: scatterDefinition, data: requestsResult })

    cy.get('.tile-content canvas').should('exist')
    cy.getTestId('scatter-chart-empty-state').should('not.exist')
    expectNoBridgeQuery()
  })

  it('shows the loading state for TILE_DATA_LOADING', () => {
    mountPreview({ definition: timeseriesDefinition, data: TILE_DATA_LOADING })

    cy.get('.chart-skeleton').should('exist')
    expectNoBridgeQuery()
  })

  it('shows the empty state for TILE_DATA_EMPTY', () => {
    mountPreview({ definition: timeseriesDefinition, data: TILE_DATA_EMPTY })

    cy.getTestId('chart-no-data-state').should('exist')
    expectNoBridgeQuery()
  })

  it('shows the error state with the message of a supplied Error', () => {
    mountPreview({ definition: timeseriesDefinition, data: new Error('Host fetch failed') })

    cy.getTestId('chart-empty-state').should('contain.text', 'Host fetch failed')
    expectNoBridgeQuery()
  })

  it('shows the loading, empty, and error states for table and scatter tiles', () => {
    mountPreview({ definition: tableDefinition, data: TILE_DATA_LOADING })
    cy.getTestId('table-skeleton').should('exist')

    mountPreview({ definition: tableDefinition, data: TILE_DATA_EMPTY })
    cy.getTestId('table-empty-state').should('exist')

    mountPreview({ definition: tableDefinition, data: new Error('Table failed') })
    cy.getTestId('table-supplied-data-error').should('contain.text', 'Table failed')

    mountPreview({ definition: scatterDefinition, data: TILE_DATA_EMPTY })
    cy.getTestId('scatter-chart-no-data-state').should('exist')

    mountPreview({ definition: scatterDefinition, data: new Error('Scatter failed') })
    cy.getTestId('scatter-chart-empty-state').should('contain.text', 'Scatter failed')
    expectNoBridgeQuery()
  })

  it('shows the error state when the data does not match the tile type', () => {
    mountPreview({ definition: tableDefinition, data: exploreResult })
    cy.getTestId('table-supplied-data-error').should('contain.text', "doesn't match this tile type")

    mountPreview({ definition: scatterDefinition, data: exploreResult })
    cy.getTestId('scatter-chart-empty-state').should('contain.text', "doesn't match this tile type")

    mountPreview({ definition: timeseriesDefinition, data: tabularResponse })
    cy.getTestId('chart-empty-state').should('contain.text', "doesn't match this tile type")
    expectNoBridgeQuery()
  })

  it('hides the refresh action', () => {
    mountPreview({ definition: timeseriesDefinition, data: exploreResult })

    cy.get('.refresh-button').should('not.exist')
  })

  it('skips the "Chart not configured" state', () => {
    mountPreview({
      definition: { ...timeseriesDefinition, query: { datasource: 'api_usage', metrics: [] } } as TileDefinition,
      data: exploreResult,
    })

    cy.getTestId('chart-not-configured-empty-state').should('not.exist')
    cy.get('.tile-content canvas').should('exist')
  })

  it('shows the "Chart not configured" state for a requests scatter tile with no metric', () => {
    mountPreview({
      definition: { ...scatterDefinition, query: { datasource: 'requests' } } as TileDefinition,
      data: requestsResult,
    })

    cy.getTestId('chart-not-configured-empty-state').should('exist')
    cy.get('.tile-content canvas').should('not.exist')
    expectNoBridgeQuery()
  })

  it('emits tile-time-range-zoom on zoom without running a query', () => {
    const onTileTimeRangeZoom = cy.spy().as('zoom')
    const timeRange = { type: 'absolute', start: new Date(START), end: new Date(END) }

    mountPreview({ definition: timeseriesDefinition, data: exploreResult, attrs: { onTileTimeRangeZoom } })
      .then(({ wrapper }) => {
        wrapper.findComponent(TimeseriesChartRenderer).vm.$emit('zoom-time-range', timeRange)
      })

    cy.get('@zoom').should('have.been.calledOnce')
      .its('firstCall.args.0.timeRange').should('deep.equal', timeRange)
    expectNoBridgeQuery()
  })

  it('stops querying when the host starts passing data after mount', () => {
    const onChartData = cy.spy().as('chartData')
    mountPreview({ definition: timeseriesDefinition, attrs: { onChartData } }).then(({ wrapper }) => {
      cy.get('@queryFn').should('have.been.calledOnce').then(() => {
        const suppliedResult = { ...exploreResult, meta: { ...exploreResult.meta, query_id: 'supplied' } }

        return wrapper.setProps({ data: suppliedResult }).then(() => {
          cy.get('@chartData').should('have.been.calledWith', suppliedResult)
          cy.get('.refresh-button').should('not.exist')
          cy.get('@queryFn').should('have.been.calledOnce')
        })
      })
    })
  })

  it('runs the query when data is not passed', () => {
    mountPreview({ definition: timeseriesDefinition })

    cy.get('@queryFn').should('have.been.called')
    cy.get('.refresh-button').should('exist')
  })
})
