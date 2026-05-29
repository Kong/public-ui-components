import type { TableDataGridHeader } from '../types'
import type { SortDirection } from 'ag-grid-community'
import TableDataGridHeaderRenderer from './TableDataGridHeaderRenderer.vue'

class TestColumn extends EventTarget {
  private sort: SortDirection | undefined

  constructor(
    private readonly columnId: string,
    initialSort?: SortDirection,
  ) {
    super()
    this.sort = initialSort
  }

  getId() {
    return this.columnId
  }

  getSort() {
    return this.sort
  }

  setSort(sort: SortDirection | undefined) {
    this.sort = sort
    this.dispatchEvent(new Event('sortChanged'))
  }
}

const createParams = ({
  column = { key: 'name', label: 'Name', sortable: true },
  displayName = 'Name',
  enableSorting = true,
  initialSort,
}: {
  column?: TableDataGridHeader
  displayName?: string
  enableSorting?: boolean
  initialSort?: SortDirection
} = {}) => {
  const testColumn = new TestColumn(column.key, initialSort)
  const progressSort = cy.stub().as('progressSort')

  return {
    column: testColumn,
    params: {
      column: testColumn,
      context: {
        columnsByKey: new Map([[column.key, column]]),
      },
      displayName,
      enableSorting,
      progressSort,
    },
    progressSort,
  }
}

describe('<TableDataGridHeaderRenderer />', () => {
  it('renders label and sort affordance', () => {
    const { params } = createParams({
      column: {
        key: 'name',
        label: 'Name',
        sortable: true,
      },
    })

    cy.mount(TableDataGridHeaderRenderer, {
      props: {
        params,
      },
    })

    cy.getTestId('table-data-grid-header-name').should('contain.text', 'Name')
    cy.getTestId('table-data-grid-sort-name').should('be.visible')
  })

  it('renders tooltip text', () => {
    const { params } = createParams({
      column: {
        key: 'name',
        label: 'Name',
        sortable: true,
        tooltip: 'Gateway service name',
      },
    })

    cy.mount(TableDataGridHeaderRenderer, {
      props: {
        params,
      },
    })

    cy.getTestId('table-data-grid-header-name').find('.header-tooltip-trigger').trigger('mouseenter')
    cy.get('[role="tooltip"]').should('contain.text', 'Gateway service name')
  })

  it('progresses sort when sortable header is clicked', () => {
    const { params } = createParams()

    cy.mount(TableDataGridHeaderRenderer, {
      props: {
        params,
      },
    })

    cy.getTestId('table-data-grid-header-name').click()
    cy.get('@progressSort').should('have.been.calledWith', false)
    cy.getTestId('table-data-grid-header-name').click({ shiftKey: true })
    cy.get('@progressSort').should('have.been.calledWith', true)
  })

  it('does not progress sort when sorting is disabled', () => {
    const { params } = createParams({
      enableSorting: false,
    })

    cy.mount(TableDataGridHeaderRenderer, {
      props: {
        params,
      },
    })

    cy.getTestId('table-data-grid-sort-name').should('not.exist')
    cy.getTestId('table-data-grid-header-name').click()
    cy.get('@progressSort').should('not.have.been.called')
  })

  it('updates sorted state when the column emits sortChanged', () => {
    const { column, params } = createParams()

    cy.mount(TableDataGridHeaderRenderer, {
      props: {
        params,
      },
    })

    cy.getTestId('table-data-grid-header-name').should('not.have.class', 'is-sorted')
    cy.then(() => {
      column.setSort('asc')
    })
    cy.getTestId('table-data-grid-header-name').should('have.class', 'is-sorted')
  })
})
