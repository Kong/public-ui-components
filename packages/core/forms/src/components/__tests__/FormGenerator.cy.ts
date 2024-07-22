// Import types for custom commands
/// <reference types="../../../../cypress/support" />

// Cypress component test spec file

import VueFormGenerator from '../FormGenerator.vue'
import { mount } from 'cypress/vue'

describe('<VueFormGenerator />', () => {
  it('TODO: This is an example test', () => {
    mount(VueFormGenerator, {
      props: {
        schema: {},
      },
    })

    cy.get('.vue-form-generator').should('exist')
  })
})
