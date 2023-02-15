// Cypress component test spec file

import { h } from 'vue'
import { operationsList, tags, specOp } from '../../fixtures/spec-data'
import SpecOperationsList from './SpecOperationsList.vue'

describe('<SpecOperationsList />', () => {
  it('renders props when passed', () => {
    cy.mount(SpecOperationsList, {
      props: {
        isFilterable: true,
        operations: operationsList,
        tags,
      },
    })

    // renders filter input
    cy.getTestId('spec-operations-list-filter').should('be.visible')

    // renders collapsible sections of operations with correct count of operations
    cy.getTestId('spec-operations-list-section-pet').should('be.visible')
    cy.get('[data-testid="spec-operations-list-section-pet"] .spec-operations-list-item').should('have.length', 3)
    cy.getTestId('spec-operations-list-section-dog-go').should('be.visible')
    cy.get('[data-testid="spec-operations-list-section-dog-go"] .spec-operations-list-item').should('have.length', 2)
    cy.getTestId('spec-operations-list-section-other').should('be.visible')
    cy.get('[data-testid="spec-operations-list-section-other"] .spec-operations-list-item').should('have.length', 1)

    // reacts correctly to collapse toggle
    cy.getTestId('spec-operations-list-section-pet-collapse-trigger').click()
    cy.get('[data-testid="spec-operations-list-section-pet"] .spec-operations-list-item').should('not.be.visible')
    cy.getTestId('spec-operations-list-section-pet-collapse-trigger').click()
    cy.get('[data-testid="spec-operations-list-section-pet"] .spec-operations-list-item').should('have.length', 3)

    // renders untagged items
    cy.getTestId('spec-operations-list-untagged-items').should('be.visible')
    cy.getTestId('spec-operations-list-section-untagged-collapse-trigger').click()
    cy.get('[data-testid="spec-operations-list-untagged-items"] .spec-operations-list-item').should('not.be.visible')
    cy.getTestId('spec-operations-list-section-untagged-collapse-trigger').click()
    cy.get('[data-testid="spec-operations-list-untagged-items"] .spec-operations-list-item').should('have.length', 1)
  })

  it('renders with correct px width', () => {
    const width = 350

    cy.mount(SpecOperationsList, {
      props: {
        width: width + '',
        operations: operationsList,
        tags,
      },
    })

    cy.getTestId('kong-ui-public-spec-operations-list').invoke('width').should('eq', width)
  })

  it('allows disabling selection', () => {
    cy.mount(SpecOperationsList, {
      props: {
        disableSelection: true,
        operations: operationsList,
        tags,
      },
    })

    cy.get('.spec-operations-list-item').should('have.length', 7)
    // all items are disabled
    cy.get('.spec-operations-list-item.disabled').should('have.length', 7)
    // clicking an item shouldn't do anything
    cy.getTestId(`spec-operations-list-item-${specOp.method}-pet-${specOp.tags?.[0]}`).click()
    // no items selected
    cy.get('.item--selected').should('not.exist')
  })

  // this test should behave the same as the one above
  // because we cannot change props after mounting
  it('resets selection when passed deselect property', () => {
    cy.mount(SpecOperationsList, {
      props: {
        operations: operationsList,
        tags,
        deselect: false,
      },
    }).then(({ wrapper }) => {
      // select an item
      cy.getTestId(`spec-operations-list-item-${specOp.method}-pet-${specOp.tags?.[0]}`).click()
      cy.get('.item--selected').should('have.length', 1).then(() => {
        // deselect
        wrapper.setProps({ deselect: true, operations: operationsList, tags }).then(() => {
          // verify no items selected
          cy.get('.item--selected').should('not.exist')
        })

      })

    })

  })

  it('allows selecting an item', () => {
    cy.mount(SpecOperationsList, {
      props: {
        operations: operationsList,
        tags,
      },
    })

    // no items selected
    cy.get('.item--selected').should('not.exist')
    // select an item
    cy.getTestId(`spec-operations-list-item-${specOp.method}-pet-${specOp.tags?.[0]}`).click()
    cy.get('.item--selected').should('have.length', 1)
    // only highlights one item when clicked
    cy.getTestId(`spec-operations-list-item-${specOp.method}-pet-${specOp.tags?.[1]}`).click()
    cy.get('.item--selected').should('have.length', 1)
  })

  it('correctly filters by tag', () => {
    cy.mount(SpecOperationsList, {
      props: {
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
    cy.mount(SpecOperationsList, {
      props: {
        operations: operationsList,
        tags,
      },
    })

    cy.getTestId('spec-operations-list-filter').type('xxx')

    cy.getTestId('kong-ui-public-spec-operations-list-empty').should('be.visible')
  })

  it('allows slotting empty state content', () => {
    const emptyStateContent = 'Not found. Go Fish!'

    cy.mount(SpecOperationsList, {
      props: {
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
    cy.mount(SpecOperationsList, {
      props: {
        operations: operationsList,
        tags,
      },
    })

    cy.getTestId(`spec-operations-list-item-${specOp.method}-pet-${specOp.tags?.[0]}`).click().then(() => {
      // Check for emitted event
      cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'selected')
      cy.get('.item--selected').should('have.length', 1)
    })
  })

  it('renders error state when missing required props', () => {
    // @ts-ignore - because we are purposely testing the handling of invalid prop values
    cy.mount(SpecOperationsList)

    cy.getTestId('kong-ui-public-spec-operations-list-error').should('be.visible')
  })

  it('allows slotting error state content', () => {
    const errorSlotContent = 'Something went wrong :('
    // @ts-ignore - because we are purposely testing the handling of invalid prop values
    cy.mount(SpecOperationsList, {
      props: {},
      slots: {
        'error-state': h('span', {}, errorSlotContent),
      },
    })

    cy.getTestId('kong-ui-public-spec-operations-list-error').should('contain.html', errorSlotContent)
  })
})
