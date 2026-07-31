import GovernanceForm from './GovernanceForm.vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import governanceSchema from '../../../../../fixtures/schemas/governance'

const mountForm = (options: {
  isEditing?: boolean
  model?: Record<string, any>
  geoApiServerUrl?: string
  app?: 'konnect' | 'kongManager'
  metering?: { featuresEndpoint?: string, canListFeatures?: boolean, canCreateFeature?: boolean }
}) => {
  const { isEditing = false, model = {}, geoApiServerUrl, app = 'konnect', metering } = options

  const formsConfig = app === 'konnect'
    ? { app: 'konnect' as const, apiBaseUrl: '/us/kong-api', controlPlaneId: '123', ...(geoApiServerUrl ? { geoApiServerUrl } : {}), ...(metering ? { metering } : {}) }
    : { app: 'kongManager' as const, apiBaseUrl: '/kong-manager', ...(metering ? { metering } : {}) }

  cy.mount(GovernanceForm as any, {
    props: {
      schema: governanceSchema,
      formSchema: {},
      formModel: {},
      model,
      isEditing,
      pluginName: 'governance',
      onFormChange: cy.spy().as('onFormChange'),
      'onClick:create-entity': cy.spy().as('onCreateEntity'),
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

describe('GovernanceForm - feature select', () => {
  const featuresEndpoint = '/us/kong-api/v3/openmeter/features'

  it('lists features from the configured metering endpoint, showing key and name', () => {
    cy.intercept('GET', featuresEndpoint, {
      statusCode: 200,
      body: {
        data: [
          { key: 'api_calls', name: 'API calls' },
          { key: 'active_users', name: 'Active users' },
        ],
      },
    }).as('features')

    mountForm({ metering: { featuresEndpoint } })

    cy.wait('@features')

    // Open the select and assert the option renders both key (title) and name (description)
    cy.get('[data-testid="ff-config.feature.key"]').click()
    cy.get('[data-testid="ff-enum-config.feature.key-items"]')
      .find('[data-testid="select-item-api_calls"]')
      .should('contain.text', 'api_calls')
      .and('contain.text', 'API calls')
  })

  it('disables the feature select and shows an alert when the user cannot list features', () => {
    // Should not query the endpoint at all when the user can't list features
    cy.intercept('GET', featuresEndpoint, cy.spy().as('featuresRequest'))

    mountForm({ metering: { featuresEndpoint, canListFeatures: false } })

    cy.getTestId('ff-feature-unavailable').should('be.visible')
    // EnumField's testid is `ff-${path}` (see EnumField.vue); when disabled it resolves to the input itself
    cy.getTestId('ff-config.feature.key').should('be.disabled')
    cy.get('@featuresRequest').should('not.have.been.called')
  })

  it('shows the create-feature action and emits click:create-entity when the user can create features', () => {
    cy.intercept('GET', featuresEndpoint, {
      statusCode: 200,
      body: { data: [{ key: 'api_calls', name: 'API calls' }] },
    }).as('features')

    // canCreateFeature omitted → action shown
    mountForm({ metering: { featuresEndpoint } })

    cy.wait('@features')

    cy.get('[data-testid="ff-config.feature.key"]').click()
    cy.getTestId('ff-feature-create-action').should('be.visible').click()
    cy.get('@onCreateEntity').should('have.been.calledOnceWith', { type: 'feature' })
  })

  it('hides the create-feature action when the user cannot create features', () => {
    cy.intercept('GET', featuresEndpoint, {
      statusCode: 200,
      body: { data: [{ key: 'api_calls', name: 'API calls' }] },
    }).as('features')

    mountForm({ metering: { featuresEndpoint, canCreateFeature: false } })

    cy.wait('@features')

    cy.get('[data-testid="ff-config.feature.key"]').click()
    cy.getTestId('ff-feature-create-action').should('not.exist')
  })
})

describe('GovernanceForm - Kong Manager', () => {
  it('shows an unavailable notice and does not render the config form', () => {
    mountForm({ app: 'kongManager' })

    cy.getTestId('ff-governance-unavailable').should('be.visible')
    cy.getTestId('form-section-configuration').should('not.exist')
    cy.getTestId('form-section-governance').should('not.exist')
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
