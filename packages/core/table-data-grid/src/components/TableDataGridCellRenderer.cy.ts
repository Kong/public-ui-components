import type { ICellRendererParams } from 'ag-grid-community'
import { defineComponent, h } from 'vue'
import TableDataGridCellRenderer from './TableDataGridCellRenderer.vue'

type CellRendererParams = ICellRendererParams<Record<string, unknown>>

type CellRendererExposed = {
  refresh: (params: CellRendererParams) => boolean
}

const createParams = (
  value: unknown,
  valueFormatted?: string | null,
): CellRendererParams => ({
  value,
  valueFormatted,
} as CellRendererParams)

const mountCellRenderer = ({
  value,
  valueFormatted,
  width = '160px',
}: {
  value: unknown
  valueFormatted?: string | null
  width?: string
}) => cy.mount(TableDataGridCellRenderer, {
  attrs: {
    style: {
      width,
    },
  },
  props: {
    params: createParams(value, valueFormatted),
  },
})

const expectCellContentGeometry = ({
  overflowing,
  value,
}: {
  overflowing: boolean
  value: string
}) => {
  cy.contains('.table-data-grid-cell-content', value).should(($content) => {
    if (overflowing) {
      expect($content[0].scrollWidth).to.be.greaterThan($content[0].clientWidth)
    } else {
      expect($content[0].scrollWidth).to.be.at.most($content[0].clientWidth)
    }
  })
}

describe('<TableDataGridCellRenderer />', () => {
  it('truncates overflowing content and shows the full value in a tooltip', () => {
    const longValue = 'A gateway service name that is much wider than its table column'

    mountCellRenderer({ value: longValue })

    expectCellContentGeometry({ overflowing: true, value: longValue })
    cy.contains('.table-data-grid-cell-content', longValue)
      .should('have.css', 'overflow', 'hidden')
      .and('have.css', 'text-overflow', 'ellipsis')
      .and('have.css', 'white-space', 'nowrap')

    cy.contains('.table-data-grid-cell-content', longValue).trigger('mouseenter')
    cy.contains('.popover', longValue)
      .should('be.visible')
      .and(($tooltip) => {
        expect($tooltip.parent()[0]).to.equal($tooltip[0].ownerDocument.body)
      })
  })

  it('does not show a tooltip when the full value fits', () => {
    const value = 'Gateway service'

    mountCellRenderer({ value, width: '320px' })

    expectCellContentGeometry({ overflowing: false, value })
    cy.contains('.table-data-grid-cell-content', value).trigger('mouseenter')
    cy.contains('.popover', value).should('not.exist')
  })

  it('updates truncation and tooltip content when refreshed', () => {
    const initialValue = 'Gateway service'
    const refreshedValue = 'A refreshed gateway service name that overflows its table column'

    mountCellRenderer({ value: initialValue }).then(({ wrapper }) => {
      const exposed = wrapper.vm.$.exposed as CellRendererExposed

      expect(exposed.refresh(createParams(refreshedValue))).to.equal(true)
    })

    expectCellContentGeometry({ overflowing: true, value: refreshedValue })
    cy.contains('.table-data-grid-cell-content', refreshedValue).trigger('mouseenter')
    cy.contains('.popover', refreshedValue).should('be.visible')
  })

  it('clears the tooltip when resizing makes the full value fit', () => {
    const longValue = 'A gateway service name that initially overflows its table column'

    // eslint-disable-next-line vue/one-component-per-file -- Cypress harness models the AG Grid cell boundary.
    cy.mount(defineComponent({
      name: 'TableDataGridCellRendererTestHarness',
      setup() {
        return () => h('div', {
          class: 'ag-cell',
          style: {
            width: '160px',
          },
        }, [
          h(TableDataGridCellRenderer, {
            params: createParams(longValue),
          }),
        ])
      },
    }))
    expectCellContentGeometry({ overflowing: true, value: longValue })

    cy.get('.ag-cell').then(($cell) => {
      $cell[0].style.width = '600px'
    })

    expectCellContentGeometry({ overflowing: false, value: longValue })
    cy.window().then(win => new Promise<void>((resolve) => {
      win.requestAnimationFrame(() => win.requestAnimationFrame(() => resolve()))
    }))
    cy.contains('.table-data-grid-cell-content', longValue).trigger('mouseenter')
    cy.contains('.popover', longValue).should('not.exist')
  })
})
