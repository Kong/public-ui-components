// Cypress component test spec file

import ErrorBoundary from './ErrorBoundary.vue'

describe('<ErrorBoundary />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(ErrorBoundary)

    cy.get('.kong-ui-public-error-boundary').should('be.visible')
  })
})
