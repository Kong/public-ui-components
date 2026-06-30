import GovernanceForm from './GovernanceForm.vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import type { FormSchema } from '../../../../types/plugins/form-schema'

const createSchema = (): FormSchema => ({
  type: 'record',
  fields: [{
    config: {
      type: 'record',
      required: true,
      fields: [
        {
          subject: {
            type: 'record',
            required: true,
            fields: [
              {
                look_up_value_in: {
                  type: 'string',
                  one_of: ['consumer', 'application', 'header', 'query'],
                  default: 'header',
                },
              },
              { field: { type: 'string', default: 'x-customer-id' } },
            ],
          },
        },
        {
          feature: {
            type: 'record',
            required: true,
            fields: [
              { key: { type: 'string', default: 'feature-1' } },
            ],
          },
        },
        { credit_balance_required: { type: 'boolean', default: true } },
        { deny_unknown_customers: { type: 'boolean', default: true } },
        {
          response: {
            type: 'record',
            required: true,
            fields: [
              {
                NO_CREDIT_AVAILABLE: {
                  type: 'record',
                  required: true,
                  fields: [
                    { message: { type: 'string', default: 'Customer has no credit available.' } },
                    { http_status: { type: 'integer', default: 402 } },
                  ],
                },
              },
              {
                USAGE_LIMIT_REACHED: {
                  type: 'record',
                  required: true,
                  fields: [
                    { message: { type: 'string', default: 'Customer has reached usage limit for feature.' } },
                    { http_status: { type: 'integer', default: 429 } },
                  ],
                },
              },
              {
                FEATURE_UNAVAILABLE: {
                  type: 'record',
                  required: true,
                  fields: [
                    { message: { type: 'string', default: 'Feature is not available for the customer.' } },
                    { http_status: { type: 'integer', default: 403 } },
                  ],
                },
              },
              {
                FEATURE_NOT_FOUND: {
                  type: 'record',
                  required: true,
                  fields: [
                    { message: { type: 'string', default: 'Feature not found.' } },
                    { http_status: { type: 'integer', default: 403 } },
                  ],
                },
              },
              {
                CUSTOMER_NOT_FOUND: {
                  type: 'record',
                  required: true,
                  fields: [
                    { message: { type: 'string', default: 'Customer is not found by subject.' } },
                    { http_status: { type: 'integer', default: 403 } },
                  ],
                },
              },
            ],
          },
        },
        { governance_endpoint: { type: 'string', default: 'https://us.api.konghq.com/v3/openmeter/governance/query', referenceable: true } },
        { api_token: { type: 'string', referenceable: true } },
        // NOTE: ssl_verify, timeout, keepalive are design-driven; pending backend schema confirmation
        { ssl_verify: { type: 'boolean', default: true } },
        { timeout: { type: 'integer', default: 10000 } },
        { keepalive: { type: 'integer', default: 60000 } },
        { sync_rate: { type: 'integer', default: 2 } },
        { refresh_interval: { type: 'integer', default: 30 } },
        { max_stale_seconds: { type: 'integer', default: 60 } },
        { l1_ttl: { type: 'integer', default: 5 } },
        { l2_ttl: { type: 'integer', default: 120 } },
        { fail_policy: { type: 'string', one_of: ['allow', 'block'], default: 'allow' } },
        {
          redis: {
            type: 'record',
            fields: [
              { host: { type: 'string' } },
              { port: { type: 'integer', default: 6379 } },
              { password: { type: 'string' } },
            ],
          },
        },
      ],
    },
  }],
})

const mountForm = (options: {
  isEditing?: boolean
  model?: Record<string, any>
  geoApiServerUrl?: string
  app?: 'konnect' | 'kongManager'
}) => {
  const { isEditing = false, model = {}, geoApiServerUrl, app = 'konnect' } = options

  const formsConfig = app === 'konnect'
    ? { app: 'konnect' as const, apiBaseUrl: '/us/kong-api', controlPlaneId: '123', ...(geoApiServerUrl ? { geoApiServerUrl } : {}) }
    : { app: 'kongManager' as const, apiBaseUrl: '/kong-manager' }

  cy.mount(GovernanceForm as any, {
    props: {
      schema: createSchema(),
      formSchema: {},
      formModel: {},
      model,
      isEditing,
      pluginName: 'governance',
      onFormChange: cy.spy().as('onFormChange'),
    },
    global: {
      provide: {
        [FORMS_CONFIG]: formsConfig,
      },
    },
  })
}

