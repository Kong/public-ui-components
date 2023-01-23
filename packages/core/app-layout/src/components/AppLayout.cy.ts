// Cypress component test spec file

import AppLayout from './AppLayout.vue'
import { mount } from 'cypress/vue'

describe('<AppLayout />', () => {
  it('TODO: This is an example test', () => {
    mount(AppLayout)

    cy.get('.kong-ui-app-layout').should('be.visible')
  })
})
