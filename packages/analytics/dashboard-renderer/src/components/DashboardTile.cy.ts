import DashboardTile from './DashboardTile.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'
import type { DashboardRendererContextInternal } from '../types'
import { generateSingleMetricTimeSeriesData, type ExploreResultV4, type TileDefinition } from '@kong-ui-public/analytics-utilities'

describe('<DashboardTile />', () => {
  const mockTileDefinition: TileDefinition = {
    chart: {
      type: 'timeseries_line',
      chartTitle: 'Test Chart',
      allowCsvExport: true,
    },
    query: {
      datasource: 'advanced',
      metrics: [],
      filters: [],
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
    exploreBaseUrl: () => 'http://test.com/explore',
    evaluateFeatureFlagFn: () => true,
    queryFn: () => Promise.resolve(
      generateSingleMetricTimeSeriesData(
        { name: 'TotalRequests', unit: 'count' },
        { statusCode: ['request_count'] as string[] },
      ) as ExploreResultV4,
    ),
  }

  it('should render tile with title', () => {
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
          [INJECT_QUERY_PROVIDER]: mockQueryProvider,
        },
      },
    })

    cy.getTestId('tile-1').should('be.visible')
    cy.get('.title').should('contain.text', 'Test Chart')
  })

  it('should emit edit-tile event when edit button is clicked', () => {
    cy.mount(DashboardTile, {
      props: {
        definition: mockTileDefinition,
        context: mockContext,
        queryReady: true,
        refreshCounter: 0,
        tileId: '1',
      },
      attrs: {
        onEditTile: cy.spy().as('editTileSpy'),
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider,
        },
      },
    })

    cy.getTestId('edit-tile-1').click()
    cy.get('@editTileSpy').should('have.been.calledWith', mockTileDefinition)
  })

  it('should emit remove-tile event when remove option is clicked', () => {
    cy.mount(DashboardTile, {
      props: {
        definition: mockTileDefinition,
        context: mockContext,
        queryReady: true,
        refreshCounter: 0,
        tileId: '1',
      },
      attrs: {
        onRemoveTile: cy.spy().as('removeTileSpy'),
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider,
        },
      },
    })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('remove-tile-1').click()
    cy.get('@removeTileSpy').should('have.been.calledWith', mockTileDefinition)
  })

  it('should show export modal when export option is clicked', () => {
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
          [INJECT_QUERY_PROVIDER]: mockQueryProvider,
        },
      },
    })

    cy.getTestId('kebab-action-menu-1').click()
    cy.getTestId('chart-csv-export-1').click()
    cy.getTestId('csv-export-modal').should('exist')
  })

  it('should not show edit button when context is not editable', () => {
    const nonEditableContext = { ...mockContext, editable: false }

    cy.mount(DashboardTile, {
      props: {
        definition: mockTileDefinition,
        context: nonEditableContext,
        queryReady: true,
        refreshCounter: 0,
        tileId: '1',
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider,
        },
      },
    })

    cy.getTestId('edit-tile-1').should('not.exist')
  })
})
