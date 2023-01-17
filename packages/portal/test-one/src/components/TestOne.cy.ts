// Cypress component test spec file

import TestOne from './TestOne.vue'
import { mount } from 'cypress/vue'

describe('<TestOne />', () => {
  it('TODO: This is an example test', () => {
    mount(TestOne)

    cy.get('.kong-ui-portal-test-one').should('be.visible')
  })
})
