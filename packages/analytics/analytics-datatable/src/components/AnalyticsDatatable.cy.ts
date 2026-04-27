import type {
  AnalyticsDatatableCellSlotProps,
  AnalyticsDatatableConfig,
  AnalyticsDatatableFetcher,
  AnalyticsDatatableHeader,
  AnalyticsDatatableMode,
  AnalyticsDatatableRowSelectionMode,
} from '../types'
import type { ColumnState, GridApi } from 'ag-grid-community'
import type { FilterGroupSelection } from '@kong/kongponents'
import type { DefineComponent, VNode } from 'vue'
import { defineComponent, h, ref } from 'vue'
import AnalyticsDatatable from './AnalyticsDatatable.vue'

type TestRow = {
  id: string
  name: string
  status: number
  latency: number
}

type TestDatatableProps = {
  headers: Array<AnalyticsDatatableHeader<TestRow>>
  fetcher: AnalyticsDatatableFetcher<TestRow>
  mode?: AnalyticsDatatableMode
  rowKey?: keyof TestRow
  rowSelection?: AnalyticsDatatableRowSelectionMode
  error?: boolean
  paginationPageSizeOptions?: number[]
  tableConfig?: AnalyticsDatatableConfig
  filterSelection?: FilterGroupSelection
}

const rows: TestRow[] = Array.from({ length: 40 }, (_, index) => ({
  id: `row-${index + 1}`,
  name: index === 0 ? 'Gateway service' : `Service ${index + 1}`,
  status: index % 5 === 0 ? 500 : 200,
  latency: 40 + index,
}))

const headers: Array<AnalyticsDatatableHeader<TestRow>> = [
  { key: 'name', label: 'Name', sortable: true, hideable: false, width: 220 },
  { key: 'status', label: 'Status', sortable: true, width: 120 },
  { key: 'latency', label: 'Latency', sortable: true, tooltip: 'Response latency in milliseconds', width: 140 },
]

