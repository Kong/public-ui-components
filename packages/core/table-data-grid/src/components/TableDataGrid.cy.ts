import type {
  TableDataGridCellAttrs,
  TableDataGridCellSlotProps,
  TableDataGridConfig,
  TableDataGridFetcher,
  TableDataGridGridOptions,
  TableDataGridHeader,
  TableDataGridMode,
  TableDataGridRowAttrs,
  TableDataGridRowSelectionMode,
  TableDataGridStatePayload,
  TableDataGridToolbarSlotProps,
} from '../types'
import type { ColumnState, GridApi } from 'ag-grid-community'
import type { FilterGroupSelection } from '@kong/kongponents'
import type { DefineComponent, PropType, Ref, VNode } from 'vue'
import { defineComponent, h, nextTick, onMounted, ref } from 'vue'
import TableDataGrid from './TableDataGrid.vue'

type TestRow = {
  id: string
  name: string
  status: number
  latency: number
}

type ColumnStateSnapshot = {
  colId: ColumnState['colId']
  pinned: ColumnState['pinned']
  width: ColumnState['width']
}

type TestDatatableProps = {
  headers: Array<TableDataGridHeader<TestRow>>
  fetcher: TableDataGridFetcher<TestRow>
  mode?: TableDataGridMode
  rowKey?: keyof TestRow
  rowSelection?: TableDataGridRowSelectionMode
  loading?: boolean
  error?: boolean
  enableSearch?: boolean
  outsideSearch?: string
  outsideFilters?: string
  hideToolbar?: boolean
  hideBulkActions?: boolean
  hideColumnVisibility?: boolean
  hidePagination?: boolean
  hidePaginationWhenOptional?: boolean
  paginationPageSizeOptions?: number[]
  refreshKey?: string | number
  rowAttrs?: TableDataGridRowAttrs<TestRow>
  cellAttrs?: TableDataGridCellAttrs<TestRow>
  agGridOptions?: TableDataGridGridOptions<TestRow>
  tableConfig?: TableDataGridConfig
  filterSelection?: FilterGroupSelection
}

type CellClickPayload = {
  row: TestRow
  columnKey: string
  value: any
}

type DatatableExposed = {
  refresh: () => void
  selectRowByKey: (key: string) => void
  deselectAll: () => void
  getGridApi: () => GridApi<TestRow> | undefined
}

const rows: TestRow[] = Array.from({ length: 40 }, (_, index) => ({
  id: `row-${index + 1}`,
  name: index === 0 ? 'Gateway service' : `Service ${index + 1}`,
  status: index % 5 === 0 ? 500 : 200,
  latency: 40 + index,
}))

const headers: Array<TableDataGridHeader<TestRow>> = [
  { key: 'name', label: 'Name', sortable: true, hideable: false, width: 220 },
  { key: 'status', label: 'Status', sortable: true, width: 120 },
  { key: 'latency', label: 'Latency', sortable: true, tooltip: 'Response latency in milliseconds', width: 140 },
]

const headersWithNameFilter: Array<TableDataGridHeader<TestRow>> = [
  { ...headers[0], filter: { label: 'Name', pinned: true } },
  ...headers.slice(1),
]

const createNameFilterSelection = (value: string): FilterGroupSelection => ({
  name: {
    operator: 'eq',
    value,
    text: value,
  },
})

const tableConfig: TableDataGridConfig = {
  columnOrder: ['name', 'status', 'latency'],
  columnVisibility: {
    name: true,
    status: true,
    latency: true,
  },
  columnWidths: {},
  pinnedColumns: {},
  pageSize: 15,
}
const secondPageFetcherParams = {
  mode: 'pagination',
  page: 2,
  pageSize: 15,
}
const DatatableComponent = TableDataGrid as DefineComponent<TestDatatableProps>

const createPaginatedFetcher = () => cy.stub().callsFake(({ page = 1, pageSize = 15 }) => {
  const offset = (page - 1) * pageSize

  return Promise.resolve({
    data: rows.slice(offset, offset + pageSize),
    total: rows.length,
  })
})

const createInfiniteFetcher = () => {
  const infiniteRows = Array.from({ length: 40 }, (_, index): TestRow => ({
    id: `infinite-row-${index + 1}`,
    name: `Infinite service ${index + 1}`,
    status: index % 5 === 0 ? 500 : 200,
    latency: 40 + index,
  }))

  return cy.stub().callsFake(({ startRow = 0, pageSize = 15 }) => Promise.resolve({
    data: infiniteRows.slice(startRow, startRow + pageSize),
    cursor: startRow + pageSize,
    hasMore: startRow + pageSize < infiniteRows.length,
  }))
}

const expectInitialFetch = (fetcher: Cypress.Agent<sinon.SinonStub>) => {
  cy.contains('Gateway service').should('be.visible')
  cy.wrap(fetcher).should('have.been.calledOnce')
}

