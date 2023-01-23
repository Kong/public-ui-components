// Cypress component test spec file

import VueSpecRenderer from './VueSpecRenderer.vue'
import { mount } from 'cypress/vue'

describe('<VueSpecRenderer />', () => {
  it('TODO: This is an example test', () => {
    mount(VueSpecRenderer)

    cy.get('.kong-ui-portal-vue-spec-renderer').should('be.visible')
  })
})
