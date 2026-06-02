import type {
  TableDataGridHeader,
  TableDataGridToolbarSlotProps,
} from '../types'
import type { FilterGroupFilters, FilterGroupSelection } from '@kong/kongponents'
import type { Ref, VNode } from 'vue'
import { defineComponent, h, ref } from 'vue'
import TableDataGridToolbar from './TableDataGridToolbar.vue'

type TestRow = {
  id: string
  name: string
  status: number
  latency: number
}

const rows: TestRow[] = [
  {
    id: 'row-1',
    name: 'Gateway service',
    status: 500,
    latency: 40,
  },
]

const headers: Array<TableDataGridHeader<TestRow>> = [
  { key: 'name', label: 'Name', hideable: false },
  { key: 'status', label: 'Status' },
  { key: 'latency', label: 'Latency' },
]

const filters: FilterGroupFilters = {
  name: {
    label: 'Name',
    pinned: true,
  },
}

const createNameFilterSelection = (value: string): FilterGroupSelection => ({
  name: {
    operator: 'eq',
    value,
    text: value,
  },
})

describe('<TableDataGridToolbar />', () => {
  const mountToolbar = ({
    forwardedFilterSlotNames = [],
    selectedRows: initialSelectedRows = [],
    showBulkActions = true,
    showColumnVisibility = true,
    showToolbarFilters = false,
    showToolbarSearch = false,
    slots = {},
    onFilterApply = cy.stub().as('filterApply'),
    onFilterClear = cy.stub().as('filterClear'),
    onFilterOpen = cy.stub().as('filterOpen'),
    onFilterClose = cy.stub().as('filterClose'),
  }: {
    forwardedFilterSlotNames?: string[]
    selectedRows?: TestRow[]
    showBulkActions?: boolean
    showColumnVisibility?: boolean
    showToolbarFilters?: boolean
    showToolbarSearch?: boolean
    slots?: Record<string, (props: Record<string, any>) => VNode>
    onFilterApply?: (filterKey: string, selection: FilterGroupSelection) => void
    onFilterClear?: (filterKey: string, selection: FilterGroupSelection) => void
    onFilterOpen?: (filterKey: string) => void
    onFilterClose?: (filterKey: string) => void
  } = {}) => {
    const selectedRows = ref<TestRow[]>(initialSelectedRows)
    const search = ref('')
    const filterSelection = ref<FilterGroupSelection>({})
    const columnVisibility = ref<Record<string, boolean>>({})
    const refresh = cy.stub().as('refresh')

    const createToolbarSlotProps = (): TableDataGridToolbarSlotProps<TestRow> => ({
      selectedRows: selectedRows.value,
      filterSelection: filterSelection.value,
      filters,
      search: search.value,
      updateFilterSelection: (selection: FilterGroupSelection) => {
        filterSelection.value = { ...selection }
        refresh()
      },
      updateSearch: (nextSearch: string) => {
        search.value = nextSearch
      },
      refresh,
    })

    cy.mount(defineComponent({
      setup() {
        const renderModelOutput = (testId: string, model: Ref<unknown>) => h('pre', {
          'data-testid': testId,
        }, JSON.stringify(model.value))

        return () => h('div', [
          h('button', {
            'data-testid': 'select-row',
            type: 'button',
            onClick: () => {
              selectedRows.value = rows
            },
          }, 'Select row'),
          h(TableDataGridToolbar, {
            headers,
            filters,
            forwardedFilterSlotNames,
            toolbarSlotProps: createToolbarSlotProps(),
            showBulkActions,
            showColumnVisibility,
            showToolbarFilters,
            showToolbarSearch,
            search: search.value,
            filterSelection: filterSelection.value,
            columnVisibility: columnVisibility.value,
            'onUpdate:search': (nextSearch: string) => {
              search.value = nextSearch
            },
            'onUpdate:filterSelection': (nextSelection: FilterGroupSelection) => {
              filterSelection.value = nextSelection
            },
            'onUpdate:columnVisibility': (nextVisibility: Record<string, boolean>) => {
              columnVisibility.value = nextVisibility
            },
            'onFilter:apply': onFilterApply,
            'onFilter:clear': onFilterClear,
            'onFilter:open': onFilterOpen,
            'onFilter:close': onFilterClose,
          }, slots),
          renderModelOutput('search-model', search),
          renderModelOutput('filter-selection-model', filterSelection),
          renderModelOutput('column-visibility-model', columnVisibility),
        ])
      },
    }))
  }

  const expectColumnVisibilityRightmost = () => {
    cy.getTestId('column-visibility-trigger').should('be.visible')
    cy.get('.datatable-toolbar')
      .children()
      .last()
      .findTestId('column-visibility-trigger')
      .should('be.visible')
  }

  it('renders the default toolbar and selected row actions trigger', () => {
    mountToolbar()

    expectColumnVisibilityRightmost()
    cy.getTestId('table-data-grid-search').should('not.exist')
    cy.getTestId('table-data-grid-bulk-actions-trigger')
      .should('be.visible')
      .and('be.disabled')
      .and('contain.text', '(0) Bulk actions')
    cy.get('.datatable-toolbar-secondary')
      .findTestId('table-data-grid-bulk-actions-trigger')
      .should('be.visible')
    cy.getTestId('select-row').click()
    cy.getTestId('table-data-grid-bulk-actions-trigger')
      .should('not.be.disabled')
      .and('contain.text', '(1) Bulk actions')
  })

  it('renders search before toolbar filters when both built-ins are enabled', () => {
    mountToolbar({
      showToolbarFilters: true,
      showToolbarSearch: true,
    })

    cy.getTestId('table-data-grid-search').should('be.visible')
    cy.get('.datatable-toolbar-primary').children().then(($toolbarItems) => {
      const filtersIndex = $toolbarItems.index($toolbarItems.filter('.k-filter-group'))
      const searchIndex = $toolbarItems.index($toolbarItems.filter('.datatable-search'))

      expect(filtersIndex).to.be.greaterThan(-1)
      expect(searchIndex).to.be.lessThan(filtersIndex)
    })
  })

  it('renders custom toolbar slots alongside built-in controls', () => {
    mountToolbar({
      slots: {
        'toolbar-left': () => h('button', { 'data-testid': 'toolbar-left-action' }, 'Left action'),
        'toolbar-right': () => h('button', { 'data-testid': 'toolbar-right-action' }, 'Right action'),
      },
    })

    cy.getTestId('toolbar-left-action').should('be.visible')
    cy.getTestId('toolbar-right-action').should('be.visible')
    expectColumnVisibilityRightmost()
    cy.getTestId('table-data-grid-bulk-actions-trigger').should('be.visible')
  })

  it('renders a custom toolbar instead of built-in controls while keeping column visibility rightmost', () => {
    mountToolbar({
      slots: {
        toolbar: ({ selectedRows }) => h('div', { 'data-testid': 'custom-toolbar' }, `Selected ${selectedRows.length}`),
      },
    })

    cy.getTestId('custom-toolbar').should('contain.text', 'Selected 0')
    expectColumnVisibilityRightmost()
    cy.getTestId('table-data-grid-bulk-actions-trigger').should('not.exist')
  })

  it('hides column visibility when requested with a custom toolbar', () => {
    mountToolbar({
      showColumnVisibility: false,
      slots: {
        toolbar: () => h('div', { 'data-testid': 'custom-toolbar' }, 'Custom toolbar'),
      },
    })

    cy.getTestId('custom-toolbar').should('be.visible')
    cy.getTestId('column-visibility-trigger').should('not.exist')
  })

  it('can hide individual built-in toolbar controls', () => {
    mountToolbar({
      showBulkActions: false,
      showColumnVisibility: false,
      showToolbarFilters: true,
    })

    cy.getTestId('table-data-grid-bulk-actions-trigger').should('not.exist')
    cy.getTestId('column-visibility-trigger').should('not.exist')
    cy.getTestId('filter-group-pill-name').should('be.visible')
  })

  it('updates the column visibility model from the rightmost menu', () => {
    mountToolbar()

    cy.getTestId('column-visibility-trigger').click()
    cy.getTestId('column-visibility-status').click()
    cy.getTestId('column-visibility-model').should('contain.text', '"status":false')
  })

  it('updates built-in filter selection and emits filter events', () => {
    mountToolbar({
      showToolbarFilters: true,
    })

    cy.getTestId('filter-group-pill-name').findTestId('filter-pill').click()
    cy.get('@filterOpen').should('have.been.calledWith', 'name')
    cy.getTestId('filter-group-pill-name').findTestId('filter-pill-input').type('Gateway')
    cy.getTestId('filter-group-pill-name').findTestId('filter-pill-apply').click()
    cy.get('@filterApply').should('have.been.calledWithMatch', 'name', createNameFilterSelection('Gateway'))
    cy.getTestId('filter-selection-model').should('contain.text', '"value":"Gateway"')
    cy.getTestId('filter-group-pill-name').findTestId('interactive-pill-clear-icon').click()
    cy.get('@filterClear').should('have.been.calledWithMatch', 'name', {
      name: undefined,
    })
    cy.getTestId('filter-selection-model').should('contain.text', '{}')
  })

  it('forwards custom filter slots without mutating host-managed selection', () => {
    mountToolbar({
      forwardedFilterSlotNames: ['filter-name'],
      showToolbarFilters: true,
      slots: {
        'filter-name': () => h('button', {
          'data-testid': 'custom-name-filter-control',
          type: 'button',
        }, 'Gateway service'),
      },
    })

    cy.getTestId('filter-group-pill-name').findTestId('filter-pill').click()
    cy.getTestId('custom-name-filter-control').filter(':visible').should('be.visible')
    cy.getTestId('filter-group-pill-name').findTestId('filter-pill-input').should('not.exist')
    cy.getTestId('filter-group-pill-name').findTestId('filter-pill-apply').click()
    cy.get('@filterApply').should('have.been.calledWithMatch', 'name', {})
    cy.getTestId('filter-selection-model').should('have.text', '{}')
  })
})