describe('<TableDataGrid />', () => {
  const mountTable = ({
    fetcher = cy.stub().resolves({ data: rows.slice(0, 15), total: rows.length }),
    config = tableConfig,
    headers: tableHeaders = headers,
    mode = 'pagination',
    rowSelection = 'multiple',
    error = false,
    loading = false,
    enableSearch = false,
    outsideSearch = undefined,
    outsideFilters = undefined,
    hideToolbar = false,
    hideBulkActions = false,
    hideColumnVisibility = false,
    hidePagination = false,
    hidePaginationWhenOptional = false,
    refreshKey = undefined,
    rowAttrs = undefined,
    cellAttrs = undefined,
    agGridOptions = {},
    useTableConfig = true,
    onGridReady = undefined,
    onCellClick = undefined,
    onRowClick = undefined,
    onRowSelect = undefined,
    onState = undefined,
    onUpdateTableConfig = undefined,
    onFilterApply = undefined,
    onFilterClear = undefined,
    onFilterOpen = undefined,
    onFilterClose = undefined,
    filterSelection = undefined,
    onUpdateFilterSelection = undefined,
    wrapperWidth = undefined,
    slots = {},
  }: {
    fetcher?: TableDataGridFetcher<TestRow>
    config?: TableDataGridConfig
    headers?: Array<TableDataGridHeader<TestRow>>
    mode?: TableDataGridMode
    rowSelection?: TableDataGridRowSelectionMode
    error?: boolean
    loading?: boolean
    enableSearch?: boolean
    outsideSearch?: string | undefined
    outsideFilters?: string | undefined
    hideToolbar?: boolean
    hideBulkActions?: boolean
    hideColumnVisibility?: boolean
    hidePagination?: boolean
    hidePaginationWhenOptional?: boolean
    refreshKey?: string | number | undefined
    rowAttrs?: TableDataGridRowAttrs<TestRow> | undefined
    cellAttrs?: TableDataGridCellAttrs<TestRow> | undefined
    agGridOptions?: TableDataGridGridOptions<TestRow>
    useTableConfig?: boolean
    onGridReady?: ((api: GridApi<TestRow>) => void) | undefined
    onCellClick?: ((payload: CellClickPayload) => void) | undefined
    onRowClick?: ((row: TestRow) => void) | undefined
    onRowSelect?: ((selectedRows: TestRow[]) => void) | undefined
    onState?: ((payload: TableDataGridStatePayload) => void) | undefined
    onUpdateTableConfig?: ((nextConfig: TableDataGridConfig) => void) | undefined
    onFilterApply?: ((filterKey: string, selection: FilterGroupSelection) => void) | undefined
    onFilterClear?: ((filterKey: string, selection: FilterGroupSelection) => void) | undefined
    onFilterOpen?: ((filterKey: string) => void) | undefined
    onFilterClose?: ((filterKey: string) => void) | undefined
    filterSelection?: FilterGroupSelection | undefined
    onUpdateFilterSelection?: ((nextSelection: FilterGroupSelection) => void) | undefined
    wrapperWidth?: Ref<number> | undefined
    slots?: Record<string, (props: Record<string, any>) => VNode>
  } = {}) => {
    const props = {
      headers: tableHeaders,
      fetcher,
      mode,
      rowKey: 'id',
      rowSelection,
      loading,
      error,
      enableSearch,
      outsideSearch,
      outsideFilters,
      hideToolbar,
      hideBulkActions,
      hideColumnVisibility,
      hidePagination,
      hidePaginationWhenOptional,
      refreshKey,
      rowAttrs,
      cellAttrs,
      agGridOptions,
      paginationPageSizeOptions: [10, 15, 25],
      'onGrid:ready': onGridReady,
      'onCell:click': onCellClick,
      'onRow:click': onRowClick,
      'onRow:select': onRowSelect,
      'onState': onState,
      'onFilter:apply': onFilterApply,
      'onFilter:clear': onFilterClear,
      'onFilter:open': onFilterOpen,
      'onFilter:close': onFilterClose,
      'onUpdate:tableConfig': (nextConfig: TableDataGridConfig) => {
        onUpdateTableConfig?.(nextConfig)
      },
      'onUpdate:filterSelection': (nextSelection: FilterGroupSelection) => {
        onUpdateFilterSelection?.(nextSelection)
      },
    }

    cy.mount(defineComponent({
      setup() {
        return () => h('div', {
          style: wrapperWidth ? { width: `${wrapperWidth.value}px` } : undefined,
        }, [
          h('div', {
            'data-testid': 'outside-search-target',
            id: 'outside-search-target',
          }),
          h('div', {
            'data-testid': 'outside-filters-target',
            id: 'outside-filters-target',
          }),
          h(DatatableComponent, {
            ...props,
            ...(useTableConfig ? { tableConfig: config } : {}),
            ...(filterSelection ? { filterSelection } : {}),
          }, {
            status: ({ row }: TableDataGridCellSlotProps<TestRow>) => h('strong', { 'data-testid': 'status-cell' }, String(row.status)),
            ...slots,
          }),
        ])
      },
    }))

    return { fetcher }
  }

  const mountSyncedTable = ({
    config = tableConfig,
    fetcher = cy.stub().resolves({ data: rows.slice(0, 15), total: rows.length }),
    headers: tableHeaders = headers,
    defaultRowSelection = 'multiple',
    defaultMode = 'pagination',
    onGridReady = undefined,
    onUpdateTableConfig = undefined,
  }: {
    config?: TableDataGridConfig
    fetcher?: TableDataGridFetcher<TestRow>
    headers?: Array<TableDataGridHeader<TestRow>>
    defaultRowSelection?: TableDataGridRowSelectionMode
    defaultMode?: TableDataGridMode
    onGridReady?: ((api: GridApi<TestRow>) => void) | undefined
    onUpdateTableConfig?: ((nextConfig: TableDataGridConfig) => void) | undefined
  } = {}) => {
    const hostConfig = ref(config)
    const syncedHeaders = ref(tableHeaders)
    const rowSelection = ref<TableDataGridRowSelectionMode>(defaultRowSelection)
    const mode = ref<TableDataGridMode>(defaultMode)

    cy.mount(defineComponent({
      setup() {
        return () => h(DatatableComponent, {
          headers: syncedHeaders.value,
          fetcher,
          mode: mode.value,
          rowKey: 'id',
          rowSelection: rowSelection.value,
          paginationPageSizeOptions: [10, 15, 25],
          tableConfig: hostConfig.value,
          'onGrid:ready': onGridReady,
          'onUpdate:tableConfig': (nextConfig: TableDataGridConfig) => {
            hostConfig.value = nextConfig
            onUpdateTableConfig?.(nextConfig)
          },
        }, {
          status: ({ row }: TableDataGridCellSlotProps<TestRow>) => h('strong', { 'data-testid': 'status-cell' }, String(row.status)),
        })
      },
    }))

    return { fetcher, headers: syncedHeaders, hostConfig, mode, rowSelection }
  }

  const hideStatusColumnFromMenu = () => {
    cy.getTestId('column-visibility-trigger').click()
    cy.getTestId('column-visibility-status').click()
    cy.getTestId('column-visibility-status').find('input').should('not.be.checked')
    cy.getTestId('table-data-grid-header-status').should('not.exist')
    cy.getTestId('status-cell').should('not.exist')
    cy.get('@updateTableConfig').should('have.been.calledWithMatch', {
      columnVisibility: {
        status: false,
      },
    })
  }

  const renderSelectedRowsBulkAction = ({ selectedRows }: Record<string, any>) => h('button', {
    'data-testid': 'bulk-action',
  }, `${(selectedRows as TestRow[]).length}:${(selectedRows as TestRow[])[0]?.name}`)

  const goToSecondPage = (fetcher: sinon.SinonStub) => {
    cy.getTestId('next-button').should('not.be.disabled').click()
    cy.wrap(fetcher).should('have.been.calledWithMatch', secondPageFetcherParams)
    cy.contains('Service 16').should('be.visible')
  }

  const getDisplayedColumnWidth = (api: GridApi<TestRow>) => api.getColumnState()
    .filter(column => !column.hide)
    .reduce((total, column) => total + (column.width ?? 0), 0)

  const expectColumnsToFillGrid = (api: GridApi<TestRow>) => {
    cy.get('.table-data-grid-grid .ag-header').then(($header) => {
      const displayedColumnWidth = getDisplayedColumnWidth(api)
      expect(displayedColumnWidth).to.be.greaterThan($header[0].clientWidth - 20)
      expect(displayedColumnWidth).to.be.lessThan($header[0].clientWidth + 20)
    })
  }

  const expectNoHorizontalOverflow = () => {
    cy.get('.table-data-grid-grid .ag-body-horizontal-scroll-viewport').then(($viewport) => {
      expect($viewport[0].scrollWidth).to.be.lessThan($viewport[0].clientWidth + 20)
    })
  }

  const expectHorizontalOverflow = () => {
    cy.get('.table-data-grid-grid .ag-center-cols-viewport').then(($viewport) => {
      expect($viewport[0].scrollWidth).to.be.greaterThan($viewport[0].clientWidth)
    })
  }

  const expectNoHorizontalScrollbar = () => {
    cy.get('.table-data-grid-grid .ag-center-cols-viewport').should(($viewport) => {
      expect($viewport[0].scrollWidth).to.be.at.most($viewport[0].clientWidth)
    })
  }

  const waitForColumnSizing = () => {
    cy.window().then(win => new Cypress.Promise((resolve) => {
      win.requestAnimationFrame(() => {
        win.requestAnimationFrame(resolve)
      })
    }))
  }

  const hideColumnInHostConfigBeforeSizing = (
    hostConfig: Ref<TableDataGridConfig>,
    columnKey: string,
  ) => {
    cy.then(() => {
      hostConfig.value = {
        ...hostConfig.value,
        columnVisibility: {
          ...hostConfig.value.columnVisibility,
          [columnKey]: false,
        },
      }
    })
    cy.getTestId(`table-data-grid-header-${columnKey}`).should('not.exist')
  }

  const hideColumnInHostConfig = (
    hostConfig: Ref<TableDataGridConfig>,
    columnKey: string,
  ) => {
    hideColumnInHostConfigBeforeSizing(hostConfig, columnKey)
    waitForColumnSizing()
  }

  const expectFittedGridWithoutOverflow = (getGridApi: () => GridApi<TestRow> | undefined) => {
    cy.contains('Gateway service').should('be.visible')
    waitForColumnSizing()
    cy.then(() => {
      expectColumnsToFillGrid(getGridApi()!)
      expectNoHorizontalOverflow()
    })
  }

  describe('rendering and states', () => {
    it('renders fetched rows and slotted cell content', () => {
      mountTable()

      cy.contains('Gateway service').should('be.visible')
      cy.contains('Service 2').should('be.visible')
      cy.getTestId('status-cell').first().should('contain.text', '500')
    })

    it('provides rowValue to cell slots', () => {
      mountTable({
        slots: {
          latency: ({ rowValue }: TableDataGridCellSlotProps<TestRow>) => h('span', {
            'data-testid': 'latency-row-value',
          }, String(rowValue)),
        },
      })

      cy.getTestId('latency-row-value').first().should('contain.text', '40')
    })

    it('emits grid ready with the ag-grid api', () => {
      const onGridReady = cy.stub().as('gridReady')

      mountTable({
        onGridReady,
      })

      cy.get('@gridReady').should('have.been.calledOnce')
      cy.get('@gridReady').should((stub) => {
        const api = (stub as unknown as sinon.SinonStub).getCall(0).args[0] as GridApi<TestRow>
        expect(api.getColumnState).to.be.a('function')
        expect(api.getColumnDefs()).to.have.length.greaterThan(0)
      })
    })

    it('emits loading and success state changes', () => {
      const onState = cy.stub().as('state')

      mountTable({
        onState,
      })

      cy.contains('Gateway service').should('be.visible')
      cy.get('@state').should('have.been.calledWithMatch', {
        state: 'loading',
        hasData: false,
      })
      cy.get('@state').should('have.been.calledWithMatch', {
        state: 'success',
        hasData: true,
      })
    })

    it('renders localized labels for table chrome', () => {
      mountTable()

      cy.contains('15 items per page').should('be.visible')
      cy.getTestId('table-data-grid-bulk-actions-trigger').should('contain.text', '(0) Bulk actions')
      cy.getTestId('column-visibility-trigger').should('have.attr', 'aria-label', 'Select visible columns').click()
      cy.getTestId('column-visibility-search').should('have.attr', 'placeholder', 'Search columns')
      cy.getTestId('column-visibility-clear-search').should('not.exist')
      cy.getTestId('column-visibility-search').type('status')
      cy.getTestId('column-visibility-clear-search').should('have.attr', 'aria-label', 'Clear search')
      cy.getTestId('column-visibility-toggle-all').should('contain.text', 'Toggle all')
    })

    it('renders localized labels for empty and error states', () => {
      mountTable({
        fetcher: cy.stub().resolves({ data: [], total: 0 }),
      })

      cy.getTestId('table-data-grid-empty').should('contain.text', 'No data')

      mountTable({
        error: true,
      })

      cy.getTestId('table-data-grid-error')
        .should('contain.text', 'Unable to load data')
        .and('contain.text', 'There was an error loading table data.')
    })

    it('renders loading state when the loading prop is set', () => {
      mountTable({
        loading: true,
      })

      cy.getTestId('table-data-grid-loading').should('be.visible')
      cy.get('.table-data-grid-grid').should('not.exist')
    })

    it('renders custom empty and error states', () => {
      mountTable({
        fetcher: cy.stub().resolves({ data: [], total: 0 }),
        slots: {
          'empty-state': () => h('div', { 'data-testid': 'custom-empty-state' }, 'Nothing matched'),
        },
      })

      cy.getTestId('custom-empty-state').should('contain.text', 'Nothing matched')
      cy.getTestId('table-data-grid-empty').should('not.exist')

      mountTable({
        error: true,
        slots: {
          'error-state': () => h('div', { 'data-testid': 'custom-error-state' }, 'Try again later'),
        },
      })

      cy.getTestId('custom-error-state').should('contain.text', 'Try again later')
      cy.getTestId('table-data-grid-error').should('not.exist')
    })

    it('renders empty state for an empty first infinite block', () => {
      mountTable({
        fetcher: cy.stub().resolves({ data: [], hasMore: false }),
        mode: 'infinite',
      })

      cy.getTestId('table-data-grid-empty').should('contain.text', 'No data')
    })

    it('emits state for a failed first infinite block', () => {
      const onState = cy.stub().as('state')

      mountTable({
        fetcher: cy.stub().rejects(new Error('failed')),
        mode: 'infinite',
        onState,
      })

      cy.getTestId('table-data-grid-error').should('not.exist')
      cy.get('@state').should('have.been.calledWithMatch', {
        state: 'error',
        hasData: false,
      })
    })

    it('recovers from a failed first infinite block when refreshKey changes', () => {
      const hostRefreshKey = ref(0)
      const fetcher = cy.stub().callsFake(() => {
        if (fetcher.callCount === 1) {
          return Promise.reject(new Error('failed'))
        }

        return Promise.resolve({
          data: [{
            id: 'recovered-row-1',
            name: 'Recovered service',
            status: 200,
            latency: 42,
          }],
          hasMore: false,
        })
      })

      // eslint-disable-next-line vue/one-component-per-file
      cy.mount(defineComponent({
        setup() {
          return () => h(DatatableComponent, {
            headers,
            fetcher,
            mode: 'infinite',
            refreshKey: hostRefreshKey.value,
            rowKey: 'id',
            tableConfig,
          })
        },
      }))

      cy.getTestId('table-data-grid-empty').should('contain.text', 'No data')
      cy.then(() => {
        hostRefreshKey.value += 1
      })

      cy.wrap(fetcher).should((stub) => {
        expect(stub.callCount).to.be.greaterThan(1)
      })
      cy.getTestId('table-data-grid-error').should('not.exist')
      cy.contains('Recovered service').should('be.visible')
    })

  })

  describe('table config sync', () => {
    it('does not refetch when applying initial table config state', () => {
      const fetcher = cy.stub().resolves({ data: rows.slice(0, 15), total: rows.length })

      mountTable({
        fetcher,
        config: {
          ...tableConfig,
          sortColumnKey: 'latency',
          sortColumnOrder: 'desc',
          pinnedColumns: {
            name: 'left',
          },
        },
      })

      cy.wrap(fetcher).should('have.been.calledOnce')
    })

    it('does not emit table config while applying initial column layout', () => {
      const onUpdateTableConfig = cy.stub().as('updateTableConfig')

      mountTable({
        onUpdateTableConfig,
      })

      cy.contains('Gateway service').should('be.visible')
      cy.get('@updateTableConfig').should('not.have.been.called')
    })

    it('renders with internal config state when table config is not bound', () => {
      const onUpdateTableConfig = cy.stub().as('updateTableConfig')

      mountTable({
        onUpdateTableConfig,
        useTableConfig: false,
      })

      cy.contains('Gateway service').should('be.visible')
      hideStatusColumnFromMenu()
    })

    it('applies later host table config prop changes without refetching layout-only changes', () => {
      const fetcher = createPaginatedFetcher()
      const { hostConfig } = mountSyncedTable({ fetcher })

      expectInitialFetch(fetcher)
      cy.then(() => {
        hostConfig.value = {
          ...tableConfig,
          columnVisibility: {
            name: true,
            status: false,
            latency: true,
          },
        }
      })
      cy.getTestId('column-visibility-trigger').click()
      cy.getTestId('column-visibility-status').find('input').should('not.be.checked')
      cy.wrap(fetcher).should('have.been.calledOnce')
    })

    it('applies controlled pinning changes without reverting', () => {
      const fetcher = createPaginatedFetcher()
      let gridApi: GridApi<TestRow> | undefined
      const { hostConfig } = mountSyncedTable({
        fetcher,
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.contains('Gateway service').should('be.visible')
      cy.then(() => {
        hostConfig.value = {
          ...tableConfig,
          pinnedColumns: {
            status: 'right',
          },
        }
      })
      cy.wrap(null).should(() => {
        expect(gridApi?.getColumnState().find(column => column.colId === 'status')?.pinned).to.equal('right')
      })
    })

    it('syncs newly pinned columns from ag-grid pin events', () => {
      let gridApi: GridApi<TestRow> | undefined
      const onUpdateTableConfig = cy.stub().as('updateTableConfig')

      mountSyncedTable({
        onGridReady: (api) => {
          gridApi = api
        },
        onUpdateTableConfig,
      })

      cy.contains('Gateway service').should('be.visible')
      cy.then(() => {
        gridApi?.setColumnsPinned(['status'], 'left')
      })
      cy.get('@updateTableConfig').should('have.been.calledWithMatch', {
        pinnedColumns: {
          status: 'left',
        },
      })
      cy.wrap(null).should(() => {
        expect(gridApi?.getColumnState().find(column => column.colId === 'status')?.pinned).to.equal('left')
      })
    })

    it('allows controlled config to unpin a default-pinned column', () => {
      let gridApi: GridApi<TestRow> | undefined
      const { hostConfig } = mountSyncedTable({
        headers: [
          { ...headers[0], pinned: 'left' },
          ...headers.slice(1),
        ],
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.contains('Gateway service').should('be.visible')
      cy.then(() => {
        hostConfig.value = {
          ...tableConfig,
          pinnedColumns: {
            name: false,
          },
        }
      })
      cy.wrap(null).should(() => {
        expect(gridApi?.getColumnState().find(column => column.colId === 'name')?.pinned).to.equal(null)
      })
    })

    it('refetches when later host table config changes sorting or page size', () => {
      const fetcher = createPaginatedFetcher()
      const { hostConfig } = mountSyncedTable({ fetcher })

      cy.wrap(fetcher).should('have.been.calledOnce')
      cy.then(() => {
        hostConfig.value = {
          ...tableConfig,
          pageSize: 10,
          sortColumnKey: 'latency',
          sortColumnOrder: 'desc',
        }
      })

      cy.wrap(fetcher).should('have.been.calledTwice')
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        pageSize: 10,
        sortColumnKey: 'latency',
        sortColumnOrder: 'desc',
      })
      cy.getTestId('table-data-grid-header-latency').should('have.class', 'is-sorted')
    })

    it('applies partial table config as overrides on top of defaults', () => {
      mountTable({
        fetcher: createPaginatedFetcher(),
        config: {
          columnOrder: ['latency'],
          columnVisibility: {
            status: false,
          },
          pageSize: 10,
        },
      })

      cy.get('.ag-header-cell').eq(1).should('contain.text', 'Latency')
      cy.getTestId('column-visibility-trigger').click()
      cy.getTestId('column-visibility-status').find('input').should('not.be.checked')
      cy.getTestId('column-visibility-latency').find('input').should('be.checked')
      cy.getTestId('visible-items').first()
        .should('contain.text', '1 to 10')
        .and('contain.text', 'of 40')
    })

  })

  describe('column sizing and overflow', () => {
    it('fits columns to available width when no column widths are configured', () => {
      let gridApi: GridApi<TestRow> | undefined

      mountTable({
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.then(() => {
        const totalColumnWidth = gridApi?.getColumnState()
          .reduce((total, column) => total + (column.width ?? 0), 0)

        expect(totalColumnWidth).to.be.greaterThan(480)
      })
    })

    it('refits columns after a column is hidden from the visibility menu', () => {
      const onUpdateTableConfig = cy.stub().as('updateTableConfig')
      let gridApi: GridApi<TestRow> | undefined

      mountTable({
        onUpdateTableConfig,
        onGridReady: (api) => {
          gridApi = api
        },
      })

      hideStatusColumnFromMenu()
      waitForColumnSizing()
      cy.then(() => {
        expectColumnsToFillGrid(gridApi!)
      })
    })

    it('persists refitted widths after a column is hidden from the visibility menu', () => {
      const onUpdateTableConfig = cy.stub().as('updateTableConfig')
      let latestConfig: TableDataGridConfig | undefined
      let gridApi: GridApi<TestRow> | undefined

      mountTable({
        onUpdateTableConfig: (nextConfig) => {
          latestConfig = nextConfig
          onUpdateTableConfig(nextConfig)
        },
        onGridReady: (api) => {
          gridApi = api
        },
      })

      hideStatusColumnFromMenu()
      waitForColumnSizing()
      cy.then(() => {
        expectColumnsToFillGrid(gridApi!)
        expect(latestConfig?.columnVisibility?.status).to.equal(false)
      })

      cy.then(() => {
        gridApi = undefined
        mountTable({
          config: latestConfig,
          onGridReady: (api) => {
            gridApi = api
          },
        })
      })
      cy.getTestId('table-data-grid-header-status').should('not.exist')
      cy.then(() => {
        expectColumnsToFillGrid(gridApi!)
      })
    })

    it('refits columns after externally changed column visibility is applied', () => {
      let gridApi: GridApi<TestRow> | undefined
      const { hostConfig } = mountSyncedTable({
        onGridReady: (api) => {
          gridApi = api
        },
      })

      hideColumnInHostConfig(hostConfig, 'status')
      cy.then(() => {
        expectColumnsToFillGrid(gridApi!)
      })
    })

    it('refits columns after the datatable container width changes', () => {
      let gridApi: GridApi<TestRow> | undefined
      const wrapperWidth = ref(760)

      mountTable({
        wrapperWidth,
        onGridReady: (api) => {
          gridApi = api
        },
      })

      expectFittedGridWithoutOverflow(() => gridApi)
      cy.then(() => {
        wrapperWidth.value = 980
      })
      waitForColumnSizing()
      waitForColumnSizing()
      cy.then(() => {
        expectColumnsToFillGrid(gridApi!)
        expectNoHorizontalOverflow()
      })
    })

    it('allows horizontal overflow when restoring a hidden column in a pinned layout cannot fit', () => {
      let gridApi: GridApi<TestRow> | undefined
      const headersWithPinnedColumn: Array<TableDataGridHeader<TestRow>> = [
        { ...headers[0], pinned: 'left', width: 180 },
        { key: 'route', label: 'Route', width: 260 },
        { key: 'method', label: 'Method', width: 120 },
        { ...headers[1], width: 120 },
        { ...headers[2], width: 140 },
        { key: 'asyncValue', label: 'Async value', minWidth: 180, width: 180 },
        { key: 'region', label: 'Region', width: 140 },
      ]
      const { hostConfig } = mountSyncedTable({
        headers: headersWithPinnedColumn,
        config: {
          ...tableConfig,
          columnOrder: ['name', 'route', 'method', 'status', 'latency', 'asyncValue', 'region'],
          columnVisibility: {
            name: true,
            route: true,
            method: true,
            status: true,
            latency: true,
            asyncValue: true,
            region: true,
          },
          pinnedColumns: {
            name: 'left',
          },
        },
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.contains('Gateway service').should('be.visible')
      hideColumnInHostConfig(hostConfig, 'region')
      cy.then(() => {
        hostConfig.value = {
          ...hostConfig.value,
          columnVisibility: {
            ...hostConfig.value.columnVisibility,
            region: true,
          },
        }
      })
      waitForColumnSizing()
      cy.then(() => {
        expect(gridApi?.getColumnState().find(column => column.colId === 'region')?.hide).to.not.equal(true)
      })
      expectHorizontalOverflow()
    })

    it('refits columns after a pinned column is hidden', () => {
      let gridApi: GridApi<TestRow> | undefined
      const headersWithPinnedColumn: Array<TableDataGridHeader<TestRow>> = [
        { ...headers[0], width: 220 },
        { key: 'route', label: 'Route', pinned: 'left', width: 260 },
        { ...headers[1], width: 120 },
        { ...headers[2], width: 140 },
      ]
      const { hostConfig } = mountSyncedTable({
        headers: headersWithPinnedColumn,
        config: {
          ...tableConfig,
          columnOrder: ['name', 'route', 'status', 'latency'],
          columnVisibility: {
            name: true,
            route: true,
            status: true,
            latency: true,
          },
          pinnedColumns: {
            route: 'left',
          },
        },
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.contains('Gateway service').should('be.visible')
      waitForColumnSizing()
      hideColumnInHostConfig(hostConfig, 'route')
      cy.then(() => {
        expectColumnsToFillGrid(gridApi!)
      })
      expectNoHorizontalOverflow()
    })

    it('refits columns when the row selection column is added or removed', () => {
      let gridApi: GridApi<TestRow> | undefined
      const { rowSelection } = mountSyncedTable({
        defaultRowSelection: 'single',
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.contains('Gateway service').should('be.visible')
      waitForColumnSizing()
      cy.then(() => {
        rowSelection.value = 'multiple'
      })
      cy.get('.ag-header-cell[col-id="ag-Grid-SelectionColumn"]').should('exist')
      waitForColumnSizing()
      cy.then(() => {
        expectColumnsToFillGrid(gridApi!)
        expectNoHorizontalOverflow()
        rowSelection.value = 'single'
      })
      cy.get('.ag-header-cell[col-id="ag-Grid-SelectionColumn"]').should('not.exist')
      waitForColumnSizing()
      cy.then(() => {
        expectColumnsToFillGrid(gridApi!)
        expectNoHorizontalOverflow()
      })
    })

    it('keeps fitted columns from overflowing when switching row model modes', () => {
      const fetcher = cy.stub().callsFake(({ mode: requestMode, page = 1, pageSize = 15, startRow = 0 }) => {
        if (requestMode === 'infinite') {
          const data = rows.slice(startRow, startRow + pageSize)

          return Promise.resolve({
            data,
            cursor: startRow + data.length,
            hasMore: startRow + data.length < rows.length,
          })
        }

        const offset = (page - 1) * pageSize

        return Promise.resolve({
          data: rows.slice(offset, offset + pageSize),
          total: rows.length,
        })
      })
      let gridApi: GridApi<TestRow> | undefined
      const headersWithMaxWidth: Array<TableDataGridHeader<TestRow>> = headers.map(header => (
        header.key === 'status'
          ? { ...header, maxWidth: 130 }
          : header
      ))
      const { mode } = mountSyncedTable({
        fetcher,
        headers: headersWithMaxWidth,
        onGridReady: (api) => {
          gridApi = api
        },
      })

      expectFittedGridWithoutOverflow(() => gridApi)
      cy.then(() => {
        mode.value = 'infinite'
      })
      cy.wrap(fetcher).should('have.been.calledWithMatch', { mode: 'infinite' })
      waitForColumnSizing()
      cy.then(() => {
        expectColumnsToFillGrid(gridApi!)
        expect(gridApi!.getColumnState().find(column => column.colId === 'status')?.width).to.be.at.most(130)
      })
      expectNoHorizontalScrollbar()
    })

    it('does not refetch for layout-only controlled table config changes', () => {
      const fetcher = cy.stub().resolves({ data: rows.slice(0, 15), total: rows.length })
      const { hostConfig } = mountSyncedTable({
        fetcher,
      })

      expectInitialFetch(fetcher)
      cy.then(() => {
        hostConfig.value = {
          ...hostConfig.value,
          columnOrder: ['status', 'name', 'latency'],
        }
      })
      waitForColumnSizing()
      cy.then(() => {
        hostConfig.value = {
          ...hostConfig.value,
          columnVisibility: {
            ...hostConfig.value.columnVisibility,
            latency: false,
          },
        }
      })
      waitForColumnSizing()
      cy.then(() => {
        hostConfig.value = {
          ...hostConfig.value,
          pinnedColumns: {
            ...hostConfig.value.pinnedColumns,
            status: 'left',
          },
        }
      })
      waitForColumnSizing()
      cy.wrap(fetcher).should('have.been.calledOnce')
    })

    it('uses adjacent-column resize by default so resizing does not create empty table space', () => {
      let gridApi: GridApi<TestRow> | undefined

      mountTable({
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.then(() => {
        expect(gridApi!.getGridOption('colResizeDefault')).to.equal('shift')
      })
    })

    it('keeps AG Grid row buffering enabled unless configured by the host', () => {
      let defaultGridApi: GridApi<TestRow> | undefined
      let configuredGridApi: GridApi<TestRow> | undefined

      mountTable({
        onGridReady: (api) => {
          defaultGridApi = api
        },
      })

      cy.then(() => {
        expect(defaultGridApi!.getGridOption('rowBuffer')).to.equal(10)
      })

      mountTable({
        agGridOptions: { rowBuffer: 4 },
        onGridReady: (api) => {
          configuredGridApi = api
        },
      })

      cy.then(() => {
        expect(configuredGridApi!.getGridOption('rowBuffer')).to.equal(4)
      })
    })

    it('does not reserve vertical scrollbar space unless configured by the host', () => {
      let defaultGridApi: GridApi<TestRow> | undefined
      let configuredGridApi: GridApi<TestRow> | undefined

      mountTable({
        onGridReady: (api) => {
          defaultGridApi = api
        },
      })

      cy.then(() => {
        expect(defaultGridApi!.getGridOption('alwaysShowVerticalScroll')).to.equal(false)
      })

      mountTable({
        agGridOptions: { alwaysShowVerticalScroll: true },
        onGridReady: (api) => {
          configuredGridApi = api
        },
      })

      cy.then(() => {
        expect(configuredGridApi!.getGridOption('alwaysShowVerticalScroll')).to.equal(true)
      })
    })

    it('does not hide columns while dragging a header out of the grid unless configured by the host', () => {
      let defaultGridApi: GridApi<TestRow> | undefined
      let configuredGridApi: GridApi<TestRow> | undefined

      mountTable({
        onGridReady: (api) => {
          defaultGridApi = api
        },
      })

      cy.then(() => {
        expect(defaultGridApi!.getGridOption('suppressDragLeaveHidesColumns')).to.equal(true)
      })

      mountTable({
        agGridOptions: { suppressDragLeaveHidesColumns: false },
        onGridReady: (api) => {
          configuredGridApi = api
        },
      })

      cy.then(() => {
        expect(configuredGridApi!.getGridOption('suppressDragLeaveHidesColumns')).to.equal(false)
      })
    })

    it('applies table data grid theme tokens through AG Grid CSS variables', () => {
      let gridApi: GridApi<TestRow> | undefined

      mountTable({
        rowSelection: 'multiple',
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.get('.table-data-grid-grid')
        .should(($grid) => {
          const styles = getComputedStyle($grid[0])

          expect(styles.getPropertyValue('--ag-background-color').trim()).to.equal('#ffffff')
          expect(styles.getPropertyValue('--ag-header-background-color').trim()).to.equal('#ffffff')
          expect(styles.getPropertyValue('--ag-border-color').trim()).to.equal('#e0e4ea')
          expect(styles.getPropertyValue('--ag-header-column-border').trim()).to.equal('1px solid #e0e4ea')
          expect(styles.getPropertyValue('--ag-header-column-resize-handle-color').trim()).to.equal('transparent')
          expect(styles.getPropertyValue('--ag-selected-row-background-color').trim()).to.equal('#eefaff')
          expect(styles.getPropertyValue('--ag-wrapper-border').trim()).to.equal('none')
          expect(styles.getPropertyValue('--ag-wrapper-border-radius').trim()).to.equal('0')
        })

      cy.get('.table-data-grid-grid .ag-root-wrapper')
        .should('have.css', 'border-top-width', '0px')
        .and('have.css', 'border-radius', '0px')

      cy.get('.table-data-grid-grid .ag-header')
        .should('have.css', 'background-color', 'rgb(255, 255, 255)')
      cy.get('.table-data-grid-grid .ag-header-cell').eq(1)
        .then(($headerCell) => {
          const dividerStyles = getComputedStyle($headerCell[0], '::after')

          expect(dividerStyles.borderRightWidth).to.equal('1px')
          expect(dividerStyles.borderRightColor).to.equal('rgb(224, 228, 234)')
        })

      cy.get('.table-data-grid-grid .ag-header-cell[col-id="ag-Grid-SelectionColumn"]')
        .should('have.css', 'gap', '0px')
        .then(($selectionHeaderCell) => {
          expect(getComputedStyle($selectionHeaderCell[0], '::after').borderRightWidth).to.equal('0px')
        })

      cy.get('.table-data-grid-grid .ag-header-cell-resize')
        .first()
        .then(($resizeHandle) => {
          expect(getComputedStyle($resizeHandle[0], '::after').backgroundColor).to.equal('rgba(0, 0, 0, 0)')
        })

      cy.contains('Gateway service').should('be.visible')
      cy.then(() => {
        gridApi!.getDisplayedRowAtIndex(0)?.setSelected(true)
      })
      cy.get('.table-data-grid-grid .ag-row-selected')
        .then(($row) => {
          expect(getComputedStyle($row[0], '::before').backgroundColor).to.equal('rgb(238, 250, 255)')
        })

      cy.get('.kong-ui-public-table-data-grid')
        .then(($datatable) => {
          $datatable[0].style.setProperty('--kui-color-background', 'rgb(1, 2, 3)')
          $datatable[0].style.setProperty('--kui-color-border', 'rgb(4, 5, 6)')
          $datatable[0].style.setProperty('--kui-color-background-primary-weakest', 'rgb(7, 8, 9)')
        })
      cy.get('.table-data-grid-grid .ag-header')
        .should('have.css', 'background-color', 'rgb(1, 2, 3)')
      cy.get('.table-data-grid-grid .ag-header-cell').eq(1)
        .then(($headerCell) => {
          expect(getComputedStyle($headerCell[0], '::after').borderRightColor).to.equal('rgb(4, 5, 6)')
        })
      cy.get('.table-data-grid-grid .ag-row-selected')
        .then(($row) => {
          expect(getComputedStyle($row[0], '::before').backgroundColor).to.equal('rgb(7, 8, 9)')
        })
    })

    it('stretches AG Grid cells so cell content can center vertically', () => {
      mountTable()

      cy.get('.table-data-grid-grid .ag-cell[col-id="name"]').first()
        .should('have.css', 'display', 'flex')
        .and('have.css', 'align-items', 'center')
      cy.get('.table-data-grid-grid .ag-cell[col-id="name"] .datatable-cell-content').first()
        .should('have.css', 'display', 'flex')
        .and('have.css', 'align-items', 'center')
    })

    it('aligns pagination internals without deep selectors', () => {
      mountTable({
        fetcher: cy.stub().resolves({ data: rows.slice(0, 15), total: 1000 }),
      })

      cy.get('.datatable-pagination-control .pagination-text.large-screen')
        .should('have.css', 'padding-left', '8px')
      cy.get('.datatable-pagination-control .pagination-button.placeholder')
        .should('have.css', 'display', 'flex')
        .and('have.css', 'align-items', 'center')
        .and('have.css', 'box-sizing', 'border-box')
        .and('have.css', 'justify-content', 'center')
    })

    it('allows configured wide columns to overflow horizontally', () => {
      let gridApi: GridApi<TestRow> | undefined

      mountTable({
        headers: [
          { ...headers[0], minWidth: 1400 },
          ...headers.slice(1),
        ],
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.contains('Gateway service').should('be.visible')
      waitForColumnSizing()
      cy.then(() => {
        expect(gridApi?.getColumnState().find(column => column.colId === 'name')?.width).to.be.at.least(1400)
      })
      expectHorizontalOverflow()
    })

    it('allows configured wide column widths to overflow on first render', () => {
      let gridApi: GridApi<TestRow> | undefined

      mountTable({
        config: {
          ...tableConfig,
          columnWidths: {
            name: 900,
            status: 120,
            latency: 140,
          },
        },
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.contains('Gateway service').should('be.visible')
      cy.then(() => {
        expect(gridApi?.getColumnState().find(column => column.colId === 'name')?.width).to.be.at.least(900)
      })
      expectHorizontalOverflow()
    })

    it('keeps dynamically added wide configured columns visible after layout state exists', () => {
      let gridApi: GridApi<TestRow> | undefined
      const wideHeader: TableDataGridHeader<TestRow> = {
        key: 'details',
        label: 'Details',
        width: 900,
      }
      const { headers: syncedHeaders, hostConfig } = mountSyncedTable({
        config: {
          ...tableConfig,
          columnOrder: ['status', 'name', 'latency'],
          columnWidths: {
            name: 220,
            status: 120,
            latency: 140,
          },
          pinnedColumns: {
            status: 'left',
          },
        },
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.contains('Gateway service').should('be.visible')
      cy.then(() => {
        syncedHeaders.value = [
          ...headers,
          wideHeader,
        ]
        hostConfig.value = {
          ...hostConfig.value,
          columnOrder: [
            ...(hostConfig.value.columnOrder ?? []),
            wideHeader.key,
          ],
          columnVisibility: {
            ...hostConfig.value.columnVisibility,
            [wideHeader.key]: true,
          },
          columnWidths: {
            ...hostConfig.value.columnWidths,
            [wideHeader.key]: 900,
          },
          pinnedColumns: {
            ...hostConfig.value.pinnedColumns,
            [wideHeader.key]: false,
          },
        }
      })
      cy.getTestId('table-data-grid-header-details').should('exist')
      waitForColumnSizing()
      cy.then(() => {
        const detailsColumn = gridApi?.getColumnState().find(column => column.colId === wideHeader.key)
        expect(detailsColumn?.hide).to.not.equal(true)
        expect(detailsColumn?.width).to.be.at.least(900)
      })
      expectHorizontalOverflow()
    })

    it('allows added configured-width columns to overflow after a pending visibility refit', () => {
      let gridApi: GridApi<TestRow> | undefined
      const addedHeaders: Array<TableDataGridHeader<TestRow>> = Array.from({ length: 4 }, (_, index) => ({
        key: `extra-${index + 1}`,
        label: `Extra ${index + 1}`,
        width: 640,
      }))
      const { headers: syncedHeaders, hostConfig } = mountSyncedTable({
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.contains('Gateway service').should('be.visible')
      hideColumnInHostConfigBeforeSizing(hostConfig, 'status')
      cy.then(() => nextTick())
      cy.then(() => {
        syncedHeaders.value = [
          ...syncedHeaders.value,
          ...addedHeaders,
        ]
        hostConfig.value = {
          ...hostConfig.value,
          columnOrder: [
            ...(hostConfig.value.columnOrder ?? []),
            ...addedHeaders.map(header => header.key),
          ],
          columnVisibility: {
            ...hostConfig.value.columnVisibility,
            ...Object.fromEntries(addedHeaders.map(header => [header.key, true])),
          },
          columnWidths: {
            ...hostConfig.value.columnWidths,
            ...Object.fromEntries(addedHeaders.map(header => [header.key, header.width ?? 0])),
          },
        }
      })
      waitForColumnSizing()
      cy.then(() => {
        const extraColumn = gridApi?.getColumnState().find(column => column.colId === 'extra-1')
        expect(gridApi?.getColumnState().find(column => column.colId === 'extra-4')?.hide).to.not.equal(true)
        expect(extraColumn?.width).to.be.at.least(640)
      })
      expectHorizontalOverflow()
    })

    it('fits configured column widths when they do not require horizontal overflow', () => {
      let gridApi: GridApi<TestRow> | undefined

      mountTable({
        headers: [
          { ...headers[0], width: 180, minWidth: 160 },
          { ...headers[1], width: 120, minWidth: 100 },
          { ...headers[2], width: 140, minWidth: 120 },
        ],
        onGridReady: (api) => {
          gridApi = api
        },
      })

      expectFittedGridWithoutOverflow(() => gridApi)
    })

    it('refits columns when controlled table config resets column widths', () => {
      let gridApi: GridApi<TestRow> | undefined
      const { hostConfig } = mountSyncedTable({
        config: {
          ...tableConfig,
          columnWidths: {
            name: 220,
            status: 120,
            latency: 140,
          },
        },
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.contains('Gateway service').should('be.visible')
      cy.then(() => {
        hostConfig.value = {
          ...tableConfig,
          columnWidths: {},
        }
      })
      waitForColumnSizing()
      cy.then(() => {
        expectColumnsToFillGrid(gridApi!)
        expectNoHorizontalOverflow()
      })
    })

    it('preserves fitted column widths when sorting', () => {
      let gridApi: GridApi<TestRow> | undefined
      let widthsBeforeSort: Record<string, number | undefined>

      mountTable({
        fetcher: createPaginatedFetcher(),
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.contains('Gateway service').should('be.visible')
      waitForColumnSizing()
      cy.then(() => {
        widthsBeforeSort = Object.fromEntries(
          gridApi?.getColumnState().map(column => [column.colId, column.width]) ?? [],
        )
      })
      cy.getTestId('table-data-grid-header-status').click()
      cy.then(() => {
        const widthsAfterSort = Object.fromEntries(
          gridApi?.getColumnState().map(column => [column.colId, column.width]) ?? [],
        )

        expect(widthsAfterSort).to.deep.equal(widthsBeforeSort)
      })
    })

    it('preserves configured column widths on first render', () => {
      let gridApi: GridApi<TestRow> | undefined

      mountTable({
        config: {
          ...tableConfig,
          columnWidths: {
            name: 220,
            status: 120,
            latency: 140,
          },
        },
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.then(() => {
        const widthsByColumn = Object.fromEntries(
          gridApi?.getColumnState().map(column => [column.colId, column.width]) ?? [],
        )

        expect(widthsByColumn.name).to.equal(220)
        expect(widthsByColumn.status).to.equal(120)
        expect(widthsByColumn.latency).to.equal(140)
      })
    })

  })

  describe('row and cell interactions', () => {
    it('emits row click and selection changes', () => {
      const onRowClick = cy.stub().as('rowClick')
      const onRowSelect = cy.stub().as('rowSelect')

      cy.mount(DatatableComponent, {
        props: {
          headers,
          fetcher: cy.stub().resolves({ data: rows.slice(0, 15), total: rows.length }),
          rowKey: 'id',
          rowSelection: 'multiple',
          tableConfig,
          'onRow:click': onRowClick,
          'onRow:select': onRowSelect,
        },
      })

      cy.contains('Gateway service').click()
      cy.get('@rowClick').should('have.been.calledWithMatch', rows[0])
      cy.get('@rowSelect').should('have.been.calledWithMatch', [rows[0]])
    })

    it('does not emit row click from columns with row click disabled', () => {
      const onRowClick = cy.stub().as('rowClick')
      const onRowSelect = cy.stub().as('rowSelect')

      mountTable({
        config: {
          ...tableConfig,
          columnOrder: ['name', 'status', 'latency', 'actions'],
          columnVisibility: {
            ...tableConfig.columnVisibility,
            actions: true,
          },
        },
        headers: [
          ...headers,
          { key: 'actions', label: 'Actions', disableRowClick: true, width: 80 },
        ],
        onRowClick,
        onRowSelect,
        slots: {
          actions: ({ row }) => h('button', {
            'data-testid': `actions-${row.id}`,
            type: 'button',
          }, 'Actions'),
        },
      })

      cy.getTestId('actions-row-1').click()
      cy.get('@rowClick').should('not.have.been.called')
      cy.get('@rowSelect').should('have.been.calledWithMatch', [rows[0]])
      cy.contains('Gateway service').click()
      cy.get('@rowClick').should('have.been.calledWithMatch', rows[0])
    })

    it('emits cell click payloads', () => {
      const onCellClick = cy.stub().as('cellClick')

      mountTable({
        onCellClick,
      })

      cy.getTestId('status-cell').first().click()
      cy.get('@cellClick').should('have.been.calledWithMatch', {
        row: rows[0],
        columnKey: 'status',
        value: 500,
      })
    })

    it('applies row and cell attrs', () => {
      mountTable({
        rowAttrs: row => ({
          'data-testid': `row-${row.id}`,
        }),
        cellAttrs: ({ colIndex, column, rowValue }) => ({
          'data-testid': `cell-${column.key}`,
          'data-col-index': colIndex,
          'data-row-value': rowValue,
        }),
      })

      cy.getTestId('row-row-1').should('exist')
      cy.getTestId('cell-name').first()
        .should('contain.text', 'Gateway service')
        .and('have.attr', 'data-col-index', '1')
      cy.getTestId('cell-status').first()
        .should('contain.text', '500')
        .and('have.attr', 'data-col-index', '2')
        .and('have.attr', 'data-row-value', '500')
    })

  })

  describe('toolbar and outside actions', () => {
    it('forwards toolbar slots through the table component boundary', () => {
      mountTable({
        slots: {
          toolbar: ({ selectedRows }: TableDataGridToolbarSlotProps<TestRow>) => h('div', {
            'data-testid': 'forwarded-toolbar',
          }, `Custom toolbar ${selectedRows.length}`),
          'toolbar-left': ({ selectedRows }: TableDataGridToolbarSlotProps<TestRow>) => h('button', {
            'data-testid': 'forwarded-toolbar-left',
            type: 'button',
          }, `Left ${selectedRows.length}`),
          'toolbar-right': ({ filterSelection }: TableDataGridToolbarSlotProps<TestRow>) => h('button', {
            'data-active-filter-count': Object.keys(filterSelection).length,
            'data-testid': 'forwarded-toolbar-right',
            type: 'button',
          }, 'Right'),
        },
      })

      cy.getTestId('forwarded-toolbar')
        .should('be.visible')
        .and('contain.text', 'Custom toolbar 0')
      cy.getTestId('table-data-grid-bulk-actions-trigger').should('not.exist')
      cy.getTestId('column-visibility-trigger').should('be.visible')

      mountTable({
        slots: {
          'toolbar-left': ({ selectedRows }: TableDataGridToolbarSlotProps<TestRow>) => h('button', {
            'data-testid': 'forwarded-toolbar-left',
            type: 'button',
          }, `Left ${selectedRows.length}`),
          'toolbar-right': ({ filterSelection }: TableDataGridToolbarSlotProps<TestRow>) => h('button', {
            'data-active-filter-count': Object.keys(filterSelection).length,
            'data-testid': 'forwarded-toolbar-right',
            type: 'button',
          }, 'Right'),
        },
      })

      cy.getTestId('forwarded-toolbar-left')
        .should('be.visible')
        .and('contain.text', 'Left 0')
      cy.getTestId('forwarded-toolbar-right')
        .should('be.visible')
        .and('have.attr', 'data-active-filter-count', '0')
      cy.getTestId('table-data-grid-bulk-actions-trigger').should('be.visible')
    })

    it('debounces search changes before refetching the first page', () => {
      const fetcher = createPaginatedFetcher()

      mountTable({
        enableSearch: true,
        fetcher,
      })

      cy.contains('Gateway service').should('be.visible')
      cy.wrap(fetcher).should('have.been.calledOnce')
      cy.clock()
      cy.getTestId('table-data-grid-search').type('Gateway')
      cy.tick(349)
      cy.wrap(fetcher).should('have.been.calledOnce')
      cy.tick(1)
      cy.wrap(fetcher).should('have.been.calledTwice')
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        search: 'Gateway',
      })
    })

    it('clears search and refreshes with an empty query', () => {
      const fetcher = createPaginatedFetcher()

      mountTable({
        enableSearch: true,
        fetcher,
      })

      cy.contains('Gateway service').should('be.visible')
      cy.clock()
      cy.getTestId('table-data-grid-search').type('Gateway')
      cy.tick(350)
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        search: 'Gateway',
      })
      cy.getTestId('table-data-grid-search-clear').click()
      cy.tick(0)
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        search: '',
      })
    })

    it('clears search when search is disabled', () => {
      const fetcher = createPaginatedFetcher()
      let setEnableSearch: ((enabled: boolean) => Promise<void>) | undefined

      cy.mount(DatatableComponent, {
        props: {
          enableSearch: true,
          fetcher,
          headers,
          paginationPageSizeOptions: [10, 15, 25],
          rowKey: 'id',
          rowSelection: 'multiple',
          tableConfig,
        },
      }).then(({ wrapper }) => {
        setEnableSearch = enabled => wrapper.setProps({ enableSearch: enabled })
      })

      cy.contains('Gateway service').should('be.visible')
      cy.clock()
      cy.getTestId('table-data-grid-search').type('Gateway')
      cy.tick(350)
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        search: 'Gateway',
      })
      cy.then(() => setEnableSearch?.(false))
      cy.tick(0)
      cy.getTestId('table-data-grid-search').should('not.exist')
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        search: '',
      })
    })

    it('keeps toolbar search available when search results are empty', () => {
      const fetcher = cy.stub().callsFake(({ search = '', page = 1, pageSize = 15 }) => {
        const filteredRows = search
          ? rows.filter(row => row.name.toLowerCase().includes(String(search).toLowerCase()))
          : rows
        const offset = (page - 1) * pageSize

        return Promise.resolve({
          data: filteredRows.slice(offset, offset + pageSize),
          total: filteredRows.length,
        })
      })

      mountTable({
        enableSearch: true,
        fetcher,
      })

      cy.contains('Gateway service').should('be.visible')
      cy.getTestId('table-data-grid-search').type('no matching service')
      cy.getTestId('table-data-grid-empty').should('be.visible')
      cy.getTestId('table-data-grid-search')
        .should('be.visible')
        .and('have.value', 'no matching service')
      cy.getTestId('table-data-grid-search-clear').click()
      cy.contains('Gateway service').should('be.visible')
      cy.getTestId('table-data-grid-search').should('have.value', '')
    })

    it('teleports built-in search when outsideSearch is provided', () => {
      const fetcher = createPaginatedFetcher()

      mountTable({
        enableSearch: true,
        fetcher,
        outsideSearch: '#outside-search-target',
      })

      cy.get('.datatable-toolbar').find('[data-testid="table-data-grid-search"]').should('not.exist')
      cy.getTestId('outside-search-target').findTestId('table-data-grid-search').should('be.visible')
      cy.clock()
      cy.getTestId('outside-search-target').findTestId('table-data-grid-search').type('Service')
      cy.tick(350)
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        search: 'Service',
      })
    })

    it('lets outside-actions update search and refresh the table', () => {
      const fetcher = createPaginatedFetcher()
      let updateOutsideSearch: TableDataGridToolbarSlotProps<TestRow>['updateSearch'] | undefined

      mountTable({
        enableSearch: true,
        fetcher,
        slots: {
          'outside-actions': ({
            search,
            updateSearch,
          }: TableDataGridToolbarSlotProps<TestRow>) => {
            updateOutsideSearch = updateSearch

            return h('button', {
              'data-search': search,
              'data-testid': 'outside-search-action',
              type: 'button',
            }, 'Search outside action')
          },
        },
      })

      cy.getTestId('outside-search-action').should('have.attr', 'data-search', '')
      cy.clock()
      cy.then(() => {
        expect(updateOutsideSearch).to.be.a('function')
        updateOutsideSearch?.('Gateway')
      })
      cy.tick(350)
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        search: 'Gateway',
      })
      cy.getTestId('outside-search-action').should('have.attr', 'data-search', 'Gateway')
    })

    it('hides toolbar controls while keeping the grid usable', () => {
      mountTable({
        hideToolbar: true,
      })

      cy.getTestId('column-visibility-trigger').should('not.exist')
      cy.getTestId('table-data-grid-bulk-actions-trigger').should('not.exist')
      cy.getTestId('filter-selector').should('not.exist')
      cy.contains('Gateway service').should('be.visible')
      cy.getTestId('status-cell').first().should('contain.text', '500')
    })

    it('renders outside-actions while the toolbar is hidden', () => {
      mountTable({
        hideToolbar: true,
        slots: {
          'outside-actions': ({ selectedRows }: TableDataGridToolbarSlotProps<TestRow>) => h('span', {
            'data-testid': 'outside-action',
          }, `Outside ${selectedRows.length}`),
        },
      })

      cy.getTestId('column-visibility-trigger').should('not.exist')
      cy.getTestId('outside-action')
        .should('exist')
        .and('contain.text', 'Outside 0')
      cy.contains('Gateway service').click()
      cy.getTestId('outside-action').should('contain.text', 'Outside 1')
    })

    const outsideActionsMountedStateCases = [
      {
        actionTestId: 'outside-loading-action',
        createProps: () => ({ loading: true }),
        expectedStateTestId: 'table-data-grid-loading',
        label: 'loading',
      },
      {
        actionTestId: 'outside-error-action',
        createProps: () => ({ error: true }),
        expectedStateTestId: 'table-data-grid-error',
        label: 'error',
      },
      {
        actionTestId: 'outside-empty-action',
        createProps: () => ({ fetcher: cy.stub().resolves({ data: [], total: 0 }) }),
        expectedStateTestId: 'table-data-grid-empty',
        label: 'empty',
      },
    ]

    it('keeps outside-actions mounted across non-grid states', () => {
      outsideActionsMountedStateCases.forEach(({ actionTestId, createProps, expectedStateTestId, label }) => {
        mountTable({
          ...createProps(),
          slots: {
            'outside-actions': () => h('span', { 'data-testid': actionTestId }, `Outside ${label}`),
          },
        })

        cy.getTestId(expectedStateTestId).should('be.visible')
        cy.getTestId(actionTestId).should('exist')
      })
    })

    it('lets outside-actions update filters and refresh the table', () => {
      const nextSelection = createNameFilterSelection('Gateway service')
      const fetcher = cy.stub().resolves({ data: rows.slice(0, 15), total: rows.length })
      const onUpdateFilterSelection = cy.stub().as('updateFilterSelection')
      let updateOutsideFilterSelection: TableDataGridToolbarSlotProps<TestRow>['updateFilterSelection'] | undefined

      mountTable({
        fetcher,
        headers: headersWithNameFilter,
        onUpdateFilterSelection,
        slots: {
          'outside-actions': ({
            filterSelection: toolbarFilterSelection,
            filters,
            updateFilterSelection,
          }: TableDataGridToolbarSlotProps<TestRow>) => {
            updateOutsideFilterSelection = updateFilterSelection

            return h('span', {
              'data-active-filter-count': Object.keys(toolbarFilterSelection).length,
              'data-filter-count': Object.keys(filters).length,
              'data-testid': 'outside-filter-action',
            }, 'Apply external filter')
          },
        },
      })

      cy.getTestId('outside-filter-action')
        .should('have.attr', 'data-filter-count', '1')
        .and('have.attr', 'data-active-filter-count', '0')
      cy.then(() => {
        expect(updateOutsideFilterSelection).to.be.a('function')
        updateOutsideFilterSelection?.(nextSelection)
      })

      cy.get('@updateFilterSelection').should('have.been.calledWith', nextSelection)
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        filterSelection: nextSelection,
        page: 1,
        pageSize: 15,
      })
      cy.getTestId('outside-filter-action').should('have.attr', 'data-active-filter-count', '1')
    })

  })

  describe('filters and headers', () => {
    it('renders filters only when at least one header is filterable', () => {
      mountTable()

      cy.getTestId('filter-selector').should('not.exist')
      cy.getTestId('filter-group-pill-name').should('not.exist')

      mountTable({
        headers: headersWithNameFilter,
      })

      cy.getTestId('filter-group-pill-name').should('be.visible')
    })

    it('teleports built-in filters when outsideFilters is provided', () => {
      const fetcher = createPaginatedFetcher()
      const onFilterApply = cy.stub().as('filterApply')
      const onUpdateFilterSelection = cy.stub().as('updateFilterSelection')

      mountTable({
        fetcher,
        headers: headersWithNameFilter,
        outsideFilters: '#outside-filters-target',
        onFilterApply,
        onUpdateFilterSelection,
      })

      cy.get('.datatable-toolbar').find('[data-testid="filter-group-pill-name"]').should('not.exist')
      cy.getTestId('outside-filters-target').findTestId('filter-group-pill-name').should('be.visible')
      cy.getTestId('outside-filters-target').findTestId('filter-group-pill-name').findTestId('filter-pill').click()
      cy.getTestId('outside-filters-target').findTestId('filter-group-pill-name').findTestId('filter-pill-input').type('Gateway')
      cy.getTestId('outside-filters-target').findTestId('filter-group-pill-name').findTestId('filter-pill-apply').click()
      cy.get('@filterApply').should('have.been.calledWithMatch', 'name', createNameFilterSelection('Gateway'))
      cy.get('@updateFilterSelection').should('have.been.calledWithMatch', createNameFilterSelection('Gateway'))
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        filterSelection: createNameFilterSelection('Gateway'),
      })
    })

    it('re-emits filter open, close, and clear events from outsideFilters', () => {
      const fetcher = createPaginatedFetcher()
      const onFilterClear = cy.stub().as('filterClear')
      const onFilterClose = cy.stub().as('filterClose')
      const onFilterOpen = cy.stub().as('filterOpen')

      mountTable({
        fetcher,
        headers: headersWithNameFilter,
        filterSelection: createNameFilterSelection('Gateway'),
        outsideFilters: '#outside-filters-target',
        onFilterClear,
        onFilterClose,
        onFilterOpen,
      })

      cy.getTestId('outside-filters-target').findTestId('filter-group-pill-name').findTestId('filter-pill').click()
      cy.get('@filterOpen').should('have.been.calledWith', 'name')
      cy.get('body').click(0, 0)
      cy.get('@filterClose').should('have.been.calledWith', 'name')
      cy.getTestId('outside-filters-target').findTestId('filter-group-pill-name').findTestId('interactive-pill-clear-icon').click()
      cy.get('@filterClear').should('have.been.calledWithMatch', 'name', {
        name: undefined,
      })
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        filterSelection: {
          name: undefined,
        },
      })
    })

    it('forwards custom filter slots through outsideFilters', () => {
      const customSelection = createNameFilterSelection('Gateway service')
      const fetcher = createPaginatedFetcher()
      const onFilterApply = cy.stub().as('filterApply')

      cy.mount(defineComponent({
        setup() {
          const hostFilterSelection = ref<FilterGroupSelection>({})

          const handleFilterApply = (filterKey: string, selection: FilterGroupSelection) => {
            onFilterApply(filterKey, selection)
            hostFilterSelection.value = customSelection
          }

          return () => h('div', [
            h('div', {
              'data-testid': 'outside-filters-target',
              id: 'outside-filters-target',
            }),
            h(DatatableComponent, {
              fetcher,
              filterSelection: hostFilterSelection.value,
              headers: headersWithNameFilter,
              outsideFilters: '#outside-filters-target',
              paginationPageSizeOptions: [10, 15, 25],
              rowKey: 'id',
              rowSelection: 'multiple',
              tableConfig,
              'onFilter:apply': handleFilterApply,
              'onUpdate:filterSelection': (nextSelection: FilterGroupSelection) => {
                hostFilterSelection.value = nextSelection
              },
            }, {
              'filter-name': () => h('button', {
                'data-testid': 'custom-name-filter-control',
                type: 'button',
              }, 'Gateway service'),
            }),
          ])
        },
      }))

      cy.contains('.ag-cell', 'Gateway service').should('be.visible')
      cy.getTestId('outside-filters-target').findTestId('filter-group-pill-name').findTestId('filter-pill').click()
      cy.getTestId('outside-filters-target').findTestId('custom-name-filter-control').filter(':visible').should('be.visible')
      cy.getTestId('outside-filters-target').findTestId('filter-group-pill-name').findTestId('filter-pill-input').should('not.exist')
      cy.getTestId('outside-filters-target').findTestId('filter-group-pill-name').findTestId('filter-pill-apply').click()
      cy.get('@filterApply').should('have.been.calledWithMatch', 'name', {})
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        filterSelection: customSelection,
      })
    })

    it('keeps outside search and filters mounted across non-grid states', () => {
      const outsideControlStateCases = [
        {
          createProps: () => ({ loading: true }),
          expectedStateTestId: 'table-data-grid-loading',
        },
        {
          createProps: () => ({ error: true }),
          expectedStateTestId: 'table-data-grid-error',
        },
        {
          createProps: () => ({ fetcher: cy.stub().resolves({ data: [], total: 0 }) }),
          expectedStateTestId: 'table-data-grid-empty',
        },
      ]

      outsideControlStateCases.forEach(({ createProps, expectedStateTestId }) => {
        mountTable({
          ...createProps(),
          enableSearch: true,
          headers: headersWithNameFilter,
          outsideFilters: '#outside-filters-target',
          outsideSearch: '#outside-search-target',
        })

        cy.getTestId(expectedStateTestId).should('be.visible')
        cy.getTestId('outside-search-target').findTestId('table-data-grid-search').should('exist')
        cy.getTestId('outside-filters-target').findTestId('filter-group-pill-name').should('exist')
      })
    })

    it('sorts through the table config when a sortable header is clicked', () => {
      const onUpdateTableConfig = cy.stub().as('updateTableConfig')
      mountTable({
        headers: [
          { key: 'name', label: 'Name', sortable: true, hideable: false, width: 220 },
          { key: 'status', label: 'Status', sortable: true, width: 120 },
          { key: 'latency', label: 'Latency', sortable: true, width: 140 },
        ],
        onUpdateTableConfig,
      })

      cy.getTestId('table-data-grid-header-name').click()
      cy.get('@updateTableConfig').should('have.been.calledWithMatch', {
        sortColumnKey: 'name',
        sortColumnOrder: 'asc',
      })
    })

    it('supports hidden header labels', () => {
      mountTable({
        headers: [
          { key: 'name', label: 'Name', width: 220 },
          {
            key: 'status',
            label: 'Status',
            hideLabel: true,
            width: 140,
          },
        ],
      })

      cy.getTestId('table-data-grid-header-status')
        .should('be.visible')
        .and('not.contain.text', 'Status')
    })

  })

  describe('selection and bulk actions', () => {
    it('renders Kongponents checkboxes instead of AG Grid selection checkboxes', () => {
      mountTable()

      cy.get('.ag-selection-checkbox').should('not.exist')
      cy.get('.ag-header-cell[col-id="ag-Grid-SelectionColumn"] .k-checkbox').should('exist')
      cy.get('.ag-cell[col-id="ag-Grid-SelectionColumn"] .k-checkbox').should('exist')
      cy.getTestId('table-data-grid-selection-checkbox').should('have.length.greaterThan', 0)
    })

    it('provides selected rows to the bulk action items slot', () => {
      mountTable({
        slots: {
          'bulk-action-items': renderSelectedRowsBulkAction,
        },
      })

      cy.contains('Gateway service').click()
      cy.getTestId('table-data-grid-bulk-actions-trigger').click()
      cy.getTestId('bulk-action').should('contain.text', '1:Gateway service')
    })

    it('selects rows through Kongponents checkboxes without emitting row clicks', () => {
      const onRowClick = cy.stub().as('rowClick')
      const onRowSelect = cy.stub().as('rowSelect')

      mountTable({
        onRowClick,
        onRowSelect,
        slots: {
          'bulk-action-items': renderSelectedRowsBulkAction,
        },
      })

      cy.getTestId('table-data-grid-selection-checkbox').first().click()
      cy.get('@rowClick').should('not.have.been.called')
      cy.get('@rowSelect').should('have.been.calledWithMatch', [rows[0]])
      cy.getTestId('table-data-grid-bulk-actions-trigger')
        .should('not.be.disabled')
        .and('contain.text', '(1) Bulk actions')
        .click()
      cy.getTestId('bulk-action').should('contain.text', '1:Gateway service')
    })

    it('selects all rows from the Kongponents header checkbox and shows partial selection', () => {
      const onRowSelect = cy.stub().as('rowSelect')

      mountTable({
        onRowSelect,
      })

      cy.getTestId('table-data-grid-selection-checkbox').first().click()
      cy.getTestId('table-data-grid-selection-header-checkbox')
        .should(($checkbox) => {
          expect(($checkbox[0] as HTMLInputElement).indeterminate).to.equal(true)
        })

      cy.getTestId('table-data-grid-selection-header-checkbox').click()
      cy.get('@rowSelect').should('have.been.calledWithMatch', rows.slice(0, 15))
      cy.getTestId('table-data-grid-bulk-actions-trigger').should('contain.text', '(15) Bulk actions')

      cy.getTestId('table-data-grid-selection-header-checkbox').click()
      cy.get('@rowSelect').should('have.been.calledWithMatch', [])
      cy.getTestId('table-data-grid-bulk-actions-trigger').should('contain.text', '(0) Bulk actions')
    })

    it('selects loaded infinite rows from the Kongponents header checkbox', () => {
      const onRowSelect = cy.stub().as('rowSelect')
      let gridApi: GridApi<TestRow> | undefined

      mountTable({
        fetcher: createInfiniteFetcher(),
        mode: 'infinite',
        onGridReady: (api) => {
          gridApi = api
        },
        onRowSelect,
      })

      cy.contains('Infinite service 1').should('be.visible')
      cy.getTestId('table-data-grid-selection-header-checkbox').click()
      cy.get('@rowSelect').should('have.been.called')
      cy.then(() => {
        let loadedRowCount = 0
        gridApi!.forEachNode(() => {
          loadedRowCount += 1
        })
        cy.get('@rowSelect').should((stub) => {
          expect(stub.lastCall.args[0]).to.have.length(loadedRowCount)
        })
        cy.getTestId('table-data-grid-bulk-actions-trigger').should('contain.text', `(${loadedRowCount}) Bulk actions`)
      })
    })

    it('keeps only the latest selected row in single selection mode', () => {
      const onRowSelect = cy.stub().as('rowSelect')

      mountTable({
        rowSelection: 'single',
        onRowSelect,
        slots: {
          'bulk-action-items': renderSelectedRowsBulkAction,
        },
      })

      cy.contains('Gateway service').click()
      cy.contains('Service 2').click()
      cy.getTestId('table-data-grid-bulk-actions-trigger')
        .should('not.be.disabled')
        .and('contain.text', '(1) Bulk actions')
        .click()
      cy.getTestId('bulk-action').should('contain.text', '1:Service 2')
      cy.get('@rowSelect').should('have.been.calledWithMatch', [rows[1]])
    })

    it('does not render selection toolbar content when row selection is disabled', () => {
      mountTable({
        rowSelection: 'none',
        slots: {
          'bulk-action-items': () => h('button', {
            'data-testid': 'bulk-action',
          }, 'Clear selection'),
        },
      })

      cy.getTestId('table-data-grid-bulk-actions-trigger').should('not.exist')
      cy.getTestId('bulk-action').should('not.exist')
      cy.getTestId('column-visibility-trigger').should('be.visible')
    })

  })

  describe('column visibility menu', () => {
    it('updates table config when a column is hidden from the menu', () => {
      const onUpdateTableConfig = cy.stub().as('updateTableConfig')

      mountTable({ onUpdateTableConfig })

      hideStatusColumnFromMenu()
    })

  })

  describe('pagination and page size', () => {
    it('uses the table pagination controls to fetch later pages', () => {
      const fetcher = createPaginatedFetcher()

      mountTable({
        fetcher,
      })

      cy.getTestId('visible-items').first()
        .should('contain.text', '1 to 15')
        .and('contain.text', 'of 40')
      goToSecondPage(fetcher)
    })

    it('can hide pagination controls', () => {
      mountTable({
        hidePagination: true,
      })

      cy.contains('Gateway service').should('be.visible')
      cy.getTestId('table-data-grid-pagination').should('not.exist')
    })

    it('hides optional pagination when all rows fit on one page', () => {
      mountTable({
        fetcher: cy.stub().resolves({ data: rows.slice(0, 10), total: 10 }),
        hidePaginationWhenOptional: true,
      })

      cy.contains('Gateway service').should('be.visible')
      cy.getTestId('table-data-grid-pagination').should('not.exist')
    })

    it('supports unknown-total pagination using hasMore', () => {
      const fetcher = cy.stub().callsFake(({ page = 1 }) => Promise.resolve({
        data: page === 1 ? rows.slice(0, 15) : rows.slice(15, 25),
        hasMore: page === 1,
      }))

      mountTable({
        fetcher,
      })

      goToSecondPage(fetcher)
      cy.getTestId('next-button').should('be.disabled')
    })

    it('refetches the first page with filter selection when a filter is applied', () => {
      const fetcher = createPaginatedFetcher()
      const onUpdateFilterSelection = cy.stub().as('updateFilterSelection')
      const onFilterApply = cy.stub().as('filterApply')

      mountTable({
        fetcher,
        headers: headersWithNameFilter,
        onFilterApply,
        onUpdateFilterSelection,
      })

      cy.wrap(fetcher).should('have.been.calledOnce')
      cy.getTestId('filter-group-pill-name').findTestId('filter-pill').click()
      cy.getTestId('filter-group-pill-name').findTestId('filter-pill-input').type('Gateway')
      cy.getTestId('filter-group-pill-name').findTestId('filter-pill-apply').click()
      cy.get('@filterApply').should('have.been.calledWithMatch', 'name', createNameFilterSelection('Gateway'))
      cy.get('@updateFilterSelection').should('have.been.calledWithMatch', createNameFilterSelection('Gateway'))
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        filterSelection: createNameFilterSelection('Gateway'),
      })
    })

    it('forwards custom filter slots and lets the host own custom filter selection', () => {
      const customSelection = createNameFilterSelection('Gateway service')
      const fetcher = createPaginatedFetcher()
      const onFilterApply = cy.stub().as('filterApply')

      cy.mount(defineComponent({
        setup() {
          const hostFilterSelection = ref<FilterGroupSelection>({})

          const handleFilterApply = (filterKey: string, selection: FilterGroupSelection) => {
            onFilterApply(filterKey, selection)
            hostFilterSelection.value = customSelection
          }

          return () => h(DatatableComponent, {
            fetcher,
            filterSelection: hostFilterSelection.value,
            headers: headersWithNameFilter,
            paginationPageSizeOptions: [10, 15, 25],
            rowKey: 'id',
            rowSelection: 'multiple',
            tableConfig,
            'onFilter:apply': handleFilterApply,
            'onUpdate:filterSelection': (nextSelection: FilterGroupSelection) => {
              hostFilterSelection.value = nextSelection
            },
          }, {
            'filter-name': () => h('button', {
              'data-testid': 'custom-name-filter-control',
              type: 'button',
            }, 'Gateway service'),
          })
        },
      }))

      cy.contains('.ag-cell', 'Gateway service').should('be.visible')
      cy.getTestId('filter-group-pill-name').findTestId('filter-pill').click()
      cy.getTestId('filter-group-pill-name').findTestId('filter-pill-apply').click()
      cy.get('@filterApply').should('have.been.calledWithMatch', 'name', {})
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        filterSelection: customSelection,
      })
    })

    it('forwards custom filter slots that become available after mount', () => {
      const fetcher = createPaginatedFetcher()

      cy.mount(defineComponent({
        setup() {
          const customFilterEnabled = ref(false)

          return () => h('div', [
            h('button', {
              'data-testid': 'enable-custom-filter-slot',
              type: 'button',
              onClick: () => {
                customFilterEnabled.value = true
              },
            }, 'Enable custom filter slot'),
            h(DatatableComponent, {
              fetcher,
              headers: headersWithNameFilter,
              paginationPageSizeOptions: [10, 15, 25],
              rowKey: 'id',
              rowSelection: 'multiple',
              tableConfig,
            }, {
              ...(customFilterEnabled.value
                ? {
                  'filter-name': () => h('button', {
                    'data-testid': 'late-custom-name-filter-control',
                    type: 'button',
                  }, 'Late custom content'),
                }
                : {}),
            }),
          ])
        },
      }))

      cy.getTestId('enable-custom-filter-slot').click()
      cy.getTestId('filter-group-pill-name').findTestId('filter-pill').click()
      cy.getTestId('late-custom-name-filter-control').filter(':visible').should('be.visible')
      cy.getTestId('filter-group-pill-name').findTestId('filter-pill-input').should('not.exist')
    })

    it('refetches with updated filter selection when a filter is cleared', () => {
      const fetcher = createPaginatedFetcher()
      const onFilterClear = cy.stub().as('filterClear')

      mountTable({
        fetcher,
        headers: headersWithNameFilter,
        filterSelection: createNameFilterSelection('Gateway'),
        onFilterClear,
      })

      cy.getTestId('filter-group-pill-name').findTestId('interactive-pill-clear-icon').click()
      cy.get('@filterClear').should('have.been.calledWithMatch', 'name', {
        name: undefined,
      })
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        filterSelection: {
          name: undefined,
        },
      })
    })

    it('re-emits filter open and close events', () => {
      const onFilterOpen = cy.stub().as('filterOpen')
      const onFilterClose = cy.stub().as('filterClose')

      mountTable({
        headers: headersWithNameFilter,
        onFilterClose,
        onFilterOpen,
      })

      cy.getTestId('filter-group-pill-name').findTestId('filter-pill').click()
      cy.get('@filterOpen').should('have.been.calledWith', 'name')
      cy.get('body').click(0, 0)
      cy.get('@filterClose').should('have.been.calledWith', 'name')
    })

    it('emits table config and refetches when page size changes', () => {
      const fetcher = createPaginatedFetcher()
      const onUpdateTableConfig = cy.stub().as('updateTableConfig')
      let gridApi: GridApi<TestRow> | undefined
      let columnStateBeforePageSizeChange: ColumnStateSnapshot[]

      mountTable({
        fetcher,
        onUpdateTableConfig,
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.wrap(fetcher).should('have.been.calledOnce')
      cy.then(() => {
        columnStateBeforePageSizeChange = gridApi!.getColumnState().map(({ colId, pinned, width }) => ({
          colId,
          pinned,
          width,
        }))
      })
      cy.getTestId('page-size-dropdown-trigger').click()
      cy.getTestId('dropdown-item-trigger').contains('10').click()
      cy.wrap(fetcher).should('have.been.calledTwice')
      cy.get('@updateTableConfig').should('have.been.calledWithMatch', { pageSize: 10 })
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        pageSize: 10,
      })
      cy.getTestId('visible-items').first()
        .should('contain.text', '1 to 10')
        .and('contain.text', 'of 40')
      cy.then(() => {
        expect(gridApi!.getColumnState().map(({ colId, pinned, width }) => ({
          colId,
          pinned,
          width,
        }))).to.deep.equal(columnStateBeforePageSizeChange)
      })
    })

    it('reflects externally changed table config page size in pagination controls', () => {
      const fetcher = createPaginatedFetcher()
      const { hostConfig } = mountSyncedTable({ fetcher })

      cy.contains('15 items per page').should('be.visible')
      cy.then(() => {
        hostConfig.value = {
          ...hostConfig.value,
          pageSize: 25,
        }
      })

      cy.wrap(fetcher).should('have.been.calledTwice')
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'pagination',
        page: 1,
        pageSize: 25,
      })
      cy.contains('25 items per page').should('be.visible')
      cy.getTestId('visible-items').first()
        .should('contain.text', '1 to 25')
        .and('contain.text', 'of 40')
    })

  })

  describe('cell refresh and public methods', () => {
    it('refreshes cell slot selected state when row selection changes', () => {
      mountTable({
        slots: {
          name: ({ selected }) => h('span', {
            'data-testid': 'selected-name-cell',
          }, selected ? 'selected' : 'not selected'),
        },
      })

      cy.getTestId('selected-name-cell').first().should('contain.text', 'not selected')
      cy.getTestId('selected-name-cell').first().click()
      cy.getTestId('selected-name-cell').first().should('contain.text', 'selected')
    })

    it('allows async cell slot content to refresh its ag-grid cell', () => {
    // eslint-disable-next-line vue/one-component-per-file
      const AsyncNameCell = defineComponent({
        name: 'AsyncNameCell',
        props: {
          refreshCell: {
            required: true,
            type: Function as PropType<() => void>,
          },
          rowName: {
            required: true,
            type: String,
          },
        },
        setup(props) {
          const value = ref('')

          onMounted(() => {
            setTimeout(() => {
              value.value = `resolved ${props.rowName}`
              props.refreshCell()
            }, 50)
          })

          return () => h('span', {
            'data-testid': 'async-name-cell',
          }, value.value || 'loading')
        },
      })

      mountTable({
        slots: {
          name: ({ refreshCell, row }) => h(AsyncNameCell, {
            refreshCell,
            rowName: row.name,
          }),
        },
      })

      cy.getTestId('async-name-cell').first().should('contain.text', 'loading')
      cy.getTestId('async-name-cell').first().should('contain.text', 'resolved Gateway service')
    })

    it('exposes refresh, selection, and grid api methods through component refs', () => {
      const fetcher = createPaginatedFetcher()
      const onRowSelect = cy.stub().as('rowSelect')
      let tableRef: Ref<DatatableExposed | null> | undefined

      cy.mount(defineComponent({
        setup() {
          tableRef = ref<DatatableExposed | null>(null)

          return () => h(DatatableComponent, {
            ref: tableRef,
            headers,
            fetcher,
            mode: 'pagination',
            rowKey: 'id',
            rowSelection: 'multiple',
            paginationPageSizeOptions: [10, 15, 25],
            tableConfig,
            'onRow:select': onRowSelect,
          }, {
            status: ({ row }: TableDataGridCellSlotProps<TestRow>) => h('strong', { 'data-testid': 'status-cell' }, String(row.status)),
          })
        },
      }))

      cy.contains('Gateway service').should('be.visible')
      cy.then(() => {
        expect(tableRef?.value?.getGridApi()).not.to.equal(undefined)
        tableRef?.value?.selectRowByKey('row-1')
      })
      cy.get('@rowSelect').should('have.been.calledWithMatch', [rows[0]])
      cy.then(() => {
        tableRef?.value?.deselectAll()
      })
      cy.get('@rowSelect').should('have.been.calledWithMatch', [])
      cy.wrap(fetcher).should('have.been.calledOnce')
      cy.then(() => {
        tableRef?.value?.refresh()
      })
      cy.wrap(fetcher).should('have.been.calledTwice')
    })

    it('refetches when refreshKey changes', () => {
      const fetcher = createPaginatedFetcher()
      const hostRefreshKey = ref(0)

      cy.mount(defineComponent({
        setup() {
          return () => h(DatatableComponent, {
            headers,
            fetcher,
            mode: 'pagination',
            rowKey: 'id',
            refreshKey: hostRefreshKey.value,
            tableConfig,
          })
        },
      }))

      cy.contains('Gateway service').should('be.visible')
      cy.wrap(fetcher).should('have.been.calledOnce')
      cy.then(() => {
        hostRefreshKey.value += 1
      })
      cy.wrap(fetcher).should('have.been.calledTwice')
    })

  })

  describe('sorting and infinite mode', () => {
    it('clears sort params when ag-grid sort state is cleared', () => {
      let gridApi: GridApi<TestRow> | undefined
      const fetcher = cy.stub().resolves({ data: rows.slice(0, 15), total: rows.length })

      mountTable({
        fetcher,
        config: {
          ...tableConfig,
          sortColumnKey: 'latency',
          sortColumnOrder: 'desc',
        },
        onGridReady: (api) => {
          gridApi = api
        },
      })

      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        sortColumnKey: 'latency',
        sortColumnOrder: 'desc',
      })
      cy.then(() => {
        gridApi?.applyColumnState({
          state: [{ colId: 'latency', sort: null }],
        })
      })
      cy.wrap(fetcher).should('have.been.calledTwice')
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        sortColumnKey: undefined,
        sortColumnOrder: undefined,
      })
    })

    it('uses infinite mode datasource params and fetches later blocks', () => {
      const fetcher = createInfiniteFetcher()

      mountTable({
        fetcher,
        mode: 'infinite',
      })

      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'infinite',
        pageSize: 15,
        startRow: 0,
        cursor: undefined,
      })
      cy.wrap(fetcher).its('firstCall.args.0').should('include', {
        mode: 'infinite',
        pageSize: 15,
        startRow: 0,
        cursor: undefined,
      })
      cy.get('.ag-body-viewport').scrollTo('bottom')
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'infinite',
        pageSize: 15,
        startRow: 15,
        cursor: 15,
      })
    })

    it('keeps state aligned with rendered infinite rows when a later block fails', () => {
      const onState = cy.stub().as('state')
      const fetcher = cy.stub().callsFake(({ startRow = 0, pageSize = 15 }) => {
        if (startRow > 0) {
          return Promise.reject(new Error('failed'))
        }

        return Promise.resolve({
          data: rows.slice(0, pageSize),
          hasMore: true,
        })
      })

      mountTable({
        fetcher,
        mode: 'infinite',
        onState,
      })

      cy.contains('Gateway service').should('be.visible')
      cy.get('@state').should('have.been.calledWithMatch', {
        state: 'success',
        hasData: true,
      })

      cy.get('.ag-body-viewport').scrollTo('bottom')
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'infinite',
        startRow: 15,
      })
      cy.getTestId('table-data-grid-error').should('not.exist')
      cy.get('@state').should((stateStub) => {
        const calls = (stateStub as unknown as sinon.SinonStub).getCalls()
        expect(calls.some(call => call.calledWithMatch({
          state: 'error',
          hasData: true,
        }))).to.equal(false)
      })
    })

    it('rebuilds the infinite datasource with search when search changes', () => {
      const fetcher = createInfiniteFetcher()

      mountTable({
        enableSearch: true,
        fetcher,
        mode: 'infinite',
        outsideSearch: '#outside-search-target',
      })

      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'infinite',
        startRow: 0,
        search: '',
      })
      cy.getTestId('outside-search-target').findTestId('table-data-grid-search').type('Infinite')
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'infinite',
        startRow: 0,
        cursor: undefined,
        search: 'Infinite',
      })
    })

    it('keeps the infinite grid mounted while sorting refetches the first block', () => {
      const fetcher = createInfiniteFetcher()

      mountTable({
        fetcher,
        mode: 'infinite',
      })

      cy.contains('Infinite service 1').should('be.visible')
      cy.getTestId('table-data-grid-header-latency').click()
      cy.getTestId('table-data-grid-empty').should('not.exist')
      cy.contains('Infinite service 1').should('be.visible')
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'infinite',
        startRow: 0,
        sortColumnKey: 'latency',
        sortColumnOrder: 'asc',
      })
    })

    it('keeps infinite rows rendered after sorting the same column twice', () => {
      const fetcher = createInfiniteFetcher()

      mountTable({
        fetcher,
        mode: 'infinite',
      })

      cy.contains('Infinite service 1').should('be.visible')
      cy.getTestId('table-data-grid-header-latency').click()
      cy.contains('Infinite service 1').should('be.visible')
      cy.getTestId('table-data-grid-header-latency').click()
      cy.getTestId('table-data-grid-empty').should('not.exist')
      cy.contains('Infinite service 1').should('be.visible')
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'infinite',
        startRow: 0,
        sortColumnKey: 'latency',
        sortColumnOrder: 'desc',
      })
    })

    it('rebuilds the infinite datasource with filter selection when a filter is applied', () => {
      const fetcher = createInfiniteFetcher()

      mountTable({
        fetcher,
        mode: 'infinite',
        headers: headersWithNameFilter,
      })

      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'infinite',
        startRow: 0,
        filterSelection: {},
      })
      cy.getTestId('filter-group-pill-name').findTestId('filter-pill').click()
      cy.getTestId('filter-group-pill-name').findTestId('filter-pill-input').type('Infinite')
      cy.getTestId('filter-group-pill-name').findTestId('filter-pill-apply').click()
      cy.wrap(fetcher).should('have.been.calledWithMatch', {
        mode: 'infinite',
        startRow: 0,
        filterSelection: createNameFilterSelection('Infinite'),
      })
    })
  })
})
