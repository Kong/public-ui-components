// Cypress component test spec file

import Portaltestone from './Portaltestone.vue'
import { mount } from 'cypress/vue'

describe('<Portaltestone />', () => {
  it('TODO: This is an example test', () => {
    mount(Portaltestone)

    cy.get('.kong-ui-portal-portaltestone').should('be.visible')
  })
})
