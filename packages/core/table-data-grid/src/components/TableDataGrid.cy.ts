import type {
  TableDataGridCellClickPayload,
  TableDataGridCellSlotProps,
  TableDataGridConfig,
  TableDataGridFetcher,
  TableDataGridHeader,
  TableDataGridSort,
  TableDataGridStatePayload,
} from '../types'
import type { GridApi } from 'ag-grid-community'
import type { DefineComponent } from 'vue'
import { defineComponent, h, nextTick, reactive } from 'vue'
import TableDataGrid from './TableDataGrid.vue'

type TestRow = {
  id: string
  name: string
  status: string
}

type TestTableDataGridSlots = {
  'empty-state'?: () => unknown
  'error-state'?: () => unknown
  [slotName: string]: ((props: never) => unknown) | undefined
}

type MountTableOptions = {
  containerStyle?: Record<string, string>
  fetcher: TableDataGridFetcher<TestRow>
  headers?: Array<TableDataGridHeader<TestRow>>
  error?: boolean
  onCellClick?: (payload: TableDataGridCellClickPayload<TestRow>) => void
  onGridReady?: (api: GridApi<TestRow>) => void
  onRowClick?: (row: TestRow) => void
  onSort?: (payload: TableDataGridSort) => void
  onState?: (payload: TableDataGridStatePayload) => void
  onUpdateTableConfig?: (payload: TableDataGridConfig) => void
  pageSize?: number
  refreshKey?: string | number | boolean
  slots?: TestTableDataGridSlots
  tableConfig?: TableDataGridConfig
}

const headers: Array<TableDataGridHeader<TestRow>> = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
]

const sortableHeaders: Array<TableDataGridHeader<TestRow>> = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
]

const rows: TestRow[] = [
  { id: 'row-1', name: 'Gateway service', status: 'Active' },
  { id: 'row-2', name: 'Portal app', status: 'Inactive' },
]

const createRows = (startIndex: number, count: number): TestRow[] => (
  Array.from({ length: count }, (_, index) => {
    const rowIndex = startIndex + index

    return {
      id: `row-${rowIndex}`,
      name: `Service ${rowIndex}`,
      status: rowIndex % 2 === 0 ? 'Inactive' : 'Active',
    }
  })
)

const createResetFetcher = () => cy.stub().callsFake(({ pageSize }) => Promise.resolve({
  cursor: 'next-cursor',
  data: createRows(1, pageSize),
  hasMore: false,
}))

const TestTableDataGrid = TableDataGrid as unknown as DefineComponent

const mountTestTableDataGrid = ({
  containerStyle,
  headers: tableHeaders = headers,
  onCellClick,
  onGridReady,
  onRowClick,
  onSort,
  onUpdateTableConfig,
  slots,
  ...props
}: MountTableOptions) => {
  const componentProps = reactive<Record<string, unknown>>({
    headers: tableHeaders,
    'onCell:click': onCellClick,
    'onGrid:ready': onGridReady,
    'onRow:click': onRowClick,
    onSort,
    'onUpdate:tableConfig': onUpdateTableConfig,
    ...props,
  })

  // eslint-disable-next-line vue/one-component-per-file -- Cypress harness component is scoped to this test file.
  cy.mount(defineComponent({
    name: 'TableDataGridTestHarness',
    setup() {
      return () => h('div', {
        'data-testid': 'table-data-grid-test-parent',
        style: {
          height: '520px',
          width: '640px',
          ...containerStyle,
        },
      }, [
        h(TestTableDataGrid, componentProps, slots),
      ])
    },
  }))

  return {
    setProps: (nextProps: Record<string, unknown>) => cy.then(() => {
      Object.assign(componentProps, nextProps)

      return nextTick()
    }),
  }
}

const getDisplayedColumnWidth = (api: GridApi<TestRow>) => api.getColumnState()
  .filter(column => !column.hide)
  .reduce((total, column) => total + (column.width ?? 0), 0)

const getColumnWidthsById = (api: GridApi<TestRow> | undefined) => Object.fromEntries(
  api?.getColumnState().map(column => [column.colId, column.width]) ?? [],
) as Record<string, number | undefined>

