// Import types for custom commands
/// <reference types="../../../../../cypress/support" />

// Cypress component test spec file

import OIDCForm from '../OIDCForm.vue'
import { mount } from 'cypress/vue'

describe('<OIDCForm />', () => {
  it('TODO: This is an example test', () => {
    mount(OIDCForm, {
      props: {
        formSchema: { fields: [] },
        formModel: {},
      },
    })

    cy.get('.vue-form-generator').should('exist')
  })
})
