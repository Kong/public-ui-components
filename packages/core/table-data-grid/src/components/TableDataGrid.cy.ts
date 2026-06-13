import type {
  TableDataGridFetcher,
  TableDataGridHeader,
  TableDataGridStatePayload,
} from '../types'
import type { DefineComponent } from 'vue'
import { h } from 'vue'
import TableDataGrid from './TableDataGrid.vue'

type TestRow = {
  id: string
  name: string
  status: string
}

type TestTableDataGridProps = {
  headers: Array<TableDataGridHeader<TestRow>>
  fetcher: TableDataGridFetcher<TestRow>
  error?: boolean
  onState?: (payload: TableDataGridStatePayload) => void
  pageSize?: number
  refreshKey?: string | number | boolean
}

type TestTableDataGridSlots = {
  'empty-state'?: () => unknown
  'error-state'?: () => unknown
}

type TestVueWrapper = {
  setProps: (props: Record<string, unknown>) => Promise<void>
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

const TestTableDataGrid = TableDataGrid as unknown as DefineComponent<TestTableDataGridProps>

const mountTestTableDataGrid = ({
  slots,
  ...props
}: Omit<TestTableDataGridProps, 'headers'> & { slots?: TestTableDataGridSlots }) => {
  let vueWrapper: TestVueWrapper

  cy.mount(TestTableDataGrid, {
    props: {
      headers,
      ...props,
    },
    slots,
  }).then(({ wrapper }) => {
    vueWrapper = wrapper
  })

  return {
    setProps: (nextProps: Record<string, unknown>) => cy.then(() => vueWrapper.setProps(nextProps)),
  }
}

const scrollToSecondBlock = ({
  fetcher,
  onState,
}: {
  fetcher: TableDataGridFetcher<TestRow>
  onState?: (payload: TableDataGridStatePayload) => void
}) => {
  mountTestTableDataGrid({
    fetcher,
    onState,
    pageSize: 15,
  })

  cy.contains('.ag-cell', 'Service 1').should('be.visible')
  cy.get('.ag-body-viewport').scrollTo('bottom')
  cy.wrap(fetcher).should('have.been.calledTwice')
}

describe('<TableDataGrid />', () => {
  it('fetches the first infinite block and renders AG Grid headers and data', () => {
    const fetcher = cy.stub().resolves({
      data: rows,
      total: rows.length,
    })

    cy.mount(TestTableDataGrid, {
      props: {
        fetcher,
        headers,
        pageSize: 15,
      },
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
