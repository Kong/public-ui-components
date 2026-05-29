import type { FilterGroupFilters, FilterGroupSelection } from '@kong/kongponents'
import { defineComponent, h, ref } from 'vue'
import TableDataGridFilters from './TableDataGridFilters.vue'

const filters: FilterGroupFilters = {
  name: {
    label: 'Name',
    pinned: true,
  },
}

const createNameFilterSelection = (value: string): FilterGroupSelection => ({
  name: {
    operator: 'eq',
    text: value,
    value,
  },
})

describe('<TableDataGridFilters />', () => {
  const mountFilters = ({
    forwardedFilterSlotNames = [],
    initialSelection = {},
    onApply = cy.stub().as('filterApply'),
    onClear = cy.stub().as('filterClear'),
    onOpen = cy.stub().as('filterOpen'),
    onClose = cy.stub().as('filterClose'),
  }: {
    forwardedFilterSlotNames?: string[]
    initialSelection?: FilterGroupSelection
    onApply?: (filterKey: string, selection: FilterGroupSelection) => void
    onClear?: (filterKey: string, selection: FilterGroupSelection) => void
    onOpen?: (filterKey: string) => void
    onClose?: (filterKey: string) => void
  } = {}) => {
    const filterSelection = ref<FilterGroupSelection>(initialSelection)

    cy.mount(defineComponent({
      setup() {
        return () => h('div', [
          h(TableDataGridFilters, {
            filters,
            forwardedFilterSlotNames,
            modelValue: filterSelection.value,
            'onUpdate:modelValue': (nextSelection: FilterGroupSelection) => {
              filterSelection.value = nextSelection
            },
            onApply,
            onClear,
            onOpen,
            onClose,
          }, {
            'filter-name': () => h('button', {
              'data-testid': 'custom-name-filter-control',
              type: 'button',
            }, 'Custom name filter'),
          }),
          h('pre', {
            'data-testid': 'filter-selection-model',
          }, JSON.stringify(filterSelection.value)),
        ])
      },
    }))
  }

  it('updates built-in filter selection and emits apply events', () => {
    mountFilters()

    cy.getTestId('filter-group-pill-name').findTestId('filter-pill').click()
    cy.get('@filterOpen').should('have.been.calledWith', 'name')
    cy.getTestId('filter-group-pill-name').findTestId('filter-pill-input').type('Gateway')
    cy.getTestId('filter-group-pill-name').findTestId('filter-pill-apply').click()
    cy.get('@filterApply').should('have.been.calledWithMatch', 'name', createNameFilterSelection('Gateway'))
    cy.getTestId('filter-selection-model').should('contain.text', '"value":"Gateway"')
  })

  it('updates built-in filter selection and emits clear and close events', () => {
    mountFilters({
      initialSelection: createNameFilterSelection('Gateway'),
    })

    cy.getTestId('filter-group-pill-name').findTestId('filter-pill').click()
    cy.get('body').click(0, 0)
    cy.get('@filterClose').should('have.been.calledWith', 'name')
    cy.getTestId('filter-group-pill-name').findTestId('interactive-pill-clear-icon').click()
    cy.get('@filterClear').should('have.been.calledWithMatch', 'name', {
      name: undefined,
    })
    cy.getTestId('filter-selection-model').should('contain.text', '{}')
  })

  it('forwards custom filter slots without mutating host-managed selection', () => {
    mountFilters({
      forwardedFilterSlotNames: ['filter-name'],
    })

    cy.getTestId('filter-group-pill-name').findTestId('filter-pill').click()
    cy.getTestId('custom-name-filter-control').filter(':visible').should('be.visible')
    cy.getTestId('filter-group-pill-name').findTestId('filter-pill-input').should('not.exist')
    cy.getTestId('filter-group-pill-name').findTestId('filter-pill-apply').click()
    cy.get('@filterApply').should('have.been.calledWithMatch', 'name', {})
    cy.getTestId('filter-selection-model').should('have.text', '{}')
  })
})
