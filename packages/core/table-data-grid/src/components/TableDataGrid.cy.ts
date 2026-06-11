import type { TableDataGridFetcher, TableDataGridHeader } from '../types'
import type { DefineComponent } from 'vue'
import TableDataGrid from './TableDataGrid.vue'

type TestRow = {
  id: string
  name: string
  status: string
}

const headers: Array<TableDataGridHeader<TestRow>> = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
]

const rows: TestRow[] = [
  { id: 'row-1', name: 'Gateway service', status: 'Active' },
  { id: 'row-2', name: 'Portal app', status: 'Inactive' },
]

const TestTableDataGrid = TableDataGrid as unknown as DefineComponent<{
  headers: Array<TableDataGridHeader<TestRow>>
  fetcher: TableDataGridFetcher<TestRow>
  pageSize?: number
}>

describe('<TableDataGrid />', () => {
  it('fetches rows and renders AG Grid headers and data', () => {
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
    })
  })
})
