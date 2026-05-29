import type { TableDataGridHeader } from '../types'
import { defineComponent, h, ref } from 'vue'
import TableDataGridColumnVisibilityMenu from './TableDataGridColumnVisibilityMenu.vue'

type TestRow = {
  id: string
  name: string
  status: number
  latency: number
  route: string
}

const headers: Array<TableDataGridHeader<TestRow>> = [
  { key: 'name', label: 'Name', hideable: false },
  { key: 'status', label: 'Status' },
  { key: 'latency', label: 'Latency' },
  { key: 'route', label: 'Route' },
]

describe('<TableDataGridColumnVisibilityMenu />', () => {
  const mountAndOpenMenu = (initialVisibility: Record<string, boolean> = {}) => {
    const columnVisibility = ref(initialVisibility)

    cy.mount(defineComponent({
      setup() {
        return () => h('div', [
          h(TableDataGridColumnVisibilityMenu, {
            headers,
            columnVisibility: columnVisibility.value,
            'onUpdate:columnVisibility': (nextVisibility: Record<string, boolean>) => {
              columnVisibility.value = nextVisibility
            },
          }),
          h('pre', {
            'data-testid': 'column-visibility-model',
          }, JSON.stringify(columnVisibility.value)),
        ])
      },
    }))

    cy.getTestId('column-visibility-trigger').click()
  }

  it('renders only hideable columns sorted by label', () => {
    mountAndOpenMenu()

    cy.getTestId('column-visibility-name').should('not.exist')
    cy.get('.column-label').then(($labels) => {
      expect($labels.toArray().map(label => label.textContent)).to.deep.equal([
        'Latency',
        'Route',
        'Status',
      ])
    })
  })

  it('filters column options with search and clears the search', () => {
    mountAndOpenMenu()

    cy.getTestId('column-visibility-search').type('status')
    cy.getTestId('column-visibility-status').should('be.visible')
    cy.getTestId('column-visibility-latency').should('not.exist')
    cy.getTestId('column-visibility-clear-search').click()
    cy.getTestId('column-visibility-latency').should('be.visible')
    cy.getTestId('column-visibility-route').should('be.visible')
  })

  it('updates column visibility when a column item is clicked', () => {
    mountAndOpenMenu()

    cy.getTestId('column-visibility-status').click()
    cy.getTestId('column-visibility-status').find('input').should('not.be.checked')
    cy.getTestId('column-visibility-model').should('contain.text', '"status":false')
  })

  it('updates column visibility when a checkbox is clicked', () => {
    mountAndOpenMenu({ latency: false })

    cy.getTestId('column-visibility-latency').find('input').check({ force: true })
    cy.getTestId('column-visibility-model').should('contain.text', '"latency":true')
  })

  it('toggles all hideable columns without adding non-hideable columns', () => {
    mountAndOpenMenu()

    cy.getTestId('column-visibility-toggle-all').click()
    cy.getTestId('column-visibility-model')
      .should('contain.text', '"latency":false')
      .and('contain.text', '"route":false')
      .and('contain.text', '"status":false')
      .and('not.contain.text', '"name"')
  })
})
