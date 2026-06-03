import type {
  TableDataGridGridOptions,
  TableDataGridHeader,
} from '../types'
import type { ColDef } from 'ag-grid-community'
import { defineComponent, h } from 'vue'
import TableDataGridBody from './TableDataGridBody.vue'

type TestRow = {
  id: string
  name: string
  status: string
}

type CellClickPayload = {
  row: TestRow
  columnKey: string
  value: unknown
}

const rows: TestRow[] = [
  {
    id: 'row-1',
    name: 'Gateway service',
    status: 'healthy',
  },
]

const headers: Array<TableDataGridHeader<TestRow>> = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', disableRowClick: true },
]

const columnDefs: Array<ColDef<TestRow>> = [
  {
    colId: 'name',
    field: 'name',
    headerName: 'Name',
  },
  {
    colId: 'status',
    field: 'status',
    headerName: 'Status',
  },
]

describe('<TableDataGridBody />', () => {
  const mountBody = ({
    agGridOptions = {},
    onCellClick = cy.stub().as('cellClick'),
    onRowClick = cy.stub().as('rowClick'),
  }: {
    agGridOptions?: TableDataGridGridOptions<TestRow>
    onCellClick?: (payload: CellClickPayload) => void
    onRowClick?: (row: TestRow, event: unknown) => void
  } = {}) => {
    cy.mount(defineComponent({
      setup() {
        return () => h(TableDataGridBody<TestRow>, {
          activePageSize: 25,
          agGridOptions,
          columnDefs,
          currentPage: 1,
          fetchPage: cy.stub(),
          gridContext: {},
          hasFetched: true,
          hasNextPageWhenTotalUnknown: false,
          headers,
          hidePagination: true,
          hidePaginationWhenOptional: false,
          isFetching: false,
          mode: 'pagination',
          paginationPageSizeOptions: [25],
          rowAttrs: row => ({
            'data-testid': `body-row-${row.id}`,
          }),
          rowData: rows,
          rowKey: 'id',
          totalRows: rows.length,
          onCellClick,
          onRowClick,
        })
      },
    }))
  }

  it('emits normalized row and cell click events from AG Grid interactions', () => {
    mountBody()

    cy.get('.ag-cell[col-id="status"]').first().click({ force: true })
    cy.get('@cellClick').should('have.been.calledWithMatch', {
      row: rows[0],
      columnKey: 'status',
      value: 'healthy',
    })
    cy.get('@rowClick').should('not.have.been.called')

    cy.get('.ag-cell[col-id="name"]').first().click({ force: true })
    cy.get('@rowClick').should('have.been.calledWithMatch', rows[0])
  })

  it('runs host row post-create handling while applying row attrs', () => {
    const processRowPostCreate = cy.stub().as('processRowPostCreate')

    mountBody({
      agGridOptions: {
        processRowPostCreate,
      },
    })

    cy.getTestId('body-row-row-1').should('exist')
    cy.get('.table-data-grid-grid .ag-center-cols-container .ag-row')
      .then(($rows) => {
        expect(processRowPostCreate).to.have.callCount($rows.length)
      })
  })
})
