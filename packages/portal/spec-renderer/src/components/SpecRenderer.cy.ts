// Cypress component test spec file

import { h } from 'vue'
import { operationsList, tags, jsonSpec, specOp } from '../../fixtures/spec-data'
import SpecRenderer from './SpecRenderer.vue'

describe('<SpecRenderer />', () => {
  it('renders props when passed', () => {
    cy.mount(SpecRenderer, {
      props: {
        spec: jsonSpec as any,
        operationsList,
        tags,
      },
    })

    // renders operations list
    cy.getTestId('spec-renderer-ops-list-content').should('be.visible')
    cy.getTestId('spec-operations-list-filter').should('be.visible')

    // renders spec details
    cy.getTestId('spec-renderer-details-content').should('be.visible')
    cy.getTestId('kong-public-ui-spec-details-swagger').should('be.visible')
    cy.getTestId('default-styles').should('exist')
  })

  it('renders operationsList with correct px width via navWidth prop', () => {
    const width = 350

    cy.mount(SpecRenderer, {
      props: {
        navWidth: String(width),
        spec: jsonSpec as any,
        operationsList,
        tags,
      },
    })

    cy.getTestId('spec-renderer-ops-list-content').invoke('width').should('eq', width)
  })

  it('renders custom styles for swagger-ui for props: essentialsOnly', () => {
    cy.mount(SpecRenderer, {
      props: {
        essentialsOnly: true,
        spec: jsonSpec as any,
        operationsList,
        tags,
      },
    })

    cy.getTestId('spec-renderer-details-content').should('be.visible')
    cy.getTestId('kong-public-ui-spec-details-swagger').should('be.visible')
    cy.getTestId('default-styles').should('exist')
    cy.getTestId('hide-essentials-styles').should('exist')
  })

  it('handles "active-operation" event', () => {
    cy.mount(SpecRenderer, {
      props: {
        spec: jsonSpec as any,
        operationsList,
        tags,
      },
    })

    // renders operations list
    cy.getTestId('spec-renderer-ops-list-content').should('be.visible')
    cy.getTestId('spec-operations-list-filter').should('be.visible')

    // renders spec details
    cy.getTestId('spec-renderer-details-content').should('be.visible')
    cy.getTestId('kong-public-ui-spec-details-swagger').should('be.visible')
    cy.getTestId('default-styles').should('exist')
    cy.get('.kong-public-ui-spec-details.active-op-focused').should('not.exist')

    // click SpecOperationsList item
    cy.getTestId(`spec-operations-list-item-${specOp.method}-pet-${specOp.tags?.[1]}`).click()

    // active operation class
    cy.get('.kong-public-ui-spec-details.active-op-focused').should('exist')

    // track URL change to scroll to tag
    cy.on('url:changed', (newUrl) => {
      expect(newUrl).to.contain('#/pet/deletePet')
    })
  })

  it('allows slotting operations list empty state content', () => {
    const emptySlotContent = 'No results. Go fish!'

    cy.mount(SpecRenderer, {
      props: {
        spec: jsonSpec as any,
        operationsList,
        tags,
      },
      slots: {
        'ops-list-empty-state': h('span', {}, emptySlotContent),
      },
    })

    // ops list renders
    cy.getTestId('spec-renderer-ops-list-content').should('be.visible')
    cy.getTestId('spec-operations-list-filter').should('be.visible')
    // filter
    cy.getTestId('spec-operations-list-filter').type('xxx')

    cy.getTestId('spec-renderer-ops-list-empty-state').should('contain.html', emptySlotContent)
  })

  it('renders error state when missing required props', () => {
    // @ts-ignore - because we are purposely testing the handling of invalid prop values
    cy.mount(SpecRenderer)

    cy.getTestId('kong-ui-public-spec-renderer-error').should('be.visible')
  })

  it('allows slotting error state content', () => {
    const errorSlotContent = 'Something went wrong :('
    // @ts-ignore - because we are purposely testing the handling of invalid prop values
    cy.mount(SpecRenderer, {
      props: {},
      slots: {
        'error-state': h('span', {}, errorSlotContent),
      },
    })

    cy.getTestId('kong-ui-public-spec-renderer-error').should('contain.html', errorSlotContent)
  })
})
