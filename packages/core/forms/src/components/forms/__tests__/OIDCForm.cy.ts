// Import types for custom commands
/// <reference types="../../../../../cypress/support" />

// Cypress component test spec file

import OIDCForm from '../OIDCForm.vue'
import { OIDCFormSchema, OIDCModel } from './OIDCSchema'
import { redisPartials, redisEEConfig } from '../../../../fixtures/mockData'

const baseConfigKM = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
}

const baseConfigKonnect = {
  app: 'konnect',
  apiBaseUrl: 'https://us.api.konghq.com',
}

const principalsFields = [
  {
    id: 'config-principals-enabled',
    model: 'config-principals-enabled',
    type: 'switch',
    label: 'Config.Principals.Enabled',
    default: false,
    valueType: 'boolean',
    order: 0,
  },
  {
    id: 'config-principals-directory',
    model: 'config-principals-directory',
    type: 'input',
    inputType: 'text',
    label: 'Config.Principals.Directory',
    default: 'default',
    valueType: 'string',
    order: 0,
  },
  {
    id: 'config-principals-principal_by',
    model: 'config-principals-principal_by',
    type: 'radio',
    label: 'Config.Principals.Principal By',
    default: 'username',
    values: [
      { name: 'username', value: 'username' },
      { name: 'custom_id', value: 'custom_id' },
    ],
    order: 0,
  },
  {
    id: 'config-principals-principal_claim',
    model: 'config-principals-principal_claim',
    type: 'input',
    inputType: 'text',
    label: 'Config.Principals.Principal Claim',
    default: 'sub',
    valueType: 'string',
    order: 0,
  },
  {
    id: 'config-principals-match_consumer',
    model: 'config-principals-match_consumer',
    type: 'radio',
    label: 'Config.Principals.Match Consumer',
    default: true,
    values: [
      { name: 'True', value: true },
      { name: 'False', value: false },
    ],
    order: 0,
  },
  {
    id: 'config-principals-match_consumer_groups',
    model: 'config-principals-match_consumer_groups',
    type: 'radio',
    label: 'Config.Principals.Match Consumer Groups',
    default: true,
    values: [
      { name: 'True', value: true },
      { name: 'False', value: false },
    ],
    order: 0,
  },
  {
    id: 'config-principals-error_on_miss',
    model: 'config-principals-error_on_miss',
    type: 'radio',
    label: 'Config.Principals.Error On Miss',
    default: false,
    values: [
      { name: 'True', value: true },
      { name: 'False', value: false },
    ],
    order: 0,
  },
]

const OIDCFormSchemaWithPrincipals = {
  ...OIDCFormSchema,
  fields: [...OIDCFormSchema.fields, ...principalsFields],
}

const OIDCModelWithPrincipals = {
  ...OIDCModel,
  'config-principals-enabled': false,
  'config-principals-directory': 'default',
  'config-principals-principal_by': 'username',
  'config-principals-principal_claim': 'sub',
  'config-principals-match_consumer': true,
  'config-principals-match_consumer_groups': true,
  'config-principals-error_on_miss': false,
}

const requiredProps = {
  isEditing: false,
  onModelUpdated: () => {},
  onPartialToggled: () => {},
}

