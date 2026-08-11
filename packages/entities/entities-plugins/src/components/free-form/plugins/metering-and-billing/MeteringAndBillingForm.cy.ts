import MeteringAndBillingForm from './MeteringAndBillingForm.vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import type { FormSchema } from '../../../../types/plugins/form-schema'

const createSchema = (): FormSchema => ({
  type: 'record',
  fields: [{
    config: {
      type: 'record',
      required: true,
      fields: [
        { ingest_endpoint: { type: 'string' } },
        { api_token: { type: 'string' } },
        { meter_api_requests: { type: 'boolean', default: true } },
        { meter_ai_token_usage: { type: 'boolean', default: false } },
        { ssl_verify: { type: 'boolean', default: true } },
        { timeout: { type: 'integer', default: 10000 } },
        { keepalive: { type: 'integer', default: 60000 } },
        {
          subject: {
            type: 'record',
            fields: [
              { look_up_value_in: { type: 'string', one_of: ['header', 'query', 'uri_captures', 'shared_variables', 'route_tags'] } },
              { field: { type: 'string' } },
            ],
          },
        },
        {
          queue: {
            type: 'record',
            fields: [
              { max_coalescing_delay: { type: 'number' } },
              { initial_retry_delay: { type: 'number' } },
              { max_retry_delay: { type: 'number' } },
              { max_retry_time: { type: 'number' } },
            ],
          },
        },
        { attributes: { type: 'array', elements: { type: 'record', fields: [{ look_up_value_in: { type: 'string' } }, { event_property_name: { type: 'string' } }] } } },
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

  cy.mount(MeteringAndBillingForm, {
    props: {
      schema: createSchema(),
      formSchema: {},
      formModel: {},
      model,
      isEditing,
      pluginName: 'metering-and-billing',
      onFormChange: cy.spy().as('onFormChange'),
    },
    global: {
      provide: {
        [FORMS_CONFIG]: formsConfig,
      },
    },
  })
}

describe('MeteringAndBillingForm - schema defaults', () => {
  it('populates schema defaults alongside ingest_endpoint for new Konnect plugin', () => {
    mountForm({ geoApiServerUrl: 'https://us.api.konghq.com' })

    cy.getTestId('ff-config.ingest_endpoint').should('have.value', 'https://us.api.konghq.com/v3/openmeter/events')
    cy.getTestId('ff-config.meter_api_requests').should('be.checked')
    cy.getTestId('ff-config.ssl_verify').should('be.checked')
    cy.getTestId('ff-config.timeout').should('have.value', '10000')
    cy.getTestId('ff-config.keepalive').should('have.value', '60000')
  })

  it('populates schema defaults for new Kong Manager plugin', () => {
    mountForm({ app: 'kongManager' })

    cy.getTestId('ff-config.meter_api_requests').should('be.checked')
    cy.getTestId('ff-config.ssl_verify').should('be.checked')
    cy.getTestId('ff-config.timeout').should('have.value', '10000')
    cy.getTestId('ff-config.keepalive').should('have.value', '60000')
  })
})

describe('MeteringAndBillingForm - ingest_endpoint prefill', () => {
  it('prefills with region-based URL when geoApiServerUrl is available', () => {
    mountForm({ geoApiServerUrl: 'https://us.api.konghq.com' })

    cy.getTestId('ff-config.ingest_endpoint').should('have.value', 'https://us.api.konghq.com/v3/openmeter/events')
  })

  it('prefills with {{region}} placeholder when geoApiServerUrl is not available', () => {
    mountForm({})

    cy.getTestId('ff-config.ingest_endpoint').should('have.value', 'https://{{region}}.api.konghq.com/v3/openmeter/events')
  })

  it('does not overwrite an existing ingest_endpoint in create mode', () => {
    mountForm({
      model: { config: { ingest_endpoint: 'https://custom.example.com/events' } },
      geoApiServerUrl: 'https://us.api.konghq.com',
    })

    cy.getTestId('ff-config.ingest_endpoint').should('have.value', 'https://custom.example.com/events')
  })

  it('does not overwrite an existing ingest_endpoint in edit mode', () => {
    mountForm({
      isEditing: true,
      model: { config: { ingest_endpoint: 'https://custom.example.com/events' } },
      geoApiServerUrl: 'https://us.api.konghq.com',
    })

    cy.getTestId('ff-config.ingest_endpoint').should('have.value', 'https://custom.example.com/events')
  })

  it('does not prefill ingest_endpoint in Kong Manager', () => {
    mountForm({ app: 'kongManager' })

    cy.getTestId('ff-config.ingest_endpoint').should('have.value', '')
  })
})
