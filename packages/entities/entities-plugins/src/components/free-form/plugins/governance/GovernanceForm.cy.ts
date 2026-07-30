import GovernanceForm from './GovernanceForm.vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import governanceSchema from '../../../../../fixtures/schemas/governance'

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
      schema: governanceSchema,
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
  it('renders code values, editable http_status and message inputs for each response code', () => {
    mountForm({})

    cy.getTestId('ff-governance-advanced-settings').click()
    // check all 5 response code values
    cy.getTestId('ff-response-mapping-code-NO_CREDIT_AVAILABLE').should('exist')
    cy.getTestId('ff-response-mapping-code-USAGE_LIMIT_REACHED').should('exist')
    cy.getTestId('ff-response-mapping-code-FEATURE_UNAVAILABLE').should('exist')
    cy.getTestId('ff-response-mapping-code-FEATURE_NOT_FOUND').should('exist')
    cy.getTestId('ff-response-mapping-code-CUSTOMER_NOT_FOUND').should('exist')

    cy.getTestId('ff-config.response_codes.NO_CREDIT_AVAILABLE.http_status').should('exist')
    cy.getTestId('ff-config.response_codes.USAGE_LIMIT_REACHED.http_status').should('exist')
    cy.getTestId('ff-config.response_codes.FEATURE_UNAVAILABLE.http_status').should('exist')
    cy.getTestId('ff-config.response_codes.FEATURE_NOT_FOUND.http_status').should('exist')
    cy.getTestId('ff-config.response_codes.CUSTOMER_NOT_FOUND.http_status').should('exist')


    cy.getTestId('ff-config.response_codes.NO_CREDIT_AVAILABLE.message').should('exist')
    cy.getTestId('ff-config.response_codes.USAGE_LIMIT_REACHED.message').should('exist')
    cy.getTestId('ff-config.response_codes.FEATURE_UNAVAILABLE.message').should('exist')
    cy.getTestId('ff-config.response_codes.FEATURE_NOT_FOUND.message').should('exist')
    cy.getTestId('ff-config.response_codes.CUSTOMER_NOT_FOUND.message').should('exist')
  })
})

describe('GovernanceForm - customer field visibility', () => {
  it('shows config.customer.field when look_up_value_in is header', () => {
    mountForm({
      model: { config: { customer: { look_up_value_in: 'header', field: 'x-customer-id' } } },
    })

    cy.getTestId('ff-config.customer.field').should('exist').and('be.visible')
  })

  it('shows config.customer.field when look_up_value_in is query', () => {
    mountForm({
      model: { config: { customer: { look_up_value_in: 'query', field: 'customer_id' } } },
    })

    cy.getTestId('ff-config.customer.field').should('exist').and('be.visible')
  })

  it('hides config.customer.field when look_up_value_in is consumer', () => {
    mountForm({
      model: { config: { customer: { look_up_value_in: 'consumer' } } },
    })

    cy.getTestId('ff-config.customer.field').should('not.be.visible')
  })

  it('hides config.customer.field when look_up_value_in is application', () => {
    mountForm({
      model: { config: { customer: { look_up_value_in: 'application' } } },
    })

    cy.getTestId('ff-config.customer.field').should('not.be.visible')
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