const expectColumnsToFillGrid = (api: GridApi<TestRow>) => {
  cy.get('.table-data-grid-grid .ag-header').then(($header) => {
    const displayedColumnWidth = getDisplayedColumnWidth(api)

    expect(displayedColumnWidth).to.be.greaterThan($header[0].clientWidth - 20)
    expect(displayedColumnWidth).to.be.lessThan($header[0].clientWidth + 20)
  })
}

const expectHorizontalOverflow = () => {
  cy.get('.table-data-grid-grid .ag-grid-viewport').then(($viewport) => {
    expect($viewport[0].scrollWidth).to.be.greaterThan($viewport[0].clientWidth)
  })
}

const expectElementHeight = (selector: string, height: number) => {
  cy.get(selector).then(($element) => {
    expect($element[0].getBoundingClientRect().height).to.be.closeTo(height, 1)
  })
}

const mountTableInFixedHeightContainer = ({
  fetcher,
  height,
}: {
  fetcher: TableDataGridFetcher<TestRow>
  height: number
}) => {
  // eslint-disable-next-line vue/one-component-per-file -- Cypress harness component is scoped to this test file.
  cy.mount(defineComponent({
    name: 'FixedHeightTableDataGridTest',
    setup() {
      return () => h('div', {
        'data-testid': 'fixed-height-parent',
        style: {
          height: `${height}px`,
          width: '640px',
        },
      }, [
        h(TestTableDataGrid, {
          fetcher,
          headers,
        }),
      ])
    },
  }))
}

const mountTableWithGridApi = ({
  containerStyle,
  fetcher,
  headers: tableHeaders,
}: {
  containerStyle?: Record<string, string>
  fetcher: TableDataGridFetcher<TestRow>
  headers: Array<TableDataGridHeader<TestRow>>
}) => {
  let gridApi: GridApi<TestRow> | undefined

  mountTestTableDataGrid({
    containerStyle,
    fetcher,
    headers: tableHeaders,
    onGridReady: (api) => {
      gridApi = api
    },
  })

  return () => gridApi
}

const expectRenderedColumnWidths = (
  getGridApi: () => GridApi<TestRow> | undefined,
  assertWidths: ({
    gridApi,
    widthsByColumn,
  }: {
    gridApi: GridApi<TestRow> | undefined
    widthsByColumn: Record<string, number | undefined>
  }) => void,
) => {
  cy.contains('.ag-cell', 'Gateway service').should('be.visible')
  cy.then(() => {
    const gridApi = getGridApi()

    assertWidths({
      gridApi,
      widthsByColumn: getColumnWidthsById(gridApi),
    })
  })
}

const expectOverflowingCellContent = (value: string) => {
  cy.contains('.table-data-grid-cell-content', value).should(($content) => {
    expect($content[0].scrollWidth).to.be.greaterThan($content[0].clientWidth)
  })
}

const expectOverflowTooltip = (value: string) => {
  expectOverflowingCellContent(value)
  cy.contains('.table-data-grid-cell-content', value).trigger('mouseenter')
  cy.contains('.popover', value).should('be.visible')
}

const expectColumnWidthAndOverflowTooltip = ({
  getGridApi,
  value,
  width,
}: {
  getGridApi: () => GridApi<TestRow> | undefined
  value: string
  width: number
}) => {
  cy.contains('.table-data-grid-cell-content', value).should('be.visible')
  cy.then(() => {
    expect(getColumnWidthsById(getGridApi()).name).to.equal(width)
  })
  expectOverflowTooltip(value)
}

const scrollToSecondBlock = ({
  fetcher,
  onState,
}: {
  fetcher: TableDataGridFetcher<TestRow>
  onState?: (payload: TableDataGridStatePayload) => void
}) => {
  let gridApi: GridApi<TestRow> | undefined

  mountTestTableDataGrid({
    fetcher,
    onGridReady: (api) => {
      gridApi = api
    },
    onState,
    pageSize: 15,
  })

  cy.contains('.ag-cell', 'Service 1').should('be.visible')
  cy.then(() => {
    expect(gridApi).to.not.equal(undefined)
    gridApi!.ensureIndexVisible(15, 'bottom')
  })
  cy.wrap(fetcher).should('have.been.calledTwice')
}

