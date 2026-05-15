import { h } from 'vue'
import Form from '../../free-form/shared/Form.vue'
import KongIdentityField from './KongIdentityField.vue'
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

function mountField(schema: FormSchema, data?: Record<string, any>) {
  const onChangeSpy = cy.spy().as('onChangeSpy')

  cy.mount(() =>
    h('div', { style: 'padding: 20px' },
      h(Form, {
        schema,
        data,
        onChange: onChangeSpy,
      }, {
        default: () => h(KongIdentityField),
      }),
    ),
  )

  return onChangeSpy
}

describe('KongIdentityField', () => {
  describe('Rendering', () => {
    it('renders all 3 options when schema has identity_realms', () => {
      mountField(schemaWithRealms)

      cy.getTestId('ff-kong-identity-field').should('exist')
      cy.getTestId('kong-identity-mode-kong-identity').should('exist')
      cy.getTestId('kong-identity-mode-consumers').should('exist')
      cy.getTestId('kong-identity-mode-centrally-managed').should('exist')
    })

    it('renders only 2 options when schema has no identity_realms', () => {
      mountField(schemaWithoutRealms)

      cy.getTestId('kong-identity-mode-kong-identity').should('exist')
      cy.getTestId('kong-identity-mode-consumers').should('exist')
      cy.getTestId('kong-identity-mode-centrally-managed').should('not.exist')
    })

    it('defaults to "consumers" mode when no principals data', () => {
      mountField(schemaWithRealms)

      cy.getTestId('kong-identity-mode-consumers')
        .find('input[type="radio"]')
        .should('be.checked')
    })

    it('selects "kong-identity" mode when principals.enabled is true', () => {
      mountField(schemaWithRealms, {
        config: { principals: { enabled: true, directory: 'default' }, identity_realms: null },
      })

      cy.getTestId('kong-identity-mode-kong-identity')
        .find('input[type="radio"]')
        .should('be.checked')
    })

    it('selects "centrally-managed" mode when identity_realms has realm scoped items', () => {
      mountField(schemaWithRealms, {
        config: {
          principals: null,
          identity_realms: [{ scope: 'realm', id: 'some-realm-id', region: 'us' }],
        },
      })

      cy.getTestId('kong-identity-mode-centrally-managed')
        .find('input[type="radio"]')
        .should('be.checked')
    })
  })

  describe('Mode switching', () => {
    it('sets principals when "Kong Identity" is selected', () => {
      mountField(schemaWithRealms)

      cy.getTestId('kong-identity-mode-kong-identity')
        .find('input[type="radio"]')
        .check({ force: true })

      cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
        return val.config?.principals?.enabled === true
          && val.config?.principals?.directory === 'default'
      }))
    })

    it('clears principals when "Consumers" is selected', () => {
      mountField(schemaWithRealms, {
        config: { principals: { enabled: true, directory: 'default' }, identity_realms: null },
      })

      cy.getTestId('kong-identity-mode-consumers')
        .find('input[type="radio"]')
        .check({ force: true })

      cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
        return val.config?.principals === null
      }))
    })

    it('sets identity_realms when "Centrally managed" is selected', () => {
      mountField(schemaWithRealms)

      cy.getTestId('kong-identity-mode-centrally-managed')
        .find('input[type="radio"]')
        .check({ force: true })

      cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
        return Array.isArray(val.config?.identity_realms)
          && val.config.identity_realms[0]?.scope === 'cp'
      }))
    })

    it('clears principals and sets identity_realms when "Centrally managed" is selected', () => {
      mountField(schemaWithRealms, {
        config: { principals: { enabled: true, directory: 'default' }, identity_realms: null },
      })

      cy.getTestId('kong-identity-mode-centrally-managed')
        .find('input[type="radio"]')
        .check({ force: true })

      cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
        return val.config?.principals === null
          && Array.isArray(val.config?.identity_realms)
      }))
    })
  })
})