describe('GovernanceForm - multi-section layout', () => {
  it('renders the configuration section as step 2', () => {
    mountForm({})

    cy.getTestId('form-section-configuration').should('exist')
  })

  it('renders the governance section as step 3', () => {
    mountForm({})

    cy.getTestId('form-section-governance').should('exist')
  })

  it('renders General Info as step 4 (2 + 2 configSections)', () => {
    mountForm({})

    // General Info block is always rendered; step 4 means the step text is "4"
    cy.getTestId('form-section-general-info').should('exist')
    cy.getTestId('form-section-general-info').contains('4')
  })
})

describe('GovernanceForm - response mapping', () => {
  it('renders all 5 response code values as readonly inputs', () => {
    mountForm({})

    // Expand the Advanced Fields in governance section first
    cy.getTestId('view-advanced').first().click()

    cy.getTestId('ff-response-mapping-code-NO_CREDIT_AVAILABLE').should('exist')
    cy.getTestId('ff-response-mapping-code-USAGE_LIMIT_REACHED').should('exist')
    cy.getTestId('ff-response-mapping-code-FEATURE_UNAVAILABLE').should('exist')
    cy.getTestId('ff-response-mapping-code-FEATURE_NOT_FOUND').should('exist')
    cy.getTestId('ff-response-mapping-code-CUSTOMER_NOT_FOUND').should('exist')
  })

  it('renders editable http_status inputs for each response code', () => {
    mountForm({})

    cy.getTestId('view-advanced').first().click()

    cy.getTestId('ff-response-mapping-status-NO_CREDIT_AVAILABLE').should('exist')
    cy.getTestId('ff-response-mapping-status-USAGE_LIMIT_REACHED').should('exist')
    cy.getTestId('ff-response-mapping-status-FEATURE_UNAVAILABLE').should('exist')
    cy.getTestId('ff-response-mapping-status-FEATURE_NOT_FOUND').should('exist')
    cy.getTestId('ff-response-mapping-status-CUSTOMER_NOT_FOUND').should('exist')
  })

  it('renders editable message inputs for each response code', () => {
    mountForm({})

    cy.getTestId('view-advanced').first().click()

    cy.getTestId('ff-response-mapping-message-NO_CREDIT_AVAILABLE').should('exist')
    cy.getTestId('ff-response-mapping-message-USAGE_LIMIT_REACHED').should('exist')
    cy.getTestId('ff-response-mapping-message-FEATURE_UNAVAILABLE').should('exist')
    cy.getTestId('ff-response-mapping-message-FEATURE_NOT_FOUND').should('exist')
    cy.getTestId('ff-response-mapping-message-CUSTOMER_NOT_FOUND').should('exist')
  })
})

describe('GovernanceForm - subject field visibility', () => {
  it('shows config.subject.field when look_up_value_in is header', () => {
    mountForm({
      model: { config: { subject: { look_up_value_in: 'header', field: 'x-customer-id' } } },
    })

    cy.getTestId('ff-config.subject.field').should('exist').and('be.visible')
  })

  it('shows config.subject.field when look_up_value_in is query', () => {
    mountForm({
      model: { config: { subject: { look_up_value_in: 'query', field: 'customer_id' } } },
    })

    cy.getTestId('ff-config.subject.field').should('exist').and('be.visible')
  })

  it('hides config.subject.field when look_up_value_in is consumer', () => {
    mountForm({
      model: { config: { subject: { look_up_value_in: 'consumer' } } },
    })

    cy.getTestId('ff-config.subject.field').should('not.be.visible')
  })

  it('hides config.subject.field when look_up_value_in is application', () => {
    mountForm({
      model: { config: { subject: { look_up_value_in: 'application' } } },
    })

    cy.getTestId('ff-config.subject.field').should('not.be.visible')
  })
})

describe('GovernanceForm - governance_endpoint prefill', () => {
  it('prefills governance_endpoint with regional URL for new Konnect plugin', () => {
    mountForm({ geoApiServerUrl: 'https://us.api.konghq.com' })

    cy.getTestId('ff-config.governance_endpoint').should('have.value', 'https://us.api.konghq.com/v3/openmeter/governance/query')
  })

  it('uses fallback us endpoint when geoApiServerUrl is not available', () => {
    mountForm({})

    cy.getTestId('ff-config.governance_endpoint').should('have.value', 'https://us.api.konghq.com/v3/openmeter/governance/query')
  })
})
