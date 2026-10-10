// Cypress component test spec file
import EntityBaseTable from './EntityBaseTable.vue'
import { mockTableHeaders, mockTableData } from '../../../fixtures/mockData'

describe('<EntityBaseTable />', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', err => !err.message.includes('ResizeObserver loop limit exceeded'))
  })

  it('should render columns correctly', () => {
    cy.mount(EntityBaseTable, {
      props: {
        tableHeaders: mockTableHeaders,
        fetcher: () => mockTableData,
      },
    })

    cy.get('.kong-ui-entity-base-table thead th').should('have.length', Object.keys(mockTableHeaders).length + 1)
    cy.get('.kong-ui-entity-base-table tbody tr').should('have.length', 2)

    cy.get('.kong-ui-entity-base-table thead th').eq(0).should('contain.text', mockTableHeaders.id.label)
    cy.get('.kong-ui-entity-base-table thead th').eq(1).should('contain.text', mockTableHeaders.name.label)
    cy.get('.kong-ui-entity-base-table thead th').eq(2).should('contain.text', mockTableHeaders.protocols.label)
    cy.get('.kong-ui-entity-base-table thead th').eq(3).should('contain.text', mockTableHeaders.hosts.label)
    cy.get('.kong-ui-entity-base-table thead th').eq(4).should('contain.text', mockTableHeaders.methods.label)
    cy.get('.kong-ui-entity-base-table thead th').eq(5).should('contain.text', mockTableHeaders.paths.label)
  })

  it('should show loading state', () => {
    cy.mount(EntityBaseTable, {
      props: {
        tableHeaders: mockTableHeaders,
        fetcher: () => mockTableData,
        isLoading: true,
      },
    })

    cy.get('.kong-ui-entity-base-table .skeleton-table-wrapper').should('exist')
  })

  it('should show empty state with default text', () => {
    cy.mount(EntityBaseTable, {
      props: {
        tableHeaders: mockTableHeaders,
        fetcher: () => ({ data: [] }),
      },
    })

    cy.get('.kong-ui-entity-base-table .empty-state-title').should('contain.text', 'No Data')
    cy.get('.kong-ui-entity-base-table .empty-state-message').should('contain.text', 'There is no data to display.')
  })

  it('should show empty state with passed-in options', () => {
    const emptyStateOptions = {
      ctaText: 'New Route',
      message: 'My message',
      title: 'My title',
    }

    cy.mount(EntityBaseTable, {
      props: {
        tableHeaders: mockTableHeaders,
        fetcher: () => ({ data: [] }),
        emptyStateOptions,
      },
    })

    cy.get('.kong-ui-entity-base-table .empty-state-title').should('contain.text', emptyStateOptions.title)
    cy.get('.kong-ui-entity-base-table .empty-state-message').should('contain.text', emptyStateOptions.message)
    cy.get('.kong-ui-entity-base-table .empty-state-action').should('contain.text', emptyStateOptions.ctaText)
  })

  it('should hide actions column', () => {
    cy.mount(EntityBaseTable, {
      props: {
        tableHeaders: mockTableHeaders,
        fetcher: () => mockTableData,
        enableEntityActions: false,
      },
    })

    cy.get('.kong-ui-entity-base-table thead th').should('have.length', Object.keys(mockTableHeaders).length)
  })

  it('should add row attributes', () => {
    cy.mount(EntityBaseTable, {
      props: {
        tableHeaders: mockTableHeaders,
        fetcher: () => mockTableData,
      },
    })

    cy.get('.kong-ui-entity-base-table tbody tr').eq(0).should('have.attr', 'data-rowid', mockTableData.data[0].id)
    cy.get('.kong-ui-entity-base-table tbody tr').eq(0).should('have.attr', 'data-testid', mockTableData.data[0].name)
    cy.get('.kong-ui-entity-base-table tbody tr').eq(1).should('have.attr', 'data-rowid', mockTableData.data[1].id)
    cy.get('.kong-ui-entity-base-table tbody tr').eq(1).should('have.attr', 'data-testid', mockTableData.data[1].name)
  })

  it('should not enter error state', () => {
    cy.mount(EntityBaseTable, {
      props: {
        errorMessage: null,
        fetcher: () => mockTableData,
      },
    })
    cy.get('.kong-ui-entity-base-table .table-error-state').should('not.exist')

    cy.mount(EntityBaseTable, {
      props: {
        errorMessage: '',
        fetcher: () => mockTableData,
      },
    })
    cy.get('.kong-ui-entity-base-table .table-error-state').should('not.exist')
  })

  it('should accept string for table error message', () => {
    const message = 'I am an error message'

    cy.mount(EntityBaseTable, {
      props: {
        errorMessage: message,
        fetcher: () => mockTableData,
      },
    })

    cy.get('.kong-ui-entity-base-table .empty-state-title').should('contain.text', message)
  })

  it('should accept object for table error message', () => {
    const errorMessage = {
      title: 'My error title',
      message: 'My error message',
    }

    cy.mount(EntityBaseTable, {
      props: {
        errorMessage,
        fetcher: () => mockTableData,
      },
    })

    cy.get('.kong-ui-entity-base-table .empty-state-title').should('contain.text', errorMessage.title)
    cy.get('.kong-ui-entity-base-table .empty-state-message').should('contain.text', errorMessage.message)
  })

  describe('default table preferences resolution', () => {
    /**
     * Seed a stored-preferences entry for a table, mimicking a user who loaded the table
     * before a column (and its visibility default) existed.
     */
    const seedStoredPreferences = (cacheId: string, preferences: { pageSize?: number, columnVisibility?: Record<string, boolean> }): void => {
      localStorage.setItem('khcp-user-table-preferences', JSON.stringify({
        [cacheId]: preferences,
      }))
    }

    it('should fall back to the defaults without losing the core pageSize when nothing is stored', () => {
      const cacheId = `entity-base-table-${crypto.randomUUID()}`
      localStorage.removeItem('khcp-user-table-preferences')
      // Enough rows that KTable keeps its pagination controls rendered
      const manyRows = {
        ...mockTableData,
        total: 45,
        data: Array.from({ length: 45 }, (_, i) => ({
          ...mockTableData.data[0],
          id: `entity-base-table-row-${i}`,
        })),
      }

      cy.mount(EntityBaseTable, {
        props: {
          tableHeaders: mockTableHeaders,
          fetcher: () => manyRows,
          cacheIdentifier: cacheId,
          defaultTablePreferences: {
            columnVisibility: {
              hosts: false,
            },
          },
        },
      })

      cy.get('.kong-ui-entity-base-table thead th').should('not.contain.text', mockTableHeaders.hosts.label)
      cy.getTestId('page-size-dropdown').contains('30 items per page')
    })

    it('should apply the default columnVisibility for keys the user has never decided on', () => {
      const cacheId = `entity-base-table-${crypto.randomUUID()}`
      seedStoredPreferences(cacheId, { pageSize: 15 })

      cy.mount(EntityBaseTable, {
        props: {
          tableHeaders: mockTableHeaders,
          fetcher: () => mockTableData,
          cacheIdentifier: cacheId,
          defaultTablePreferences: {
            columnVisibility: {
              hosts: false,
            },
          },
        },
      })

      cy.get('.kong-ui-entity-base-table thead th').should('not.contain.text', mockTableHeaders.hosts.label)
      cy.get('.kong-ui-entity-base-table thead th').should('contain.text', mockTableHeaders.name.label)
    })

    it('should let a stored columnVisibility choice win over the default', () => {
      const cacheId = `entity-base-table-${crypto.randomUUID()}`
      seedStoredPreferences(cacheId, {
        columnVisibility: {
          hosts: true,
        },
      })

      cy.mount(EntityBaseTable, {
        props: {
          tableHeaders: mockTableHeaders,
          fetcher: () => mockTableData,
          cacheIdentifier: cacheId,
          defaultTablePreferences: {
            columnVisibility: {
              hosts: false,
            },
          },
        },
      })

      cy.get('.kong-ui-entity-base-table thead th').should('contain.text', mockTableHeaders.hosts.label)
    })
  })
})
