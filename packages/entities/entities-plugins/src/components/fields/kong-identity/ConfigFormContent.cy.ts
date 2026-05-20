import { h } from 'vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import Form from '../../free-form/shared/Form.vue'
import ConfigFormContent from './ConfigFormContent.vue'
import type { FormSchema } from '../../../types/plugins/form-schema'

// Schema with both principals and identity_realms (like key-auth)
const schemaWithRealms: FormSchema = {
  type: 'record',
  fields: [
    {
      config: {
        type: 'record',
        fields: [
          {
            principals: {
              type: 'record',
              fields: [
                {
                  enabled: {
                    type: 'boolean',
                    default: false,
                  },
                },
                {
                  directory: {
                    type: 'string',
                    required: true,
                    default: 'default',
                  },
                },
              ],
            },
          },
          {
            identity_realms: {
              type: 'array',
              elements: {
                type: 'record',
                fields: [
                  { scope: { type: 'string' } },
                  { id: { type: 'string' } },
                  { region: { type: 'string' } },
                ],
              },
            },
          },
        ],
      },
    },
  ],
}

// Schema with only principals (like basic-auth)
const schemaWithoutRealms: FormSchema = {
  type: 'record',
  fields: [
    {
      config: {
        type: 'record',
        fields: [
          {
            principals: {
              type: 'record',
              fields: [
                {
                  enabled: {
                    type: 'boolean',
                    default: false,
                  },
                },
                {
                  directory: {
                    type: 'string',
                    required: true,
                    default: 'default',
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
}

// Schema without principals (older plugin version)
const schemaWithoutPrincipals: FormSchema = {
  type: 'record',
  fields: [
    {
      config: {
        type: 'record',
        fields: [
          {
            key_names: {
              type: 'array',
              required: true,
              elements: { type: 'string' },
              default: ['apikey'],
            },
          },
          {
            hide_credentials: {
              type: 'boolean',
              default: false,
            },
          },
        ],
      },
    },
  ],
}

function mountContent(schema: FormSchema, options: { isKonnect: boolean }, data?: Record<string, any>) {
  const onChangeSpy = cy.spy().as('onChangeSpy')
  const formsConfig = options.isKonnect
    ? { app: 'konnect', apiBaseUrl: 'https://us.api.konghq.com' }
    : { app: 'kongManager' }

  cy.mount(() =>
    h('div', { style: 'padding: 20px' },
      h(Form, {
        schema,
        data,
        onChange: onChangeSpy,
      }, {
        default: () => h(ConfigFormContent),
      }),
    ), {
    global: {
      provide: {
        [FORMS_CONFIG]: formsConfig,
      },
    },
  })

  return onChangeSpy
}

describe('ConfigFormContent', () => {
  describe('Konnect', () => {
    describe('Rendering', () => {
      it('shows Kong Identity selector when schema has principals', () => {
        mountContent(schemaWithRealms, { isKonnect: true })

        cy.getTestId('ff-kong-identity-field').should('exist')
      })

      it('renders all 3 options when schema has identity_realms', () => {
        mountContent(schemaWithRealms, { isKonnect: true })

        cy.getTestId('kong-identity-mode-kong-identity').should('exist')
        cy.getTestId('kong-identity-mode-consumers').should('exist')
        cy.getTestId('kong-identity-mode-centrally-managed').should('exist')
      })

      it('renders only 2 options when schema has no identity_realms', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true })

        cy.getTestId('kong-identity-mode-kong-identity').should('exist')
        cy.getTestId('kong-identity-mode-consumers').should('exist')
        cy.getTestId('kong-identity-mode-centrally-managed').should('not.exist')
      })

      it('does not show Kong Identity selector when schema has no principals (backward compat)', () => {
        mountContent(schemaWithoutPrincipals, { isKonnect: true })

        cy.getTestId('ff-kong-identity-field').should('not.exist')
      })

      it('defaults to "consumers" mode when no principals data', () => {
        mountContent(schemaWithRealms, { isKonnect: true })

        cy.getTestId('kong-identity-mode-consumers')
          .closest('.k-radio')
          .should('have.class', 'checked')
      })

      it('selects "kong-identity" mode when principals.enabled is true', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: { enabled: true, directory: 'default' }, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-kong-identity')
          .closest('.k-radio')
          .should('have.class', 'checked')
      })

      it('selects "centrally-managed" mode when identity_realms has items', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: {
            principals: null,
            identity_realms: [{ scope: 'realm', id: 'some-realm-id', region: 'us' }],
          },
        })

        cy.getTestId('kong-identity-mode-centrally-managed')
          .closest('.k-radio')
          .should('have.class', 'checked')
      })
    })

    describe('Mode switching', () => {
      it('sets principals when "Kong Identity" is selected', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-kong-identity').closest('.k-radio').click()

        cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
          return val.config?.principals?.enabled === true
            && val.config?.principals?.directory === 'default'
        }))
      })

      it('clears principals when "Consumers" is selected', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: { enabled: true, directory: 'default' }, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-consumers').closest('.k-radio').click()

        cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
          return val.config?.principals === null
        }))
      })

      it('sets identity_realms when "Centrally managed" is selected', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-centrally-managed').closest('.k-radio').click()

        cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
          return Array.isArray(val.config?.identity_realms)
            && val.config.identity_realms[0]?.scope === 'cp'
        }))
      })

      it('clears principals and sets identity_realms when "Centrally managed" is selected', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: { enabled: true, directory: 'default' }, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-centrally-managed').closest('.k-radio').click()

        cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
          return val.config?.principals === null
            && Array.isArray(val.config?.identity_realms)
        }))
      })
    })
  })

  describe('Kong Manager', () => {
    it('does not show Kong Identity selector even with principals in schema', () => {
      mountContent(schemaWithRealms, { isKonnect: false })

      cy.getTestId('ff-kong-identity-field').should('not.exist')
    })

    it('does not show Kong Identity selector without principals in schema', () => {
      mountContent(schemaWithoutPrincipals, { isKonnect: false })

      cy.getTestId('ff-kong-identity-field').should('not.exist')
    })
  })
})