const headersWithNameFilter: Array<AnalyticsDatatableHeader<TestRow>> = [
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

const tableConfig: AnalyticsDatatableConfig = {
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
const DatatableComponent = AnalyticsDatatable as DefineComponent<TestDatatableProps>

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

describe('<AnalyticsDatatable />', () => {
  const mountTable = ({
    fetcher = cy.stub().resolves({ data: rows.slice(0, 15), total: rows.length }),
    config = tableConfig,
    headers: tableHeaders = headers,
    mode = 'pagination',
    rowSelection = 'multiple',
    error = false,
    useTableConfig = true,
    onGridReady = undefined,
    onRowSelect = undefined,
    onUpdateTableConfig = undefined,
    filterSelection = undefined,
    onUpdateFilterSelection = undefined,
    slots = {},
  }: {
    fetcher?: AnalyticsDatatableFetcher<TestRow>
    config?: AnalyticsDatatableConfig
    headers?: Array<AnalyticsDatatableHeader<TestRow>>
    mode?: AnalyticsDatatableMode
    rowSelection?: AnalyticsDatatableRowSelectionMode
    error?: boolean
    useTableConfig?: boolean
    onGridReady?: ((api: GridApi<TestRow>) => void) | undefined
    onRowSelect?: ((selectedRows: TestRow[]) => void) | undefined
    onUpdateTableConfig?: ((nextConfig: AnalyticsDatatableConfig) => void) | undefined
    filterSelection?: FilterGroupSelection | undefined
    onUpdateFilterSelection?: ((nextSelection: FilterGroupSelection) => void) | undefined
    slots?: Record<string, (props: Record<string, any>) => VNode>
  } = {}) => {
    const props = {
      headers: tableHeaders,
      fetcher,
      mode,
      rowKey: 'id',
      rowSelection,
      error,
      paginationPageSizeOptions: [10, 15, 25],
      'onGrid:ready': onGridReady,
      'onRow:select': onRowSelect,
      'onUpdate:tableConfig': (nextConfig: AnalyticsDatatableConfig) => {
        onUpdateTableConfig?.(nextConfig)
      },
      'onUpdate:filterSelection': (nextSelection: FilterGroupSelection) => {
        onUpdateFilterSelection?.(nextSelection)
      },
    }

    cy.mount(DatatableComponent, {
      props: {
        ...props,
        ...(useTableConfig ? { tableConfig: config } : {}),
        ...(filterSelection ? { filterSelection } : {}),
      },
      slots: {
        status: ({ row }: AnalyticsDatatableCellSlotProps<TestRow>) => h('strong', { 'data-testid': 'status-cell' }, String(row.status)),
        ...slots,
      },
    })

    return { fetcher }
  }

  const mountSyncedTable = ({
    config = tableConfig,
    fetcher = cy.stub().resolves({ data: rows.slice(0, 15), total: rows.length }),
    headers: tableHeaders = headers,
    onGridReady = undefined,
    onUpdateTableConfig = undefined,
  }: {
    config?: AnalyticsDatatableConfig
    fetcher?: AnalyticsDatatableFetcher<TestRow>
    headers?: Array<AnalyticsDatatableHeader<TestRow>>
    onGridReady?: ((api: GridApi<TestRow>) => void) | undefined
    onUpdateTableConfig?: ((nextConfig: AnalyticsDatatableConfig) => void) | undefined
  } = {}) => {
    const hostConfig = ref(config)

    cy.mount(defineComponent({
      setup() {
        return () => h(DatatableComponent, {
          headers: tableHeaders,
          fetcher,
          mode: 'pagination',
          rowKey: 'id',
          rowSelection: 'multiple',
          paginationPageSizeOptions: [10, 15, 25],
          tableConfig: hostConfig.value,
          'onGrid:ready': onGridReady,
          'onUpdate:tableConfig': (nextConfig: AnalyticsDatatableConfig) => {
            hostConfig.value = nextConfig
            onUpdateTableConfig?.(nextConfig)
          },
        }, {
          status: ({ row }: AnalyticsDatatableCellSlotProps<TestRow>) => h('strong', { 'data-testid': 'status-cell' }, String(row.status)),
        })
      },
    }))

    return { fetcher, hostConfig }
  }

  const hideStatusColumnFromMenu = ({ expectSearch = false }: { expectSearch?: boolean } = {}) => {
    cy.getTestId('column-visibility-trigger').click()
    if (expectSearch) {
      cy.getTestId('column-visibility-search').should('be.visible')
    }
    cy.getTestId('column-visibility-name').should('not.exist')
    cy.getTestId('column-visibility-status').click()
    cy.getTestId('column-visibility-status').find('input').should('not.be.checked')
    cy.getTestId('analytics-datatable-header-status').should('not.exist')
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
    cy.get('.analytics-datatable-grid .ag-header').then(($header) => {
      expect(getDisplayedColumnWidth(api)).to.be.greaterThan($header[0].clientWidth - 20)
    })
  }

  const waitForColumnSizing = () => {
    cy.window().then(win => new Cypress.Promise((resolve) => {
      win.requestAnimationFrame(() => {
        win.requestAnimationFrame(resolve)
      })
    }))
  }

  it('renders fetched rows and slotted cell content', () => {
    mountTable()

    cy.contains('Gateway service').should('be.visible')
    cy.contains('Service 2').should('be.visible')
    cy.getTestId('status-cell').first().should('contain.text', '500')
  })

  it('renders localized labels for table chrome', () => {
    mountTable()

    cy.contains('15 items per page').should('be.visible')
    cy.getTestId('analytics-datatable-bulk-actions-trigger').should('have.attr', 'aria-label', 'Selected row actions')
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

    cy.getTestId('analytics-datatable-empty').should('contain.text', 'No data')

    mountTable({
      error: true,
    })

    cy.getTestId('analytics-datatable-error')
      .should('contain.text', 'Unable to load data')
      .and('contain.text', 'There was an error loading table data.')
  })

  it('does not refetch when applying initial table config state', () => {
    const fetcher = cy.stub().resolves({ data: rows.slice(0, 15), total: rows.length })

    mountTable({
      fetcher,
      config: {
        ...tableConfig,
        sort: {
          key: 'latency',
          order: 'desc',
        },
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

    cy.contains('Gateway service').should('be.visible')
    cy.wrap(fetcher).should('have.been.calledOnce')
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
        sort: {
          key: 'latency',
          order: 'desc',
        },
      }
    })

    cy.wrap(fetcher).should('have.been.calledTwice')
    cy.wrap(fetcher).should('have.been.calledWithMatch', {
      mode: 'pagination',
      page: 1,
      pageSize: 10,
      sort: {
        key: 'latency',
        order: 'desc',
      },
    })
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
    let latestConfig: AnalyticsDatatableConfig | undefined
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
    cy.getTestId('analytics-datatable-header-status').should('not.exist')
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

    cy.then(() => {
      hostConfig.value = {
        ...hostConfig.value,
        columnVisibility: {
          ...hostConfig.value.columnVisibility,
          status: false,
        },
      }
    })
    cy.getTestId('analytics-datatable-header-status').should('not.exist')
    waitForColumnSizing()
    cy.then(() => {
      expectColumnsToFillGrid(gridApi!)
    })
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
    cy.getTestId('analytics-datatable-header-status').click()
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

  it('renders the default toolbar and selected row actions trigger', () => {
    mountTable()

    cy.getTestId('column-visibility-trigger').should('be.visible')
    cy.getTestId('analytics-datatable-bulk-actions-trigger')
      .should('be.visible')
      .and('be.disabled')
      .and('contain.text', '0')
    cy.contains('Gateway service').click()
    cy.getTestId('analytics-datatable-bulk-actions-trigger')
      .should('not.be.disabled')
      .and('contain.text', '1')
  })

  it('does not render filters when no headers are filterable', () => {
    mountTable()

    cy.getTestId('filter-selector').should('not.exist')
    cy.getTestId('filter-group-pill-name').should('not.exist')
  })

  it('renders filters when any header is filterable', () => {
    mountTable({
      headers: headersWithNameFilter,
    })

    cy.getTestId('filter-group-pill-name').should('be.visible')
  })

  it('renders sortable and tooltip header affordances', () => {
    const onUpdateTableConfig = cy.stub().as('updateTableConfig')
    mountTable({
      headers: [
        { key: 'name', label: 'Name', sortable: true, hideable: false, tooltip: 'Gateway service name', width: 220 },
        { key: 'status', label: 'Status', sortable: true, width: 120 },
        { key: 'latency', label: 'Latency', sortable: true, width: 140 },
      ],
      onUpdateTableConfig,
    })

    cy.getTestId('analytics-datatable-sort-name').should('be.visible')
    cy.getTestId('analytics-datatable-header-name').find('.header-tooltip-trigger').should('be.visible')
    cy.getTestId('analytics-datatable-header-name').find('.header-tooltip-trigger').trigger('mouseenter')
    cy.get('[role="tooltip"]').should('contain.text', 'Gateway service name')
    cy.getTestId('analytics-datatable-header-name').click()
    cy.get('@updateTableConfig').should('have.been.calledWithMatch', {
      sort: {
        key: 'name',
        order: 'asc',
      },
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

    cy.getTestId('analytics-datatable-header-status')
      .should('be.visible')
      .and('not.contain.text', 'Status')
  })

  it('provides selected rows to the bulk action items slot', () => {
    mountTable({
      slots: {
        'bulk-action-items': renderSelectedRowsBulkAction,
      },
    })

    cy.contains('Gateway service').click()
    cy.getTestId('analytics-datatable-bulk-actions-trigger').click()
    cy.getTestId('bulk-action').should('contain.text', '1:Gateway service')
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
    cy.getTestId('analytics-datatable-bulk-actions-trigger')
      .should('not.be.disabled')
      .and('not.contain.text', '1')
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

    cy.getTestId('analytics-datatable-bulk-actions-trigger').should('not.exist')
    cy.getTestId('bulk-action').should('not.exist')
    cy.getTestId('column-visibility-trigger').should('be.visible')
  })

  it('updates table config when a column is hidden from the menu', () => {
    const onUpdateTableConfig = cy.stub().as('updateTableConfig')

    mountTable({ onUpdateTableConfig })

    hideStatusColumnFromMenu({ expectSearch: true })
  })

  it('filters column visibility options with search', () => {
    mountTable({
      headers: [
        ...headers,
        { key: 'id', label: 'Request ID', width: 180 },
        { key: 'route', label: 'Route', width: 180 },
        { key: 'region', label: 'Region', width: 180 },
        { key: 'method', label: 'Method', width: 180 },
      ],
      config: {
        ...tableConfig,
        columnOrder: ['name', 'status', 'latency', 'id'],
        columnVisibility: {
          name: true,
          status: true,
          latency: true,
          id: true,
        },
      },
    })

    cy.getTestId('column-visibility-trigger').click()
    cy.getTestId('column-visibility-search').should('be.visible').type('status')
    cy.getTestId('column-visibility-status').should('be.visible')
    cy.getTestId('column-visibility-latency').should('not.exist')
    cy.getTestId('column-visibility-clear-search').click()
    cy.getTestId('column-visibility-latency').should('be.visible')
  })

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

    mountTable({
      fetcher,
      headers: headersWithNameFilter,
      onUpdateFilterSelection,
    })

    cy.wrap(fetcher).should('have.been.calledOnce')
    cy.getTestId('filter-group-pill-name').findTestId('filter-pill').click()
    cy.getTestId('filter-group-pill-name').findTestId('filter-pill-input').type('Gateway')
    cy.getTestId('filter-group-pill-name').findTestId('filter-pill-apply').click()
    cy.get('@updateFilterSelection').should('have.been.calledWithMatch', createNameFilterSelection('Gateway'))
    cy.wrap(fetcher).should('have.been.calledWithMatch', {
      mode: 'pagination',
      page: 1,
      filterSelection: createNameFilterSelection('Gateway'),
    })
  })

  it('refetches with updated filter selection when a filter is cleared', () => {
    const fetcher = createPaginatedFetcher()

    mountTable({
      fetcher,
      headers: headersWithNameFilter,
      filterSelection: createNameFilterSelection('Gateway'),
    })

    cy.getTestId('filter-group-pill-name').findTestId('interactive-pill-clear-icon').click()
    cy.wrap(fetcher).should('have.been.calledWithMatch', {
      mode: 'pagination',
      page: 1,
      filterSelection: {
        name: undefined,
      },
    })
  })

  it('emits table config and refetches when page size changes', () => {
    const fetcher = createPaginatedFetcher()
    const onUpdateTableConfig = cy.stub().as('updateTableConfig')
    let gridApi: GridApi<TestRow> | undefined
    let columnStateBeforePageSizeChange: Array<Pick<ColumnState, 'colId' | 'pinned' | 'width'>>

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

  it('clears sort params when ag-grid sort state is cleared', () => {
    let gridApi: GridApi<TestRow> | undefined
    const fetcher = cy.stub().resolves({ data: rows.slice(0, 15), total: rows.length })

    mountTable({
      fetcher,
      config: {
        ...tableConfig,
        sort: {
          key: 'latency',
          order: 'desc',
        },
      },
      onGridReady: (api) => {
        gridApi = api
      },
    })

    cy.wrap(fetcher).should('have.been.calledWithMatch', {
      sort: {
        key: 'latency',
        order: 'desc',
      },
    })
    cy.then(() => {
      gridApi?.applyColumnState({
        state: [{ colId: 'latency', sort: null }],
      })
    })
    cy.wrap(fetcher).should('have.been.calledTwice')
    cy.wrap(fetcher).should('have.been.calledWithMatch', {
      sort: undefined,
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
    cy.wrap(fetcher).should('have.been.calledOnce')
    cy.get('.ag-body-viewport').scrollTo('bottom')
    cy.wrap(fetcher).should('have.been.calledWithMatch', {
      mode: 'infinite',
      pageSize: 15,
      startRow: 15,
      cursor: 15,
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
