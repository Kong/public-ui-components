// Cypress component test spec file

import type { OperationListItem } from '../types'
import { jsonSpec, specOpItem } from '../../fixtures/spec-data'
import SpecDetails from './SpecDetails.vue'

describe('<SpecDetails />', () => {
  it('renders correctly with props', () => {
    cy.mount(SpecDetails, {
      props: {
        document: jsonSpec as any,
      },
    })

    cy.getTestId('kong-public-ui-spec-details-swagger').should('be.visible')
    cy.getTestId('default-styles').should('exist')
  })

  it('renders custom styles for swagger-ui for props: hasSidebar', () => {
    cy.mount(SpecDetails, {
      props: {
        document: jsonSpec as any,
        hasSidebar: true,
      },
    })

    cy.getTestId('kong-public-ui-spec-details-swagger').should('be.visible')
    cy.getTestId('default-styles').should('exist')
    cy.get('.swagger-ui.has-sidebar').should('be.visible')
  })

  it('renders custom styles for swagger-ui for props: essentialsOnly', () => {
    cy.mount(SpecDetails, {
      props: {
        document: jsonSpec as any,
        essentialsOnly: true,
      },
    })

    cy.getTestId('kong-public-ui-spec-details-swagger').should('be.visible')
    cy.getTestId('default-styles').should('exist')
    cy.getTestId('hide-essentials-styles').should('exist')
  })

  // TODO: evaluate if we need to test this
  it('renders swagger UI styles', () => {
    cy.mount(SpecDetails, {
      props: {
        document: jsonSpec as any,
      },
    })

    cy.getTestId('kong-public-ui-spec-details-swagger').should('be.visible')
    cy.getTestId('default-styles').should('exist')
    cy.getTestId('swagger-ui-styles').should('exist')
  })

  it('renders custom styles for swagger-ui for props: relativeSidebar', () => {
    cy.mount(SpecDetails, {
      props: {
        document: jsonSpec as any,
        hasSidebar: true,
        essentialsOnly: true,
        relativeSidebar: true,
      },
    })

    cy.getTestId('kong-public-ui-spec-details-swagger').should('be.visible')
    cy.getTestId('default-styles').should('exist')
    cy.get('.swagger-ui.has-sidebar').should('be.visible')
    cy.getTestId('hide-essentials-styles').should('exist')
    cy.getTestId('relative-sidebar-styles').should('exist')
  })

  it('handle "active-operation" onMount', () => {
    const activeOp:OperationListItem = specOpItem

    cy.mount(SpecDetails, {
      props: {
        document: jsonSpec as any,
        activeOperation: activeOp,
      },
    })

    cy.getTestId('kong-public-ui-spec-details-swagger').should('be.visible')
    cy.getTestId('default-styles').should('exist')

    cy.get('.kong-public-ui-spec-details.active-op-focused').should('exist')
  })

  it('renders error state when missing required props', () => {
    // @ts-ignore - because we are purposely testing the handling of invalid prop values
    cy.mount(SpecDetails)

    cy.getTestId('kong-public-ui-spec-details-error').should('be.visible')
  })
})
