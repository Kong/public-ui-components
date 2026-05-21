import type { AnalyticsDatatableCellSlotProps, AnalyticsDatatableHeader } from '../types'
import type { ICellRendererParams } from 'ag-grid-community'
import { h, shallowRef } from 'vue'
import AnalyticsDatatableCellRenderer from './AnalyticsDatatableCellRenderer.vue'

type TestRow = {
  id: string
  name: string
  status: number
}

type TestCellParams = ICellRendererParams<TestRow> & {
  context: {
    cellAttrs?: (params: {
      row: TestRow
      rowValue: unknown
      column: AnalyticsDatatableHeader<TestRow>
      rowIndex: number
      colIndex: number
    }) => Record<string, unknown>
    columnsByKey: Map<string, AnalyticsDatatableHeader<TestRow>>
    displayedColumnIndexesByKey: ReturnType<typeof shallowRef<Map<string, number>>>
    slots: Record<string, (props: AnalyticsDatatableCellSlotProps<TestRow>) => any>
  }
}

const row: TestRow = {
  id: 'row-1',
  name: 'Gateway service',
  status: 200,
}

const createParams = ({
  value = row.name,
  columnKey = 'name',
  rowIndex = 2,
  isSelected = false,
  slots = {},
  cellAttrs,
}: {
  value?: unknown
  columnKey?: keyof TestRow
  rowIndex?: number
  isSelected?: boolean
  slots?: TestCellParams['context']['slots']
  cellAttrs?: TestCellParams['context']['cellAttrs']
} = {}): TestCellParams => {
  const node = {
    isSelected: cy.stub().returns(isSelected),
    rowIndex,
  }

  return {
    api: {
      refreshCells: cy.stub().as('refreshCells'),
    },
    colDef: {
      colId: columnKey,
      headerName: columnKey,
    },
    context: {
      cellAttrs,
      columnsByKey: new Map<string, AnalyticsDatatableHeader<TestRow>>([
        ['name', { key: 'name', label: 'Name' }],
        ['status', { key: 'status', label: 'Status' }],
      ]),
      displayedColumnIndexesByKey: shallowRef(new Map([
        ['name', 0],
        ['status', 1],
      ])),
      slots,
    },
    data: row,
    node,
    value,
  } as unknown as TestCellParams
}

describe('<AnalyticsDatatableCellRenderer />', () => {
  it('renders the cell value when no slot is provided', () => {
    cy.mount(AnalyticsDatatableCellRenderer, {
      props: {
        params: createParams(),
      },
    })

    cy.get('.datatable-cell-content').should('contain.text', 'Gateway service')
  })

  it('vertically centers cell content by default', () => {
    cy.mount(AnalyticsDatatableCellRenderer, {
      props: {
        params: createParams(),
      },
    })

    cy.get('.datatable-cell-content')
      .should('have.css', 'display', 'flex')
      .and('have.css', 'align-items', 'center')
  })

  it('passes the expected payload to the matching cell slot', () => {
    let slotPayload: AnalyticsDatatableCellSlotProps<TestRow> | undefined
    const params = createParams({
      isSelected: true,
      slots: {
        name: (payload) => {
          slotPayload = payload

          return h('button', {
            'data-testid': 'cell-slot',
            type: 'button',
            onClick: payload.refreshCell,
          }, `${payload.row.id}:${payload.rowValue}:${payload.rowIndex}:${payload.selected}`)
        },
      },
    })

    cy.mount(AnalyticsDatatableCellRenderer, {
      props: {
        params,
      },
    })

    cy.getTestId('cell-slot').should('contain.text', 'row-1:Gateway service:2:true')
    cy.then(() => {
      expect(slotPayload?.row).to.deep.equal(row)
      expect(slotPayload?.column).to.deep.equal({ key: 'name', label: 'Name' })
      expect(slotPayload?.rowValue).to.equal('Gateway service')
      expect(slotPayload?.rowIndex).to.equal(2)
      expect(slotPayload?.selected).to.equal(true)
      expect(slotPayload?.refreshCell).to.be.a('function')
    })
    cy.getTestId('cell-slot').click()
    cy.get('@refreshCells').should('have.been.calledWithMatch', {
      force: true,
      rowNodes: [params.node],
    })
  })

  it('passes cell attrs payload and binds returned attrs', () => {
    const cellAttrs = cy.stub().as('cellAttrs').returns({
      class: 'status-cell',
      'data-column-index': '1',
      'data-row-id': row.id,
    })

    cy.mount(AnalyticsDatatableCellRenderer, {
      props: {
        params: createParams({
          cellAttrs,
          columnKey: 'status',
          value: row.status,
        }),
      },
    })

    cy.get('@cellAttrs').should('have.been.calledWithMatch', {
      colIndex: 1,
      column: { key: 'status', label: 'Status' },
      row,
      rowIndex: 2,
      rowValue: 200,
    })
    cy.get('.datatable-cell-content')
      .should('have.class', 'status-cell')
      .and('have.attr', 'data-column-index', '1')
      .and('have.attr', 'data-row-id', 'row-1')
  })

  it('updates rendered content when AG Grid refreshes the renderer', () => {
    cy.mount(AnalyticsDatatableCellRenderer, {
      props: {
        params: createParams(),
      },
    }).then(({ wrapper }) => {
      const exposed = wrapper.vm.$.exposed as {
        refresh: (params: TestCellParams) => boolean
      }
      const refreshed = exposed.refresh(createParams({
        value: 'Renamed service',
      }))

      expect(refreshed).to.equal(true)
    })

    cy.get('.datatable-cell-content').should('contain.text', 'Renamed service')
  })
})