describe('<OIDCForm />', () => {
  it('should render redis fields as common fields when enableRedisPartial is not passed', () => {
    cy.mount(OIDCForm, {
      props: {
        ...requiredProps,
        formSchema: OIDCFormSchema,
        formModel: OIDCModel,
      },
      global: {
        provide: {
          'kong-ui-forms-config': baseConfigKM,
        },
      },
    })
    cy.get('.vue-form-generator').should('exist')
    cy.get('#advanced-tab').click()
    cy.getTestId('redis-config-card').should('not.exist')

  })

  it('should group redis fields into redis configuration card when enableRedisPartial is true', () => {
    cy.intercept(
      {
        method: 'GET',
        url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials?size=1000`,
      },
      {
        statusCode: 200,
        body: {
          data: redisPartials,
          next: null,
        },
      },
    ).as('getPartials')
    cy.intercept(
      {
        method: 'GET',
        url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials/${redisPartials[1].id}`,
      },
      {
        statusCode: 200,
        body: redisEEConfig,
      },
    ).as('getRedisEEPartial')
    cy.mount(OIDCForm, {
      props: {
        ...requiredProps,
        formSchema: OIDCFormSchema,
        formModel: OIDCModel,
        enableRedisPartial: true,
      },
      global: {
        provide: {
          'kong-ui-forms-config': baseConfigKM,
        },
      },
    })
    cy.get('.vue-form-generator').should('exist')
    cy.get('#advanced-tab').click()
    cy.getTestId('redis-config-card').should('exist')

    // assert radio group is present in the redis configuration card
    cy.getTestId('redis-config-radio-group').should('exist')


    cy.getTestId('shared-redis-config-radio').click()
    cy.getTestId('redis-config-select-trigger').click()

    const [redisCEConfigDetail, redisEEConfigDetail] = redisPartials
    // should filter out CE partials for EE plugin
    cy.getTestId(`redis-configuration-dropdown-item-${redisEEConfigDetail.name}`).should('exist')
    cy.getTestId(`redis-configuration-dropdown-item-${redisCEConfigDetail.name}`).should('not.exist')
    cy.getTestId(`redis-configuration-dropdown-item-${redisEEConfigDetail.name}`).click()
    cy.get('.partial-config-card').getTestId('name-property-value').should('contain.text', redisEEConfigDetail.name)

  })

  describe('Kong Identity principals', () => {
    beforeEach(() => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v1/auth-servers/_computed`,
        },
        {
          statusCode: 200,
          body: { data: [] },
        },
      ).as('getAuthServers')
    })

    it('should render principals section in Konnect when schema has principals fields', () => {
      cy.mount(OIDCForm, {
        props: {
          ...requiredProps,
          formSchema: OIDCFormSchemaWithPrincipals,
          formModel: OIDCModelWithPrincipals,
        },
        global: {
          provide: {
            'kong-ui-forms-config': baseConfigKonnect,
          },
        },
      })

      cy.getTestId('oidc-principals-section').should('exist')
    })

    it('should select Use sessions by default for Kong Identity when creating', () => {
      const formModel = {
        ...OIDCModelWithPrincipals,
        'config-auth_methods': [
          'password',
          'client_credentials',
          'authorization_code',
          'bearer',
          'introspection',
          'userinfo',
          'kong_oauth2',
          'refresh_token',
          'session',
        ],
      }

      cy.mount(OIDCForm, {
        props: {
          ...requiredProps,
          formSchema: OIDCFormSchemaWithPrincipals,
          formModel,
        },
        global: {
          provide: {
            'kong-ui-forms-config': baseConfigKonnect,
          },
        },
      })

      cy.getTestId('session-radio-use').closest('.k-radio').should('have.class', 'checked')
      cy.wrap(formModel).its('config-auth_methods').should('deep.equal', [
        'bearer',
        'client_credentials',
        'introspection',
        'userinfo',
        'session',
      ])
    })

    it('should preserve Use sessions from auth_methods when editing Kong Identity', () => {
      const formModel = {
        ...OIDCModelWithPrincipals,
        id: 'plugin-id',
        'config-principals-enabled': true,
        'config-auth_methods': [
          'bearer',
          'client_credentials',
          'introspection',
          'userinfo',
          'session',
        ],
      }

      cy.mount(OIDCForm, {
        props: {
          ...requiredProps,
          isEditing: true,
          formSchema: OIDCFormSchemaWithPrincipals,
          formModel,
        },
        global: {
          provide: {
            'kong-ui-forms-config': baseConfigKonnect,
          },
        },
      })

      cy.getTestId('session-radio-use').closest('.k-radio').should('have.class', 'checked')
      cy.wrap(formModel).its('config-auth_methods').should('deep.equal', [
        'bearer',
        'client_credentials',
        'introspection',
        'userinfo',
        'session',
      ])
    })

    it('should preserve disabled session management from auth_methods when editing Kong Identity', () => {
      const formModel = {
        ...OIDCModelWithPrincipals,
        id: 'plugin-id',
        'config-principals-enabled': true,
        'config-auth_methods': [
          'bearer',
          'client_credentials',
          'introspection',
          'userinfo',
        ],
      }

      cy.mount(OIDCForm, {
        props: {
          ...requiredProps,
          isEditing: true,
          formSchema: OIDCFormSchemaWithPrincipals,
          formModel,
        },
        global: {
          provide: {
            'kong-ui-forms-config': baseConfigKonnect,
          },
        },
      })

      cy.getTestId('session-radio-no-use').closest('.k-radio').should('have.class', 'checked')
      cy.wrap(formModel).its('config-auth_methods').should('deep.equal', [
        'bearer',
        'client_credentials',
        'introspection',
        'userinfo',
      ])
    })

    it('should not render principals section in Kong Manager', () => {
      cy.mount(OIDCForm, {
        props: {
          ...requiredProps,
          formSchema: OIDCFormSchemaWithPrincipals,
          formModel: OIDCModelWithPrincipals,
        },
        global: {
          provide: {
            'kong-ui-forms-config': baseConfigKM,
          },
        },
      })

      cy.getTestId('oidc-principals-section').should('not.exist')
    })

    it('should render old auth_methods checkbox UI in Kong Manager', () => {
      cy.mount(OIDCForm, {
        props: {
          ...requiredProps,
          formSchema: OIDCFormSchemaWithPrincipals,
          formModel: OIDCModelWithPrincipals,
        },
        global: {
          provide: {
            'kong-ui-forms-config': baseConfigKM,
          },
        },
      })

      cy.getTestId('auth-methods-multiselect').should('not.exist')
      cy.getTestId('session-radio-use').should('not.exist')
      cy.contains('Auth methods').should('exist')
      cy.getTestId('auth-method-checkbox-authorization_code').should('exist')
      cy.getTestId('auth-method-checkbox-bearer').should('exist')
      cy.getTestId('auth-method-checkbox-refresh_token').should('exist')
      cy.getTestId('session-management-switch').should('exist')
    })

    it('should not update principals directory when changing principal lookup method', () => {
      const formModel = {
        ...OIDCModelWithPrincipals,
        'config-principals-enabled': true,
        'config-principals-directory': 'default',
        'config-principals-principal_by': null,
        'config-principals-principal_claim': null,
      }

      cy.mount(OIDCForm, {
        props: {
          ...requiredProps,
          formSchema: OIDCFormSchemaWithPrincipals,
          formModel,
        },
        global: {
          provide: {
            'kong-ui-forms-config': baseConfigKonnect,
          },
        },
      })

      cy.getTestId('oidc-principals-section').within(() => {
        cy.getTestId('collapse-trigger-label').click()
        cy.getTestId('principals-lookup-method').click()
      })
      cy.getTestId('select-item-custom-identity').click()

      cy.getTestId('principals-custom-identity-name').should('exist')
      cy.wrap(formModel).its('config-principals-directory').should('equal', 'default')
    })

    it('should not render principals section in Konnect when schema has no principals fields', () => {
      cy.mount(OIDCForm, {
        props: {
          ...requiredProps,
          formSchema: OIDCFormSchema,
          formModel: OIDCModel,
        },
        global: {
          provide: {
            'kong-ui-forms-config': baseConfigKonnect,
          },
        },
      })

      cy.getTestId('oidc-principals-section').should('not.exist')
    })
  })
})
