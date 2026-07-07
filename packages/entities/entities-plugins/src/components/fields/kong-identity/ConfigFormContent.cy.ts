import { h } from 'vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import Form from '../../free-form/shared/Form.vue'
import ConfigFormContent from './ConfigFormContent.vue'
import { BEFORE_SAVE_KEY } from '../../const'
import { FEATURE_FLAGS } from '../../../constants'
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
                {
                  error_on_miss: {
                    type: 'boolean',
                    default: true,
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
          {
            anonymous: {
              type: 'string',
            },
          },
          {
            realm: {
              type: 'string',
            },
          },
        ],
      },
    },
  ],
}

// Schema with identity_realms but no principals (old plugin with identity_realms)
const schemaWithRealmsNoPrincipals: FormSchema = {
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
            hide_credentials: {
              type: 'boolean',
              default: false,
            },
          },
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

// Schema with principals required (like key-auth with required principals)
const schemaWithRequiredPrincipals: FormSchema = {
  type: 'record',
  fields: [
    {
      config: {
        type: 'record',
        fields: [
          {
            principals: {
              required: true,
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
                {
                  error_on_miss: {
                    type: 'boolean',
                    default: true,
                  },
                },
              ],
            },
          },
          {
            anonymous: {
              type: 'string',
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

function mountContent(
  schema: FormSchema,
  options: {
    isKonnect: boolean
    hasExistingRealms?: boolean
    /** khcp-20393 Identity Principals UI flag. Defaults to on so the new-UI specs render it. */
    identityPrincipalsUiEnabled?: boolean
    /** KRN permission flag — when false, the Kong Identity principals section is hidden without a fetch. */
    isKongIdentityPrincipalsAvailable?: boolean
    /** Host-resolved directory name (see KonnectPluginFormConfig); host now owns the /v2/directories lookup. */
    principalsDirectoryName?: string | null
    /** Host-precomputed "show the Add principals empty-state guide" signal; host now owns this check. */
    principalsCreationGuideVisible?: boolean
    /** Kong Gateway versions of connected data plane nodes. */
    dataPlaneVersions?: string[]
  },
  data?: Record<string, any>,
) {
  const onChangeSpy = cy.spy().as('onChangeSpy')
  const onLearnMoreSpy = cy.spy().as('onLearnMoreSpy')
  const onCreatePrincipalSpy = cy.spy().as('onCreatePrincipalSpy')
  const formsConfig = options.isKonnect
    ? {
      app: 'konnect',
      apiBaseUrl: 'https://us.api.konghq.com',
      isKongIdentityPrincipalsAvailable: options.isKongIdentityPrincipalsAvailable,
      principalsDirectoryName: options.principalsDirectoryName,
      principalsCreationGuideVisible: options.principalsCreationGuideVisible,
      dataPlaneVersions: options.dataPlaneVersions,
    }
    : { app: 'kongManager' }

  // Mock the realms API
  const realmsResponse = options.hasExistingRealms !== false
    ? { data: [{ id: 'realm-1', name: 'My Realm' }], meta: { next: null } }
    : { data: [], meta: { next: null } }
  cy.intercept('GET', '**/v1/realms*', { body: realmsResponse }).as('fetchRealms')

  const beforeSaveCallbacks: Array<() => boolean> = []

  cy.mount(() =>
    h('div', { style: 'padding: 20px' },
      h(Form, {
        schema,
        data,
        onChange: onChangeSpy,
      }, {
        default: () => h(ConfigFormContent, {
          'onClick:learn-more': onLearnMoreSpy,
          'onClick:create-entity': onCreatePrincipalSpy,
        }),
      }),
    ), {
    global: {
      provide: {
        [FORMS_CONFIG]: formsConfig,
        [FEATURE_FLAGS.KHCP_20393_IDENTITY_PRINCIPALS_UI]: options.identityPrincipalsUiEnabled !== false,
        [BEFORE_SAVE_KEY as symbol]: (cb: () => boolean) => {
          beforeSaveCallbacks.push(cb); return () => {}
        },
      },
    },
  })

  return { triggerSave: () => beforeSaveCallbacks.every(cb => cb()) }
}

describe('ConfigFormContent', () => {
  describe('Konnect', () => {
    describe('Rendering', () => {
      it('shows Kong Identity selector when schema has principals', () => {
        mountContent(schemaWithRealms, { isKonnect: true })

        cy.getTestId('ff-kong-identity-field').should('exist')
      })

      it('renders all 3 options when schema has identity_realms and there are existing realms', () => {
        mountContent(schemaWithRealms, { isKonnect: true })

        cy.getTestId('kong-identity-mode-kong-identity').should('exist')
        cy.getTestId('kong-identity-mode-consumers').should('exist')
        cy.getTestId('kong-identity-mode-centrally-managed').should('exist')
      })

      it('shows Kong Identity selector with only 2 options when schema has no identity_realms', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true })

        cy.getTestId('ff-kong-identity-field').should('exist')
        cy.getTestId('kong-identity-mode-consumers').should('exist')
        cy.getTestId('kong-identity-mode-kong-identity').should('exist')
        cy.getTestId('kong-identity-mode-centrally-managed').should('not.exist')
      })

      it('shows centrally managed when schema has identity_realms even if no realms exist yet', () => {
        // Launch decision: the option is shown unconditionally; hiding it is a fast-follow.
        mountContent(schemaWithRealms, { isKonnect: true, hasExistingRealms: false })

        cy.getTestId('kong-identity-mode-kong-identity').should('exist')
        cy.getTestId('kong-identity-mode-consumers').should('exist')
        cy.getTestId('kong-identity-mode-centrally-managed').should('exist')
      })

      it('does not show Kong Identity selector when schema has no principals (backward compat)', () => {
        mountContent(schemaWithoutPrincipals, { isKonnect: true })

        cy.getTestId('ff-kong-identity-field').should('not.exist')
      })

      it('hides the Kong Identity principals UI when the feature flag is off, even with principals in schema', () => {
        mountContent(schemaWithRealms, { isKonnect: true, identityPrincipalsUiEnabled: false })

        // Legacy rendering: none of the new principals UI is shown
        cy.getTestId('ff-kong-identity-field').should('not.exist')
        cy.getTestId('kong-identity-principals-panel').should('not.exist')
        cy.getTestId('ff-principals-error-on-miss-label').should('not.exist')
      })

      it('preserves an existing modified principals config (does not reset to default) when the flag is off', () => {
        // Edit-load: the plugin was previously configured with Kong Identity principals while
        // the flag was on. Re-opening it with the flag off must NOT clobber that saved config.
        mountContent(schemaWithRealms, { isKonnect: true, identityPrincipalsUiEnabled: false }, {
          config: {
            principals: { enabled: true, directory: 'my-custom-dir', error_on_miss: false },
            identity_realms: null,
          },
        })

        // The principals UI is hidden...
        cy.getTestId('ff-kong-identity-field').should('not.exist')

        // ...but the saved principals is emitted unchanged — not replaced with the schema default.
        cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
          return val.config?.principals?.enabled === true
            && val.config?.principals?.directory === 'my-custom-dir'
            && val.config?.principals?.error_on_miss === false
        }))
      })

      it('defaults to "consumers" mode when no principals data', () => {
        mountContent(schemaWithRealms, { isKonnect: true })

        cy.getTestId('kong-identity-mode-consumers')
          .closest('.k-radio')
          .should('have.class', 'checked')
      })

      it('defaults to "kong-identity" mode when principals.enabled is true', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: { enabled: true, directory: 'default' }, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-kong-identity')
          .closest('.k-radio')
          .should('have.class', 'checked')
      })

      it('defaults to "centrally-managed" mode when identity_realms has items', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: {
            principals: null,
            identity_realms: [{ scope: 'realm', id: 'some-id', region: 'us' }],
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

      it('clears principals when switching back to "Consumers"', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        // First switch to kong-identity
        cy.getTestId('kong-identity-mode-kong-identity').closest('.k-radio').click()

        // Then switch back to consumers
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

      it('clears realm when switching to kong-identity (not required)', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null, realm: 'my-realm' },
        })

        cy.getTestId('kong-identity-mode-kong-identity').closest('.k-radio').click()

        cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
          return val.config?.realm === null
        }))
      })

      it('clears identity_realms when switching from centrally-managed to consumers', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        // Switch to centrally-managed first
        cy.getTestId('kong-identity-mode-centrally-managed').closest('.k-radio').click()

        // Then switch to consumers
        cy.getTestId('kong-identity-mode-consumers').closest('.k-radio').click()

        cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
          return Array.isArray(val.config?.identity_realms) && val.config.identity_realms.length === 0
        }))
      })

      it('clears identity_realms when switching from centrally-managed to kong-identity', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        // Switch to centrally-managed first
        cy.getTestId('kong-identity-mode-centrally-managed').closest('.k-radio').click()

        // Then switch to kong-identity
        cy.getTestId('kong-identity-mode-kong-identity').closest('.k-radio').click()

        cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
          return Array.isArray(val.config?.identity_realms) && val.config.identity_realms.length === 0
            && val.config?.principals?.enabled === true
        }))
      })
    })

    describe('Field visibility', () => {
      it('hides identity_realms field in consumers mode', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('ff-array-config.identity_realms').should('not.exist')
      })

      it('hides identity_realms field in kong-identity mode', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-kong-identity').closest('.k-radio').click()

        cy.getTestId('ff-array-config.identity_realms').should('not.exist')
      })

      it('shows identity_realms field inline (not in advanced) in centrally-managed mode', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-centrally-managed').closest('.k-radio').click()

        cy.getTestId('ff-identity-realms-field').should('exist')
        cy.getTestId('ff-advanced-fields-container').within(() => {
          cy.getTestId('ff-array-config.identity_realms').should('not.exist')
        })
      })

      it('hides inline identity_realms field in consumers mode', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('ff-identity-realms-field').should('not.exist')
      })

      it('hides inline identity_realms field in kong-identity mode', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-kong-identity').closest('.k-radio').click()

        cy.getTestId('ff-identity-realms-field').should('not.exist')
      })

      it('shows identity_realms normally when schema has no principals (old schema)', () => {
        mountContent(schemaWithRealmsNoPrincipals, { isKonnect: true })

        cy.getTestId('ff-kong-identity-field').should('not.exist')
        cy.getTestId('ff-advanced-fields-container').within(() => {
          cy.getTestId('ff-array-config.identity_realms').should('exist')
        })
      })

      it('hides realm field in kong-identity mode (not required)', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-kong-identity').closest('.k-radio').click()

        cy.getTestId('ff-config.realm').should('not.exist')
      })

      it('shows realm field in advanced section in consumers mode (not required)', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('ff-advanced-fields-container').within(() => {
          cy.getTestId('ff-config.realm').should('exist')
        })
      })
    })

    describe('error_on_miss', () => {
      it('shows error_on_miss group when kong-identity is selected and schema has error_on_miss', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: { enabled: true, directory: 'default', error_on_miss: true }, identity_realms: null },
        })

        cy.getTestId('ff-principals-error-on-miss-label').should('exist')
        cy.getTestId('principals-error-on-miss-true').should('exist')
        cy.getTestId('principals-error-on-miss-false').should('exist')
      })

      it('keeps error_on_miss enabled regardless of the "Add principals" guide state (host-owned now)', () => {
        mountContent(schemaWithRealms, { isKonnect: true, principalsCreationGuideVisible: true }, {
          config: { principals: { enabled: true, directory: 'default', error_on_miss: true }, identity_realms: null },
        })

        cy.getTestId('kong-identity-principals-panel').should('be.visible')
        cy.getTestId('principals-error-on-miss-true').should('be.enabled')
        cy.getTestId('principals-error-on-miss-false').should('be.enabled')
      })

      it('keeps error_on_miss enabled when the guide is not shown (principals already exist)', () => {
        mountContent(schemaWithRealms, { isKonnect: true, principalsCreationGuideVisible: false }, {
          config: { principals: { enabled: true, directory: 'default', error_on_miss: true }, identity_realms: null },
        })

        cy.getTestId('kong-identity-principals-panel').should('not.exist')
        cy.getTestId('principals-error-on-miss-true').should('be.enabled')
        cy.getTestId('principals-error-on-miss-false').should('be.enabled')
      })

      it('hides error_on_miss group when consumers mode is active', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('ff-principals-error-on-miss-label').should('not.exist')
      })

      it('hides error_on_miss group when centrally-managed mode is active', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-centrally-managed').closest('.k-radio').click()

        cy.getTestId('ff-principals-error-on-miss-label').should('not.exist')
      })

      it('does not show error_on_miss group when schema lacks principals.error_on_miss', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true }, {
          config: { principals: { enabled: true, directory: 'default' } },
        })

        cy.getTestId('kong-identity-mode-kong-identity').closest('.k-radio').click()

        cy.getTestId('ff-principals-error-on-miss-label').should('not.exist')
      })

      it('clicking reject radio sets error_on_miss to true', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: { enabled: true, directory: 'default', error_on_miss: false }, identity_realms: null },
        })

        cy.getTestId('principals-error-on-miss-true').click({ force: true })

        cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
          return val.config?.principals?.error_on_miss === true
        }))
      })

      it('clicking continue radio sets error_on_miss to false', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: { enabled: true, directory: 'default', error_on_miss: true }, identity_realms: null },
        })

        cy.getTestId('principals-error-on-miss-false').click({ force: true })

        cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
          return val.config?.principals?.error_on_miss === false
        }))
      })
    })

    describe('Required principals behavior', () => {
      it('uses schema default (not null) for principals when required and switching to consumers', () => {
        mountContent(schemaWithRequiredPrincipals, { isKonnect: true }, {
          config: { principals: { enabled: true, directory: 'default', error_on_miss: true } },
        })

        cy.getTestId('kong-identity-mode-consumers').closest('.k-radio').click()

        cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
          return val.config?.principals !== null
        }))
      })
    })

    describe('KRN permission flags', () => {
      it('hides the Kong Identity section when isKongIdentityPrincipalsAvailable is false', () => {
        mountContent(schemaWithRealms, { isKonnect: true, isKongIdentityPrincipalsAvailable: false })

        cy.getTestId('ff-kong-identity-field').should('not.exist')
        cy.getTestId('kong-identity-principals-panel').should('not.exist')
        cy.getTestId('ff-principals-error-on-miss-label').should('not.exist')
      })

      it('preserves saved principals config when isKongIdentityPrincipalsAvailable is false (edit)', () => {
        mountContent(schemaWithRealms, { isKonnect: true, isKongIdentityPrincipalsAvailable: false }, {
          config: {
            principals: { enabled: true, directory: 'my-custom-dir', error_on_miss: false },
            identity_realms: null,
          },
        })

        cy.getTestId('ff-kong-identity-field').should('not.exist')
        cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
          return val.config?.principals?.enabled === true
            && val.config?.principals?.directory === 'my-custom-dir'
            && val.config?.principals?.error_on_miss === false
        }))
      })
    })
  })

  describe('Kong Manager', () => {
    it('does not show Kong Identity selector even with principals in schema', () => {
      mountContent(schemaWithRealms, { isKonnect: false })

      cy.getTestId('ff-kong-identity-field').should('not.exist')
    })

    it('hides principals and identity_realms fields while keeping defaults in data', () => {
      mountContent(schemaWithRealms, { isKonnect: false }, {
        config: {
          principals: { enabled: false, directory: 'default' },
          identity_realms: null,
        },
      })

      cy.getTestId('ff-kong-identity-field').should('not.exist')
      cy.getTestId('ff-object-config.principals').should('not.exist')
      cy.getTestId('ff-array-config.identity_realms').should('not.exist')
      cy.get('@onChangeSpy').should('have.been.calledWithMatch', Cypress.sinon.match((val: any) => {
        return val.config?.principals?.enabled === false
          && val.config?.principals?.directory === 'default'
          && val.config?.identity_realms === null
      }))
    })

    it('does not show Kong Identity selector without principals in schema', () => {
      mountContent(schemaWithoutPrincipals, { isKonnect: false })

      cy.getTestId('ff-kong-identity-field').should('not.exist')
    })
  })

  describe('Konnect', () => {
    describe('Realm validation', () => {
      it('does not show validation error immediately when switching to centrally-managed', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-centrally-managed').closest('.k-radio').click()

        cy.getTestId('identity-realms-validation-error').should('not.exist')
      })

      it('shows validation error after clicking the realm section with no realm selected', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-centrally-managed').closest('.k-radio').click()
        cy.getTestId('identity-realms-section').click()

        cy.getTestId('identity-realms-validation-error').should('exist')
      })

      it('does not show validation error when a valid realm is already selected', () => {
        mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: [{ scope: 'konnect', id: 'realm-1' }] },
        })

        cy.getTestId('identity-realms-section').click()

        cy.getTestId('identity-realms-validation-error').should('not.exist')
      })

      it('shows validation error after a blocked submit attempt with no realm selected', () => {
        const { triggerSave } = mountContent(schemaWithRealms, { isKonnect: true }, {
          config: { principals: null, identity_realms: null },
        })

        cy.getTestId('kong-identity-mode-centrally-managed').closest('.k-radio').click()
        cy.getTestId('identity-realms-validation-error').should('not.exist')

        cy.then(() => {
          triggerSave()
        })

        cy.getTestId('identity-realms-validation-error').should('exist')
      })
    })
    describe('Kong Identity principals panel', () => {
    // Switch to Kong Identity mode, which is what reveals the principals panel
      const selectKongIdentity = () => {
        cy.getTestId('kong-identity-mode-kong-identity').closest('.k-radio').click()
      }

      it('shows the empty-state panel when the host says principalsCreationGuideVisible is true', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true, principalsCreationGuideVisible: true }, { config: { principals: { enabled: false } } })

        selectKongIdentity()

        cy.getTestId('kong-identity-principals-panel').should('be.visible')
        cy.getTestId('kong-identity-create-principal').should('exist')
      })

      it('hides the panel when the host says principalsCreationGuideVisible is false', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true, principalsCreationGuideVisible: false }, { config: { principals: { enabled: false } } })

        selectKongIdentity()

        cy.getTestId('kong-identity-principals-panel').should('not.exist')
      })

      it('shows a loading skeleton while principalsCreationGuideVisible is unresolved (undefined)', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true }, { config: { principals: { enabled: false } } })

        selectKongIdentity()

        cy.getTestId('kong-identity-principals-loading').should('be.visible')
        cy.getTestId('kong-identity-principals-panel').should('not.exist')
      })

      it('does not show the panel unless Kong Identity mode is selected', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true, principalsCreationGuideVisible: true })

        cy.getTestId('ff-kong-identity-field').should('exist')
        cy.getTestId('kong-identity-principals-panel').should('not.exist')
      })

      it('emits "click:create-entity" only after confirming the leave-page prompt', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true, principalsCreationGuideVisible: true }, { config: { principals: { enabled: false } } })

        selectKongIdentity()

        // Clicking opens the leave-page confirmation; the event must not fire yet
        cy.getTestId('kong-identity-create-principal').should('not.be.disabled').click()
        cy.getTestId('modal-action-button').should('be.visible')
        cy.get('@onCreatePrincipalSpy').should('not.have.been.called')

        // Proceeding through the prompt emits the event
        cy.getTestId('modal-action-button').click()
        cy.get('@onCreatePrincipalSpy').should('have.been.calledOnce')
      })

      it('does not emit "click:create-entity" when the leave-page prompt is cancelled', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true, principalsCreationGuideVisible: true }, { config: { principals: { enabled: false } } })

        selectKongIdentity()

        cy.getTestId('kong-identity-create-principal').click()
        cy.getTestId('modal-cancel-button').click()
        cy.get('@onCreatePrincipalSpy').should('not.have.been.called')
      })

      it('emits "click:learn-more" to open the Learning Hub when "Learn more" is clicked', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true, principalsCreationGuideVisible: true }, { config: { principals: { enabled: false } } })

        selectKongIdentity()

        cy.getTestId('kong-identity-principals-learn-more').click()
        cy.get('@onLearnMoreSpy').should('have.been.calledOnceWith', 'kong-identity')
      })
    })

    describe('Data plane version compatibility alert', () => {
      const selectKongIdentity = () => {
        cy.getTestId('kong-identity-mode-kong-identity').closest('.k-radio').click()
      }

      it('does not show the alert when no data plane versions are provided', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true, principalsCreationGuideVisible: false }, { config: { principals: { enabled: false } } })

        selectKongIdentity()

        cy.getTestId('kong-identity-dp-version-alert').should('not.exist')
      })

      it('does not show the alert when all data plane versions meet the minimum', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true, principalsCreationGuideVisible: false, dataPlaneVersions: ['3.15.0.0', '3.16.1.2'] }, { config: { principals: { enabled: false } } })

        selectKongIdentity()

        cy.getTestId('kong-identity-dp-version-alert').should('not.exist')
      })

      it('prioritizes the empty-state guide over the alert when no principals are configured yet', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true, principalsCreationGuideVisible: true, dataPlaneVersions: ['3.10.0.0'] }, { config: { principals: { enabled: false } } })

        selectKongIdentity()

        cy.getTestId('kong-identity-principals-panel').should('be.visible')
        cy.getTestId('kong-identity-dp-version-alert').should('not.exist')
      })

      it('shows the alert once principals are configured but a connected node is below 3.15', () => {
        mountContent(schemaWithoutRealms, { isKonnect: true, principalsCreationGuideVisible: false, dataPlaneVersions: ['3.10.0.0'] }, { config: { principals: { enabled: false } } })

        selectKongIdentity()

        cy.getTestId('kong-identity-principals-panel').should('not.exist')
        cy.getTestId('kong-identity-dp-version-alert').should('be.visible')
      })
    })
  })
})
