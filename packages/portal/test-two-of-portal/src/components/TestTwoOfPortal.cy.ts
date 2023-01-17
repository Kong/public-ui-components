// Cypress component test spec file

import TestTwoOfPortal from './TestTwoOfPortal.vue'
import { mount } from 'cypress/vue'

describe('<TestTwoOfPortal />', () => {
  it('TODO: This is an example test', () => {
    mount(TestTwoOfPortal)

    cy.get('.kong-ui-portal-test-two-of-portal').should('be.visible')
  })
})
