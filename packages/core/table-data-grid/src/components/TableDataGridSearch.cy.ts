import { defineComponent, h, ref } from 'vue'
import TableDataGridSearch from './TableDataGridSearch.vue'

describe('<TableDataGridSearch />', () => {
  const mountSearch = (initialSearch = '') => {
    const search = ref(initialSearch)

    cy.mount(defineComponent({
      setup() {
        return () => h('div', [
          h(TableDataGridSearch, {
            modelValue: search.value,
            'onUpdate:modelValue': (nextSearch: string) => {
              search.value = nextSearch
            },
          }),
          h('output', {
            'data-testid': 'search-model',
          }, search.value),
        ])
      },
    }))
  }

  it('updates its model when typing', () => {
    mountSearch()

    cy.getTestId('table-data-grid-search').type('Gateway')
    cy.getTestId('search-model').should('contain.text', 'Gateway')
  })

  it('shows the clear button only when search has a value', () => {
    mountSearch()

    cy.getTestId('table-data-grid-search-clear').should('not.exist')
    cy.getTestId('table-data-grid-search').type('Gateway')
    cy.getTestId('table-data-grid-search-clear').should('be.visible')
  })

  it('clears its model when the clear button is clicked', () => {
    mountSearch('Gateway')

    cy.getTestId('table-data-grid-search').should('have.value', 'Gateway')
    cy.getTestId('table-data-grid-search-clear').click()
    cy.getTestId('table-data-grid-search').should('have.value', '')
    cy.getTestId('search-model').should('have.text', '')
  })
})
