// Cypress component test spec file
import { mockExactMatchFilterConfig, mockFuzzyMatchFilterConfig } from '../../../fixtures/mockData'
import EntityFilter from './EntityFilter.vue'

describe('<EntityFilter />', () => {
  describe('exact match filter', () => {
    it('should render exact match filter', () => {
      cy.mount(EntityFilter, {
        props: {
          modelValue: '',
          config: mockExactMatchFilterConfig,
        },
      })

      cy.get('.kong-ui-entity-filter-input').should('be.visible')
      cy.get('.kong-ui-entity-filter-input [data-testid="search-input"]').should('have.attr', 'placeholder', mockExactMatchFilterConfig.placeholder)
    })

    it('should emit update:modelValue event', () => {
      cy.mount(EntityFilter, {
        props: {
          modelValue: '',
          config: mockExactMatchFilterConfig,
        },
      })

      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('.kong-ui-entity-filter-input [data-testid="search-input"]').type('q').then(() => {
        // Check for emitted event
        cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'update:modelValue').then((evt) => {
          // Verify emit payload
          cy.wrap(evt[0][0]).should('be.equal', 'q')
        })
      })
    })
  })

  describe('fuzzy match filter', () => {
    it('should render fuzzy match filter', () => {
      cy.mount(EntityFilter, {
        props: {
          modelValue: '',
          config: mockFuzzyMatchFilterConfig,
        },
      })

      cy.get('.kong-ui-entity-filter').should('be.visible')
    })

    it('should emit update:modelValue event when a field is applied', () => {
      cy.mount(EntityFilter, {
        props: {
          modelValue: '',
          config: mockFuzzyMatchFilterConfig,
        },
      })

      cy.get('.kong-ui-entity-filter [data-testid="filter-button"]').click()
      cy.get('.kong-ui-entity-filter-menu .kong-ui-entity-filter-menu-item').eq(0).click()
      cy.get('.kong-ui-entity-filter-menu #filter-name').type('testName')
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('.kong-ui-entity-filter-menu [data-testid="apply-filter"]').eq(0).click().then(() => {
        // Check for emitted event
        cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'update:modelValue').then((evt) => {
          // Verify emit payload
          cy.wrap(evt[0][0]).should('be.equal', 'name=testName')
        })
      })
    })

    it('should emit update:modelValue event when a field is cleared', () => {
      cy.mount(EntityFilter, {
        props: {
          modelValue: '',
          config: mockFuzzyMatchFilterConfig,
        },
      })

      cy.get('.kong-ui-entity-filter [data-testid="filter-button"]').click()
      cy.get('.kong-ui-entity-filter-menu .kong-ui-entity-filter-menu-item').eq(0).click()
      cy.get('.kong-ui-entity-filter-menu #filter-name').type('testName')
      cy.get('.kong-ui-entity-filter-menu .kong-ui-entity-filter-menu-item').eq(2).click()
      cy.get('.kong-ui-entity-filter-menu #filter-methods').type('GET')
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('.kong-ui-entity-filter-menu [data-testid="clear-filter"]').eq(0).click().then(() => {
        // Check for emitted event
        cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'update:modelValue').then((evt) => {
          // Verify emit payload
          cy.wrap(evt[0][0]).should('be.equal', 'methods=GET')
        })
      })
    })

    it('should emit update:modelValue event when all fields are cleared', () => {
      cy.mount(EntityFilter, {
        props: {
          modelValue: '',
          config: mockFuzzyMatchFilterConfig,
        },
      })

      cy.get('.kong-ui-entity-filter [data-testid="filter-button"]').click()
      cy.get('.kong-ui-entity-filter-menu .kong-ui-entity-filter-menu-item').eq(0).click()
      cy.get('.kong-ui-entity-filter-menu #filter-name').type('testName')
      cy.get('.kong-ui-entity-filter-menu .kong-ui-entity-filter-menu-item').eq(2).click()
      cy.get('.kong-ui-entity-filter-menu #filter-methods').type('GET')
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('.kong-ui-entity-filter-menu .filter-clear-button-container .k-button').click().then(() => {
        // Check for emitted event
        cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'update:modelValue').then((evt) => {
          // Verify emit payload
          cy.wrap(evt[0][0]).should('be.equal', '')
        })
      })
    })

    it('should render a multiselect for a field with schema.multiple and emit its value when applied', () => {
      // The multiselect popover's positioning logic can trigger a benign, well-known browser warning
      // ("ResizeObserver loop completed with undelivered notifications") that Cypress otherwise treats as a test failure.
      cy.on('uncaught:exception', (err) => !err.message.includes('ResizeObserver loop'))

      cy.mount(EntityFilter, {
        props: {
          modelValue: '',
          config: mockFuzzyMatchFilterConfig,
        },
      })

      cy.get('.kong-ui-entity-filter [data-testid="filter-button"]').click()
      cy.get('.kong-ui-entity-filter-menu [data-testid="tags"]').click()
      cy.get('.kong-ui-entity-filter-menu [data-testid="tags"] .k-multiselect').should('exist').click()
      cy.get('.kong-ui-entity-filter-menu [data-testid="tags"] .k-multiselect').contains('tag1').click()
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('.kong-ui-entity-filter-menu [data-testid="tags"] [data-testid="apply-filter"]').click().then(() => {
        cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'update:modelValue').then((evt) => {
          cy.wrap(evt[0][0]).should('be.equal', 'tags=tag1')
        })
      })
    })

    it('should re-emit an unchanged comma-joined value when a multi-value tags filter is re-applied', () => {
      cy.mount(EntityFilter, {
        props: {
          modelValue: 'tags=tag1,tag2',
          config: mockFuzzyMatchFilterConfig,
        },
      })

      cy.get('.kong-ui-entity-filter [data-testid="filter-button"]').click()
      cy.get('.kong-ui-entity-filter-menu [data-testid="tags"]').click()
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('.kong-ui-entity-filter-menu [data-testid="tags"] [data-testid="apply-filter"]').click().then(() => {
        cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'update:modelValue').then((evt) => {
          // URLSearchParams percent-encodes ',' as %2C; the server decodes it back to the literal comma
          cy.wrap(evt[0][0]).should('be.equal', 'tags=tag1%2Ctag2')
        })
      })
    })

    it('should restore selected tags from an existing comma-joined modelValue', () => {
      cy.mount(EntityFilter, {
        props: {
          modelValue: 'tags=tag1,tag2',
          config: mockFuzzyMatchFilterConfig,
        },
      })

      cy.get('.kong-ui-entity-filter [data-testid="filter-button"]').click()
      cy.get('.kong-ui-entity-filter-menu [data-testid="tags"]').click()
      cy.get('.kong-ui-entity-filter-menu [data-testid="tags"] .k-multiselect').contains('tag1').should('be.visible')
      cy.get('.kong-ui-entity-filter-menu [data-testid="tags"] .k-multiselect').contains('tag2').should('be.visible')
    })

    it('should remove the tags param entirely when cleared', () => {
      cy.mount(EntityFilter, {
        props: {
          modelValue: 'tags=tag1,tag2',
          config: mockFuzzyMatchFilterConfig,
        },
      })

      cy.get('.kong-ui-entity-filter [data-testid="filter-button"]').click()
      cy.get('.kong-ui-entity-filter-menu [data-testid="tags"]').click()
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('.kong-ui-entity-filter-menu [data-testid="tags"] [data-testid="clear-filter"]').click().then(() => {
        cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'update:modelValue').then((evt) => {
          cy.wrap(evt[0][0]).should('be.equal', '')
        })
      })
    })
  })
})
