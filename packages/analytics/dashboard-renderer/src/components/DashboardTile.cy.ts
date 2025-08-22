import DashboardTile from './DashboardTile.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'
import type { DashboardRendererContextInternal } from '../types'
import { generateSingleMetricTimeSeriesData, type ExploreResultV4, type TileDefinition } from '@kong-ui-public/analytics-utilities'

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

  const mockContext: DashboardRendererContextInternal = {
    filters: [],
    timeSpec: {
      type: 'relative',
      time_range: '15m',
    },
    editable: true,
    tz: '',
    refreshInterval: 0,
  }

  const mockQueryProvider = {
    exploreBaseUrl: async () => 'http://test.com/explore',
    requestsBaseUrl: async () => 'http://test.com/requests',
    evaluateFeatureFlagFn: () => true,
    queryFn: () => Promise.resolve(
      generateSingleMetricTimeSeriesData(
        { name: 'TotalRequests', unit: 'count' },
        { statusCode: ['request_count'] as string[] },
      ) as ExploreResultV4,
    ),
  }

  type MountOptions = {
    onEditTile?: sinon.SinonSpy
    onRemoveTile?: sinon.SinonSpy
    onDuplicateTile?: sinon.SinonSpy
    definition?: TileDefinition
    context?: DashboardRendererContextInternal
    extraProps?: Record<string, any>
  }

  const mount = ({
    onEditTile = cy.spy(),
    onRemoveTile = cy.spy(),
    onDuplicateTile = cy.spy(),
    definition = mockTileDefinition,
    context = mockContext,
    extraProps = {},
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
    const context = {
      ...mockContext,
      filters: [{ field: 'status_code', operator: 'eq', value: 'test1' }],
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
    const context = {
      ...mockContext,
      filters: [{ field: 'response_model', operator: 'in', value: 'my-model' }],
    }

    mount({ context })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-jump-to-explore-1').should('exist')

    cy.getTestId('chart-jump-to-explore-1')
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
    const context = {
      ...mockContext,
      filters: [{ field: 'status_code', operator: 'eq', value: 'test1' }],
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
})
