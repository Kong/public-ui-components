import { defineComponent, h, ref } from 'vue'
import AnalyticsDatatableSearch from './AnalyticsDatatableSearch.vue'

describe('<AnalyticsDatatableSearch />', () => {
  const mountSearch = (initialSearch = '') => {
    const search = ref(initialSearch)

    cy.mount(defineComponent({
      setup() {
        return () => h('div', [
          h(AnalyticsDatatableSearch, {
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

    cy.getTestId('analytics-datatable-search').type('Gateway')
    cy.getTestId('search-model').should('contain.text', 'Gateway')
  })

  it('shows the clear button only when search has a value', () => {
    mountSearch()

    cy.getTestId('analytics-datatable-search-clear').should('not.exist')
    cy.getTestId('analytics-datatable-search').type('Gateway')
    cy.getTestId('analytics-datatable-search-clear').should('be.visible')
  })

  it('clears its model when the clear button is clicked', () => {
    mountSearch('Gateway')

    cy.getTestId('analytics-datatable-search').should('have.value', 'Gateway')
    cy.getTestId('analytics-datatable-search-clear').click()
    cy.getTestId('analytics-datatable-search').should('have.value', '')
    cy.getTestId('search-model').should('have.text', '')
  })
})
