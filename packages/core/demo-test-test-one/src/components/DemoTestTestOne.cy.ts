// Cypress component test spec file

import DemoTestTestOne from './DemoTestTestOne.vue'
import { mount } from 'cypress/vue'

describe('<DemoTestTestOne />', () => {
  it('TODO: This is an example test', () => {
    mount(DemoTestTestOne)

    cy.get('.kong-ui-core-demo-test-test-one').should('be.visible')
  })
})
