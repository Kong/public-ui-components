// Cypress component test spec file

import TestTwo from './TestTwo.vue'
import { mount } from 'cypress/vue'

describe('<TestTwo />', () => {
  it('TODO: This is an example test', () => {
    mount(TestTwo)

    cy.get('.kong-ui-core-test-two').should('be.visible')
  })
})
