// Cypress component test spec file

import Test from './Test.vue'
import { mount } from 'cypress/vue'

describe('<Test />', () => {
  it('TODO: This is an example test', () => {
    mount(Test)

    cy.get('.kong-ui-portal-test').should('be.visible')
  })
})
