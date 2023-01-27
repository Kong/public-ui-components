// Cypress component test spec file

import SpecRenderer from './SpecRenderer.vue'
import { mount } from 'cypress/vue'

describe('<SpecRenderer />', () => {
  it('TODO: This is an example test', () => {
    mount(SpecRenderer)

    cy.get('.kong-ui-public-spec-renderer').should('be.visible')
  })
})
