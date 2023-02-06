// Cypress component test spec file

import { mount } from 'cypress/vue'
import { h } from 'vue'
import { operationsList, tags, specOp } from '../../fixtures/spec-data'
import SpecOperationsList from './SpecOperationsList.vue'

/**
 * ALL TESTS MUST USE testMode: true
 * We generate unique IDs for reference by aria properties. Test mode strips these out
 * allowing for successful snapshot verification.
 * props: {
 *   testMode: true
 * }
 */
describe('<SpecOperationsList />', () => {
  it('renders props when passed', () => {
    mount(SpecOperationsList, {
      props: {
        testMode: true,
        isFilterable: true,
        operations: operationsList,
        tags,
      },
    })

    // renders filter input
    cy.getTestId('spec-operations-list-filter').should('be.visible')

    // renders collapsible sections of operations with correct count of operations
    cy.getTestId('spec-operations-list-section-pet').should('be.visible')
    cy.get('[data-testid="spec-operations-list-section-pet"] .spec-operations-list-item').should('have.length', 2)
    cy.getTestId('spec-operations-list-section-dog-go').should('be.visible')
    cy.get('[data-testid="spec-operations-list-section-dog-go"] .spec-operations-list-item').should('have.length', 2)
    cy.getTestId('spec-operations-list-section-other').should('be.visible')
    cy.get('[data-testid="spec-operations-list-section-other"] .spec-operations-list-item').should('have.length', 1)

    // reacts correctly to collapse toggle
    cy.getTestId('spec-operations-list-section-pet-collapse-trigger').click()
    cy.get('[data-testid="spec-operations-list-section-pet"] .spec-operations-list-item').should('not.be.visible')
    cy.getTestId('spec-operations-list-section-pet-collapse-trigger').click()
    cy.get('[data-testid="spec-operations-list-section-pet"] .spec-operations-list-item').should('have.length', 2)

    // renders untagged items
    cy.getTestId('spec-operations-list-untagged-items').should('be.visible')
  })

  it('renders with correct px width', () => {
    const width = 350

    mount(SpecOperationsList, {
      props: {
        testMode: true,
        width: width + '',
        operations: operationsList,
        tags,
      },
    })

    cy.getTestId('kong-ui-public-spec-operations-list').invoke('width').should('eq', width)
  })

  it('allows disabling selection', () => {
    mount(SpecOperationsList, {
      props: {
        testMode: true,
        disableSelection: true,
        operations: operationsList,
        tags,
      },
    })

    cy.get('.spec-operations-list-item').should('have.length', 6)
    // all items are disabled
    cy.get('.spec-operations-list-item.disabled').should('have.length', 6)
    // clicking an item shouldn't do anything
    cy.getTestId(`spec-operations-list-item-${specOp.method}-pet-${specOp.tags[0]}`).click()
    // no items selected
    cy.get('.item--selected').should('not.exist')
  })

  it('allows selecting an item', () => {
    mount(SpecOperationsList, {
      props: {
        testMode: true,
        operations: operationsList,
        tags,
      },
    })

    // no items selected
    cy.get('.item--selected').should('not.exist')
    // select an item
    cy.getTestId(`spec-operations-list-item-${specOp.method}-pet-${specOp.tags[0]}`).click()
    cy.get('.item--selected').should('have.length', 1)
    // only highlights one item when clicked
    cy.getTestId(`spec-operations-list-item-${specOp.method}-pet-${specOp.tags[1]}`).click()
    cy.get('.item--selected').should('have.length', 1)
  })

  it('correctly filters by tag', () => {
    mount(SpecOperationsList, {
      props: {
        testMode: true,
        operations: operationsList,
        tags,
      },
    })

    cy.getTestId('spec-operations-list-filter').type('dog-go')
    // hides other sections
    cy.getTestId('spec-operations-list-section-pets').should('not.exist')
    cy.getTestId('spec-operations-list-section-other').should('not.exist')
    // hides untagged items
    cy.getTestId('spec-operations-list-untagged-items').should('not.exist')
  })

  it('renders empty state when filter matches no items', () => {
    mount(SpecOperationsList, {
      props: {
        testMode: true,
        operations: operationsList,
        tags,
      },
    })

    cy.getTestId('spec-operations-list-filter').type('xxx')

    cy.getTestId('kong-ui-public-spec-operations-list-empty').should('be.visible')
  })

  it('allows slotting empty state content', () => {
    const emptyStateContent = 'Not found. Go Fish!'

    mount(SpecOperationsList, {
      props: {
        testMode: true,
        operations: operationsList,
        tags,
      },
      slots: {
        'empty-state': h('span', {}, emptyStateContent),
      },
    })

    cy.getTestId('spec-operations-list-filter').type('xxx')

    cy.getTestId('kong-ui-public-spec-operations-list-empty').should('contain.html', emptyStateContent)
  })

  it('emits "selected" event on item click', () => {
    mount(SpecOperationsList, {
      props: {
        testMode: true,
        operations: operationsList,
        tags,
      },
    })

    cy.getTestId(`spec-operations-list-item-${specOp.method}-pet-${specOp.tags[0]}`).click().then(() => {
      // Check for emitted event
      cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'selected')
      cy.get('.item--selected').should('have.length', 1)
    })
  })

  it('renders error state when missing required props', () => {
    // @ts-ignore - because we are purposely testing the handling of invalid prop values
    mount(SpecOperationsList, {
      props: {
        testMode: true,
      },
    })

    cy.getTestId('kong-ui-public-spec-operations-list-error').should('be.visible')
  })

  it('allows slotting error state content', () => {
    const errorSlotContent = 'Something went wrong :('
    // @ts-ignore - because we are purposely testing the handling of invalid prop values
    mount(SpecOperationsList, {
      props: {
        testMode: true,
      },
      slots: {
        'error-state': h('span', {}, errorSlotContent),
      },
    })

    cy.getTestId('kong-ui-public-spec-operations-list-error').should('contain.html', errorSlotContent)
  })
})
