// Cypress component test spec file

import { mount } from 'cypress/vue'
import { OperationListItem } from '../types'
import { jsonSpec, specOpItem } from '../../fixtures/spec-data'
import SpecDetails from './SpecDetails.vue'

describe('<SpecDetails />', () => {
  it('renders correctly with props', () => {
    mount(SpecDetails, {
      props: {
        document: jsonSpec as any,
      },
    })

    cy.getTestId('kong-public-ui-spec-details-swagger').should('be.visible')
    cy.getTestId('default-styles').should('exist')
  })

  it('renders custom styles for swagger-ui for props: hasSidebar', () => {
    mount(SpecDetails, {
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
    mount(SpecDetails, {
      props: {
        document: jsonSpec as any,
        essentialsOnly: true,
      },
    })

    cy.getTestId('kong-public-ui-spec-details-swagger').should('be.visible')
    cy.getTestId('default-styles').should('exist')
    cy.getTestId('hide-essentials-styles').should('exist')
  })

  it('renders custom styles for swagger-ui for props: relativeSidebar', () => {
    mount(SpecDetails, {
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

  it('emits "active-operation" event', () => {
    const activeOp:OperationListItem = specOpItem

    mount(SpecDetails, {
      props: {
        document: jsonSpec as any,
        activeOperation: activeOp,
      },
    })

    cy.getTestId('kong-public-ui-spec-details-swagger').should('be.visible')
    cy.getTestId('default-styles').should('exist')

    cy.getTestId('kong-public-ui-spec-details-swagger').then(() => {
      // Check for emitted event
      cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'active-operation')
    })
  })

  it('renders error state when missing required props', () => {
    // @ts-ignore - because we are purposely testing the handling of invalid prop values
    mount(SpecDetails)

    cy.getTestId('kong-public-ui-spec-details-error').should('be.visible')
  })
})
