// Cypress component test spec file

import AppError from './AppError.vue'

describe('<AppError />', () => {
  it('should render content passed in through default slot', () => {
    cy.mount(AppError, {
      slots: {
        default: [
          '<span data-testid="error-default-slot-content">Default</span>',
        ],
      },
    })

    cy.get('[data-testid="error-default-slot-content"]').should('be.visible')
  })
})