describe('<TableDataGrid />', () => {
  it('fetches the first infinite block and renders AG Grid headers and data', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    mountTestTableDataGrid({
      fetcher,
      pageSize: 15,
    })

    cy.get('.kong-ui-public-table-data-grid').should('be.visible')
    cy.get('.ag-root').should('be.visible')
    cy.contains('.ag-header-cell', 'Name').should('be.visible')
    cy.contains('.ag-header-cell', 'Status').should('be.visible')
    cy.contains('.ag-cell', 'Gateway service').should('be.visible')
    cy.contains('.ag-cell', 'Active').should('be.visible')
    cy.contains('.ag-cell', 'Portal app').should('be.visible')
    cy.contains('.ag-cell', 'Inactive').should('be.visible')
    cy.wrap(fetcher).should('have.been.calledOnceWith', {
      mode: 'infinite',
      pageSize: 15,
      cursor: undefined,
      sort: { sortColumnKey: undefined, sortColumnOrder: undefined },
    })
  })

  it('uses Kong theme text colors for AG Grid headers and cells', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    mountTestTableDataGrid({
      containerStyle: {
        '--kui-color-text-neutral': '#123456',
        '--kui-color-text': '#abcdef',
      },
      fetcher,
    })

    cy.contains('.ag-cell', 'Gateway service').should('be.visible')
    cy.contains('.ag-header-cell-text', 'Name').should('have.css', 'color', 'rgb(18, 52, 86)')
    cy.contains('.ag-cell', 'Gateway service').should('have.css', 'color', 'rgb(171, 205, 239)')
  })

  it('truncates overflowing cell content in unconstrained flex columns', () => {
    const longName = 'A gateway service name that is much wider than its flexible table column'
    const fetcher = cy.stub().resolves({
      data: [{ ...rows[0], name: longName }],
      total: 1,
    })

    mountTestTableDataGrid({ fetcher })

    expectOverflowTooltip(longName)
  })

  it('truncates overflowing cell content in columns with minWidth', () => {
    const longName = 'A gateway service name that is much wider than its minimum-width table column'
    const fetcher = cy.stub().resolves({
      data: [{ ...rows[0], name: longName }],
      total: 1,
    })
    const getGridApi = mountTableWithGridApi({
      containerStyle: {
        width: '300px',
      },
      fetcher,
      headers: [
        { key: 'name', label: 'Name', minWidth: 160 },
        { key: 'status', label: 'Status', minWidth: 160 },
      ],
    })

    expectColumnWidthAndOverflowTooltip({
      getGridApi,
      value: longName,
      width: 160,
    })
  })

  it('truncates overflowing cell content in columns with maxWidth', () => {
    const longName = 'A gateway service name that is much wider than its maximum-width table column'
    const fetcher = cy.stub().resolves({
      data: [{ ...rows[0], name: longName }],
      total: 1,
    })
    const getGridApi = mountTableWithGridApi({
      fetcher,
      headers: [
        { key: 'name', label: 'Name', maxWidth: 160 },
        { key: 'status', label: 'Status' },
      ],
    })

    expectColumnWidthAndOverflowTooltip({
      getGridApi,
      value: longName,
      width: 160,
    })
  })

  it('keeps the tooltip anchored after AG Grid virtualizes rows while scrolling', () => {
    const virtualizedRows = createRows(1, 50).map(row => ({
      ...row,
      name: `${row.name} has intentionally long content that overflows the column`,
    }))
    const scrolledName = virtualizedRows[30].name
    const fetcher = cy.stub().resolves({
      data: virtualizedRows,
      total: virtualizedRows.length,
    })
    let gridApi: GridApi<TestRow> | undefined

    mountTestTableDataGrid({
      fetcher,
      headers: [
        { key: 'name', label: 'Name', width: 160 },
        { key: 'status', label: 'Status' },
      ],
      onGridReady: (api) => {
        gridApi = api
      },
      pageSize: virtualizedRows.length,
    })

    cy.contains('.table-data-grid-cell-content', virtualizedRows[0].name).should('be.visible')
    cy.then(() => gridApi?.ensureIndexVisible(30, 'middle'))
    expectOverflowingCellContent(scrolledName)
    cy.contains('.table-data-grid-cell-content', scrolledName)
      .should('be.visible')
    cy.contains('.table-data-grid-cell-content', scrolledName).trigger('mouseenter')

    cy.contains('.popover', scrolledName)
      .should('be.visible')
      .then(($tooltip) => {
        cy.contains('.table-data-grid-cell-content', scrolledName).then(($content) => {
          const contentRect = $content[0].getBoundingClientRect()
          const tooltipRect = $tooltip[0].getBoundingClientRect()

          expect($tooltip.parent()[0]).to.equal($content[0].ownerDocument.body)
          expect(tooltipRect.left).to.be.closeTo(contentRect.left, 1)
          expect(tooltipRect.top).to.be.closeTo(contentRect.bottom, 1)
        })
      })
  })

  it('clears the tooltip when AG Grid expands the column to fit the full value', () => {
    const longName = 'A gateway service name that initially overflows its table column'
    const fetcher = cy.stub().resolves({
      data: [{ ...rows[0], name: longName }],
      total: 1,
    })
    const getGridApi = mountTableWithGridApi({
      fetcher,
      headers: [
        { key: 'name', label: 'Name', width: 160 },
        { key: 'status', label: 'Status' },
      ],
    })

    expectOverflowingCellContent(longName)
    cy.then(() => {
      getGridApi()?.setColumnWidths([{ key: 'name', newWidth: 600 }])
    })
    cy.contains('.table-data-grid-cell-content', longName).should(($content) => {
      expect($content[0].scrollWidth).to.be.at.most($content[0].clientWidth)
    })
    cy.contains('.table-data-grid-cell-content', longName).trigger('mouseenter')
    cy.contains('.popover', longName).should('not.exist')
  })

  it('fills a taller parent height by default', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    mountTableInFixedHeightContainer({
      fetcher,
      height: 520,
    })

    cy.contains('.ag-cell', 'Gateway service').should('be.visible')
    expectElementHeight('[data-testid="fixed-height-parent"]', 520)
    expectElementHeight('[data-testid="table-data-grid"]', 520)
    cy.get('.table-data-grid-grid').then(($grid) => {
      expect($grid[0].getBoundingClientRect().height).to.be.greaterThan(500)
    })
  })

  it('shrinks with a shorter parent without forcing a 360px minimum height', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    mountTableInFixedHeightContainer({
      fetcher,
      height: 240,
    })

    cy.contains('.ag-cell', 'Gateway service').should('be.visible')
    expectElementHeight('[data-testid="fixed-height-parent"]', 240)
    expectElementHeight('[data-testid="table-data-grid"]', 240)
    cy.get('.table-data-grid-grid').then(($grid) => {
      expect($grid[0].getBoundingClientRect().height).to.be.at.most(240)
    })
  })

  it('uses response cursors for later blocks without leaking AG Grid ranges', () => {
    const firstBlockRows = createRows(1, 15)
    const secondBlockRows = createRows(16, 15)
    const fetcher = cy.stub()
      .onFirstCall()
      .resolves({
        cursor: 'next-cursor',
        data: firstBlockRows,
        hasMore: true,
      })
      .onSecondCall()
      .resolves({
        cursor: 'last-cursor',
        data: secondBlockRows,
        hasMore: true,
      })

    scrollToSecondBlock({ fetcher })
    cy.then(() => {
      const firstParams = fetcher.firstCall.args[0]
      const secondParams = fetcher.secondCall.args[0]

      expect(firstParams).to.deep.equal({
        mode: 'infinite',
        pageSize: 15,
        cursor: undefined,
        sort: { sortColumnKey: undefined, sortColumnOrder: undefined },
      })
      expect(secondParams).to.deep.equal({
        mode: 'infinite',
        pageSize: 15,
        cursor: 'next-cursor',
        sort: { sortColumnKey: undefined, sortColumnOrder: undefined },
      })

      for (const params of [firstParams, secondParams]) {
        expect(params).not.to.have.property('startRow')
        expect(params).not.to.have.property('endRow')
        expect(params).not.to.have.property('offset')
      }
    })
  })

  it('resets the cursor chain when refreshKey changes', () => {
    const fetcher = createResetFetcher()
    const tableDataGrid = mountTestTableDataGrid({
      fetcher,
      pageSize: 15,
      refreshKey: 0,
    })

    cy.contains('.ag-cell', 'Service 1').should('be.visible')
    tableDataGrid.setProps({ refreshKey: 1 })

    cy.wrap(fetcher).should('have.been.calledTwice')
    cy.then(() => {
      expect(fetcher.secondCall.args[0]).to.deep.equal({
        mode: 'infinite',
        pageSize: 15,
        cursor: undefined,
        sort: { sortColumnKey: undefined, sortColumnOrder: undefined },
      })
    })
  })

  it('resets the cursor chain and cache block size when pageSize changes', () => {
    const fetcher = createResetFetcher()
    const tableDataGrid = mountTestTableDataGrid({
      fetcher,
      pageSize: 15,
    })

    cy.contains('.ag-cell', 'Service 1').should('be.visible')
    tableDataGrid.setProps({ pageSize: 10 })

    cy.wrap(fetcher).should((stub) => {
      expect(stub.callCount).to.be.greaterThan(1)
      expect(stub.secondCall.args[0]).to.deep.equal({
        mode: 'infinite',
        pageSize: 10,
        cursor: undefined,
        sort: { sortColumnKey: undefined, sortColumnOrder: undefined },
      })
    })
  })

  it('renders host error as a full table replacement', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    mountTestTableDataGrid({
      error: true,
      fetcher,
    })

    cy.getTestId('table-error-state')
      .should('contain.text', 'An error occurred')
      .and('contain.text', 'Data cannot be displayed due to an error.')
    cy.get('.table-data-grid-grid').should('not.exist')
  })

  it('renders an empty state after the first block succeeds with no rows', () => {
    const onState = cy.stub().as('state')
    const fetcher = cy.stub().resolves({
      data: [],
      hasMore: false,
    })

    mountTestTableDataGrid({
      fetcher,
      onState,
    })

    cy.getTestId('table-empty-state')
      .should('be.visible')
      .and('contain.text', 'No Data')
      .and('contain.text', 'There is no data to display.')
    cy.get('@state').should('have.been.calledWithMatch', {
      state: 'success',
      hasData: false,
    })
  })

  it('renders a custom empty state slot', () => {
    const fetcher = cy.stub().resolves({
      data: [],
      hasMore: false,
    })

    mountTestTableDataGrid({
      fetcher,
      slots: {
        'empty-state': () => h('div', { 'data-testid': 'custom-empty-state' }, 'Nothing matched'),
      },
    })

    cy.getTestId('custom-empty-state').should('contain.text', 'Nothing matched')
    cy.getTestId('table-empty-state').should('contain.text', 'Nothing matched')
  })

  it('renders a custom error state slot', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    mountTestTableDataGrid({
      error: true,
      fetcher,
      slots: {
        'error-state': () => h('div', { 'data-testid': 'custom-error-state' }, 'Try again later'),
      },
    })

    cy.getTestId('custom-error-state').should('contain.text', 'Try again later')
    cy.getTestId('table-error-state').should('contain.text', 'Try again later')
  })

  it('fits columns to available width when headers do not configure width constraints', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })
    const getGridApi = mountTableWithGridApi({ fetcher, headers })

    expectRenderedColumnWidths(getGridApi, ({ gridApi }) => {
      expect(gridApi).to.not.equal(undefined)
      expectColumnsToFillGrid(gridApi!)
    })
  })

  it('preserves explicit column widths and allows horizontal overflow', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })
    const getGridApi = mountTableWithGridApi({
      fetcher,
      headers: [
        { key: 'name', label: 'Name', width: 900 },
        { key: 'status', label: 'Status', width: 600 },
      ],
    })

    expectRenderedColumnWidths(getGridApi, ({ widthsByColumn }) => {
      expect(widthsByColumn.name).to.equal(900)
      expect(widthsByColumn.status).to.equal(600)
    })
    expectHorizontalOverflow()
  })

  it('uses minWidth as a lower bound without disabling default column fill', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })
    const getGridApi = mountTableWithGridApi({
      fetcher,
      headers: [
        { key: 'name', label: 'Name', minWidth: 280 },
        { key: 'status', label: 'Status', minWidth: 160 },
      ],
    })

    expectRenderedColumnWidths(getGridApi, ({ gridApi, widthsByColumn }) => {
      expect(widthsByColumn.name).to.be.at.least(280)
      expect(widthsByColumn.status).to.be.at.least(160)
      expectColumnsToFillGrid(gridApi!)
    })
  })

  it('uses unconstrained columns to fill space left by fixed-width columns', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })
    const getGridApi = mountTableWithGridApi({
      fetcher,
      headers: [
        { key: 'name', label: 'Name', width: 240 },
        { key: 'status', label: 'Status' },
      ],
    })

    expectRenderedColumnWidths(getGridApi, ({ gridApi, widthsByColumn }) => {
      expect(widthsByColumn.name).to.equal(240)
      expect(widthsByColumn.status).to.be.greaterThan(240)
      expectColumnsToFillGrid(gridApi!)
    })
  })

  it('does not apply default flex sizing to columns with maxWidth', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })
    const getGridApi = mountTableWithGridApi({
      fetcher,
      headers: [
        { key: 'name', label: 'Name', maxWidth: 600 },
        { key: 'status', label: 'Status' },
      ],
    })

    expectRenderedColumnWidths(getGridApi, ({ gridApi, widthsByColumn }) => {
      expect(widthsByColumn.name).to.equal(200)
      expectColumnsToFillGrid(gridApi!)
    })
  })

  it('emits error state for a failed first block without rendering visible error UI', () => {
    const onState = cy.stub().as('state')
    const fetcher = cy.stub().rejects(new Error('failed'))

    mountTestTableDataGrid({
      fetcher,
      onState,
    })

    cy.getTestId('table-error-state').should('not.exist')
    cy.get('@state').should('have.been.calledWithMatch', {
      state: 'error',
      hasData: false,
    })
  })

  it('emits loading and success state for fetched rows', () => {
    const onState = cy.stub().as('state')
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    mountTestTableDataGrid({
      fetcher,
      onState,
    })

    cy.contains('.ag-cell', 'Gateway service').should('be.visible')
    cy.get('@state').should('have.been.calledWithMatch', {
      state: 'loading',
      hasData: false,
    })
    cy.get('@state').should('have.been.calledWithMatch', {
      state: 'success',
      hasData: true,
    })
  })

  it('emits loading and success state for later infinite blocks', () => {
    const firstBlockRows = createRows(1, 15)
    const secondBlockRows = createRows(16, 15)
    const onState = cy.stub().as('state')
    let resolveSecondBlock: (result: {
      data: TestRow[]
      hasMore: boolean
    }) => void
    const secondBlockPromise = new Promise<{
      data: TestRow[]
      hasMore: boolean
    }>((resolve) => {
      resolveSecondBlock = resolve
    })
    const fetcher = cy.stub()
      .onFirstCall()
      .resolves({
        cursor: 'next-cursor',
        data: firstBlockRows,
        hasMore: true,
      })
      .onSecondCall()
      .returns(secondBlockPromise)

    scrollToSecondBlock({ fetcher, onState })
    cy.get('@state').should('have.been.calledWithMatch', {
      state: 'loading',
      hasData: true,
    })

    cy.then(() => {
      resolveSecondBlock({
        data: secondBlockRows,
        hasMore: false,
      })
    })

    cy.contains('.ag-cell', 'Service 16').should('be.visible')
    cy.get('@state').should((state) => {
      const successEvents = state.getCalls().filter(call => (
        call.args[0].state === 'success' && call.args[0].hasData === true
      ))

      expect(successEvents).to.have.length.greaterThan(1)
    })
  })

  it('does not emit loading while waiting for the first fetch to start', () => {
    const eventOrder: string[] = []
    const onState = cy.stub().callsFake(() => {
      eventOrder.push('state')
    }).as('state')
    const fetcher = cy.stub().callsFake(() => {
      eventOrder.push('fetcher')

      return new Promise(() => undefined)
    })

    mountTestTableDataGrid({
      fetcher,
      onState,
    })

    cy.wrap(fetcher).should('have.been.calledOnce')
    cy.get('@state').should('have.been.calledWithMatch', {
      state: 'loading',
      hasData: false,
    })
    cy.then(() => {
      expect(eventOrder).to.deep.equal(['fetcher', 'state'])
    })
  })

  it('renders a header-supplied custom cell renderer with the full slot payload', () => {
    const statusRow = { ...rows[0] }
    const fetcher = cy.stub().resolves({
      data: [statusRow, rows[1]],
      total: rows.length,
    })

    mountTestTableDataGrid({
      fetcher,
      headers: [
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
      ],
      slots: {
        status: ({ column, refreshCell, row, rowIndex, rowValue, selected }: TableDataGridCellSlotProps<TestRow>) => h(
          'span',
          { 'data-testid': 'custom-status-badge' },
          [
            h('span', { 'data-testid': 'status-row-name' }, row.name),
            h('span', { 'data-testid': 'status-row-value' }, String(rowValue)),
            h('span', { 'data-testid': 'status-column-label' }, column.label),
            h('span', { 'data-testid': 'status-row-index' }, String(rowIndex)),
            h('span', { 'data-testid': 'status-selected' }, String(selected)),
            h('button', { 'data-testid': 'status-refresh-button', onClick: refreshCell }, 'Refresh'),
          ],
        ),
      } as TestTableDataGridSlots,
    })

    cy.getTestId('status-row-name').should('contain.text', 'Gateway service')
    cy.getTestId('status-row-value').should('contain.text', 'Active')
    cy.getTestId('status-column-label').should('contain.text', 'Status')
    cy.getTestId('status-row-index').should('contain.text', '0')
    cy.getTestId('status-selected').should('contain.text', 'false')

    // Mutate the row out-of-band, then use refreshCell to force the stale cell to re-read it.
    cy.then(() => {
      statusRow.status = 'Suspended'
    })
    cy.getTestId('status-refresh-button').first().click()
    cy.getTestId('status-row-value').first().should('contain.text', 'Suspended')
  })

  it('emits row:click with the clicked row data and the source event', () => {
    const onRowClick = cy.stub().as('rowClick')
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    mountTestTableDataGrid({
      fetcher,
      onRowClick,
    })

    cy.contains('.ag-cell', 'Gateway service').click()
    cy.get('@rowClick').should((stub) => {
      expect(stub.callCount).to.equal(1)
      const [row, event] = stub.getCall(0).args

      expect(row).to.equal(rows[0])
      expect(event).to.have.property('type', 'rowClicked')
    })
  })

  it('suppresses row:click but still emits cell:click for disableRowClick columns', () => {
    const onCellClick = cy.stub().as('cellClick')
    const onRowClick = cy.stub().as('rowClick')
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    mountTestTableDataGrid({
      fetcher,
      headers: [
        { key: 'name', label: 'Name' },
        { disableRowClick: true, key: 'status', label: 'Status' },
      ],
      onCellClick,
      onRowClick,
      slots: {
        status: ({ rowValue }: TableDataGridCellSlotProps<TestRow>) => h(
          'button',
          { 'data-testid': 'status-action-button' },
          `Action: ${rowValue}`,
        ),
      } as TestTableDataGridSlots,
    })

    cy.getTestId('status-action-button').first().click()
    cy.get('@rowClick').should('not.have.been.called')
    cy.get('@cellClick').should('have.been.calledOnceWith', {
      columnKey: 'status',
      row: rows[0],
      value: rows[0].status,
    })

    // Non-disabled column: row:click should still fire normally.
    cy.contains('.ag-cell', 'Gateway service').click()
    cy.get('@rowClick').should((stub) => {
      expect(stub.callCount).to.equal(1)
      const [row, event] = stub.getCall(0).args

      expect(row).to.equal(rows[0])
      expect(event).to.have.property('type', 'rowClicked')
    })
  })

  it('sorts on a header click, emitting sort then update:tableConfig and re-fetching with the new sort', () => {
    const onSort = cy.stub().as('sort')
    const onUpdateTableConfig = cy.stub().as('updateTableConfig')
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    mountTestTableDataGrid({
      fetcher,
      headers: sortableHeaders,
      onSort,
      onUpdateTableConfig,
    })

    cy.contains('.ag-cell', 'Gateway service').should('be.visible')
    cy.contains('.ag-header-cell', 'Name').click()

    cy.get('@sort').should('have.been.calledOnceWith', { sortColumnKey: 'name', sortColumnOrder: 'asc' })
    cy.get('@updateTableConfig').should('have.been.calledOnceWith', {
      sortColumnKey: 'name',
      sortColumnOrder: 'asc',
      pageSize: 25,
    })
    // AG Grid's own infinite row model purges its block cache and re-fetches
    // block 0 as soon as the native header click updates its sort state,
    // ahead of (and in addition to) the datasource rebuild this package
    // triggers via resetKey — so at least one re-fetch beyond the initial
    // block is guaranteed, but the exact count is an AG Grid implementation
    // detail. What matters is that every re-fetch after the click carries
    // the new sort.
    cy.wrap(fetcher).should((stub) => {
      expect(stub.callCount).to.be.greaterThan(1)
      expect(stub.lastCall.args[0]).to.deep.equal({
        mode: 'infinite',
        pageSize: 25,
        cursor: undefined,
        sort: { sortColumnKey: 'name', sortColumnOrder: 'asc' },
      })
    })
  })

  it('seeds the first fetch with a host-controlled initial tableConfig sort', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    mountTestTableDataGrid({
      fetcher,
      headers: sortableHeaders,
      tableConfig: { sortColumnKey: 'name', sortColumnOrder: 'desc' },
    })

    cy.contains('.ag-cell', 'Gateway service').should('be.visible')
    cy.wrap(fetcher).should('have.been.calledOnceWith', {
      mode: 'infinite',
      pageSize: 25,
      cursor: undefined,
      sort: { sortColumnKey: 'name', sortColumnOrder: 'desc' },
    })
  })

  it('keeps rendering rows across many consecutive sort changes', () => {
    // Regression test: AG Grid's shared row-node block loader tracks each
    // block request by index. A discarded (superseded) request that never
    // calls back leaves that tracking permanently "in flight" for that
    // block, silently blocking every later request for the same index —
    // so a second (or third, ...) sort change could leave the grid empty
    // forever even though the fetcher keeps resolving normally.
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    mountTestTableDataGrid({
      fetcher,
      headers: sortableHeaders,
    })

    cy.contains('.ag-cell', 'Gateway service').should('be.visible')

    for (let i = 0; i < 6; i++) {
      cy.contains('.ag-header-cell', i % 2 === 0 ? 'Name' : 'Status').click()
      cy.contains('.ag-cell', 'Gateway service').should('be.visible')
    }
  })

  it('never leaves more than one column sorted, even when shift-clicking a second header', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })
    const getGridApi = mountTableWithGridApi({ fetcher, headers: sortableHeaders })

    cy.contains('.ag-cell', 'Gateway service').should('be.visible')
    cy.contains('.ag-header-cell', 'Name').click()
    cy.contains('.ag-header-cell', 'Name').should('have.attr', 'aria-sort', 'ascending')
    // AG Grid's persistent (but currently empty/hidden) loading-overlay
    // wrapper node can trip Cypress's actionability check on the next
    // click even though it isn't actually blocking interaction.
    cy.contains('.ag-header-cell', 'Status').click({ force: true, shiftKey: true })

    // suppressMultiSort makes AG Grid ignore the shift modifier outright
    // (the second header's sort attempt is a no-op) rather than replacing
    // the sort — either way, the invariant this test cares about is that
    // there is never more than one sorted column.
    cy.then(() => {
      const sortedColumns = getGridApi()?.getColumnState().filter(column => column.sort) ?? []

      expect(sortedColumns).to.have.length(1)
      expect(sortedColumns[0].colId).to.equal('name')
    })
  })

  it('moves the grid sort when the tableConfig prop changes, without a click', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })
    let gridApi: GridApi<TestRow> | undefined
    const tableDataGrid = mountTestTableDataGrid({
      fetcher,
      headers: sortableHeaders,
      onGridReady: (api) => {
        gridApi = api
      },
    })

    cy.contains('.ag-cell', 'Gateway service').should('be.visible')
    tableDataGrid.setProps({ tableConfig: { sortColumnKey: 'status', sortColumnOrder: 'asc' } })

    cy.then(() => {
      const sortedColumns = gridApi?.getColumnState().filter(column => column.sort) ?? []

      expect(sortedColumns).to.have.length(1)
      expect(sortedColumns[0].colId).to.equal('status')
    })
  })

  it('shows the unsorted sort icon on a column with showSortIcon, before any click', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    mountTestTableDataGrid({
      fetcher,
      headers: [
        { key: 'name', label: 'Name', sortable: true, showSortIcon: true },
        { key: 'status', label: 'Status', sortable: true },
      ],
    })

    cy.contains('.ag-cell', 'Gateway service').should('be.visible')
    cy.contains('.ag-header-cell', 'Name').find('.ag-sort-none-icon').should('be.visible')
    cy.contains('.ag-header-cell', 'Status').find('.ag-sort-none-icon').should('not.be.visible')
  })
})
