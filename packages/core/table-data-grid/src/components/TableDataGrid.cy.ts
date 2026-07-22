import type {
  TableDataGridFetcher,
  TableDataGridHeader,
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
}

type MountTableOptions = {
  containerStyle?: Record<string, string>
  fetcher: TableDataGridFetcher<TestRow>
  headers?: Array<TableDataGridHeader<TestRow>>
  error?: boolean
  onGridReady?: (api: GridApi<TestRow>) => void
  onState?: (payload: TableDataGridStatePayload) => void
  pageSize?: number
  refreshKey?: string | number | boolean
  slots?: TestTableDataGridSlots
}

const headers: Array<TableDataGridHeader<TestRow>> = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
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
  onGridReady,
  slots,
  ...props
}: MountTableOptions) => {
  const componentProps = reactive<Record<string, unknown>>({
    headers: tableHeaders,
    'onGrid:ready': onGridReady,
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
  fetcher,
  headers: tableHeaders,
}: {
  fetcher: TableDataGridFetcher<TestRow>
  headers: Array<TableDataGridHeader<TestRow>>
}) => {
  let gridApi: GridApi<TestRow> | undefined

  mountTestTableDataGrid({
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

const expectCellContentGeometry = ({
  overflowing,
  value,
}: {
  overflowing: boolean
  value: string
}) => {
  cy.contains('.table-data-grid-cell-content', value).then(($content) => {
    if (overflowing) {
      expect($content[0].scrollWidth).to.be.greaterThan($content[0].clientWidth)
    } else {
      expect($content[0].scrollWidth).to.be.at.most($content[0].clientWidth)
    }
  })
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

  it('truncates overflowing cell content and shows the full value in a tooltip', () => {
    const longName = 'A gateway service name that is much wider than its table column'
    const fetcher = cy.stub().resolves({
      data: [{ ...rows[0], name: longName }],
      total: 1,
    })

    mountTestTableDataGrid({
      fetcher,
      headers: [
        { key: 'name', label: 'Name', width: 160 },
        { key: 'status', label: 'Status' },
      ],
    })

    expectCellContentGeometry({ overflowing: true, value: longName })
    cy.contains('.table-data-grid-cell-content', longName)
      .should('have.css', 'overflow', 'hidden')
      .and('have.css', 'text-overflow', 'ellipsis')
      .and('have.css', 'white-space', 'nowrap')

    cy.contains('.table-data-grid-cell-content', longName).trigger('mouseenter')

    cy.contains('.popover', longName)
      .should('be.visible')
      .and(($tooltip) => {
        expect($tooltip.closest('.ag-cell')).to.have.length(0)
      })
  })

  it('does not show a tooltip when the full cell value fits', () => {
    const fetcher = cy.stub().resolves({
      data: [rows[0]],
      total: 1,
    })

    mountTestTableDataGrid({ fetcher })

    expectCellContentGeometry({ overflowing: false, value: rows[0].name })
    cy.contains('.table-data-grid-cell-content', rows[0].name).trigger('mouseenter')

    cy.contains('.popover', rows[0].name).should('not.exist')
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
    expectCellContentGeometry({ overflowing: true, value: scrolledName })
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

  it('updates truncation and tooltip content when AG Grid refreshes a reused cell renderer', () => {
    const refreshedName = 'A refreshed gateway service name that overflows its table column'
    const refreshedRows = [{ ...rows[0] }]
    const fetcher = cy.stub().resolves({
      data: refreshedRows,
      total: 1,
    })
    const getGridApi = mountTableWithGridApi({
      fetcher,
      headers: [
        { key: 'name', label: 'Name', width: 160 },
        { key: 'status', label: 'Status' },
      ],
    })

    expectCellContentGeometry({ overflowing: false, value: rows[0].name })
    cy.then(() => {
      refreshedRows[0].name = refreshedName
      getGridApi()?.refreshCells({ force: true })
    })

    cy.contains('.table-data-grid-cell-content', refreshedName).should('be.visible')
    expectCellContentGeometry({ overflowing: true, value: refreshedName })
    cy.contains('.table-data-grid-cell-content', refreshedName).trigger('mouseenter')

    cy.contains('.popover', refreshedName).should('be.visible')
  })

  it('clears the tooltip when a column resize makes the full cell value fit', () => {
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

    expectCellContentGeometry({ overflowing: true, value: longName })

    cy.then(() => {
      getGridApi()?.setColumnWidths([{ key: 'name', newWidth: 600 }])
    })
    expectCellContentGeometry({ overflowing: false, value: longName })
    cy.window().then(win => new Promise<void>((resolve) => {
      win.requestAnimationFrame(() => win.requestAnimationFrame(() => resolve()))
    }))
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
      })
      expect(secondParams).to.deep.equal({
        mode: 'infinite',
        pageSize: 15,
        cursor: 'next-cursor',
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
})
