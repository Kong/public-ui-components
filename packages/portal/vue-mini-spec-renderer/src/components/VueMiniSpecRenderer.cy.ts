// Cypress component test spec file

import VueMiniSpecRenderer from './VueMiniSpecRenderer.vue'
import { mount } from 'cypress/vue'

describe('<VueMiniSpecRenderer />', () => {
  it('TODO: This is an example test', () => {
    mount(VueMiniSpecRenderer)

    cy.get('.kong-ui-portal-vue-mini-spec-renderer').should('be.visible')
  })
})
