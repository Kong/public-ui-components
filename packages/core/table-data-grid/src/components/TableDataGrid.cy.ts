import type { TableDataGridFetcher, TableDataGridHeader } from '../types'
import type { DefineComponent } from 'vue'
import TableDataGrid from './TableDataGrid.vue'

type TestRow = {
  id: string
  name: string
  status: string
}

type TestTableDataGridProps = {
  headers: Array<TableDataGridHeader<TestRow>>
  fetcher: TableDataGridFetcher<TestRow>
  pageSize?: number
  refreshKey?: string | number | boolean
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

const mountTestTableDataGrid = (props: Omit<TestTableDataGridProps, 'headers'>) => {
  let vueWrapper: TestVueWrapper

  cy.mount(TestTableDataGrid, {
    props: {
      headers,
      ...props,
    },
  }).then(({ wrapper }) => {
    vueWrapper = wrapper
  })

  return {
    setProps: (nextProps: Record<string, unknown>) => cy.then(() => vueWrapper.setProps(nextProps)),
  }
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

    cy.mount(TestTableDataGrid, {
      props: {
        fetcher,
        headers,
        pageSize: 15,
      },
    })

    cy.contains('.ag-cell', 'Service 1').should('be.visible')
    cy.get('.ag-body-viewport').scrollTo('bottom')

    cy.wrap(fetcher).should('have.been.calledTwice')
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
})
