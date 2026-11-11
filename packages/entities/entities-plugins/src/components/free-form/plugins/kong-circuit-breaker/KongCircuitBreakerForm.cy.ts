import KongCircuitBreakerForm from './KongCircuitBreakerForm.vue'
import { FORMS_CONFIG } from '../../const'
import schema from '../../../../../fixtures/schemas/kong-circuit-breaker'
import type { FormSchema } from '@kong-ui-public/freeform'

interface CircuitBreakerPayload {
  config: {
    failure_circuit: { enabled: boolean }
    latency_circuit: { enabled: boolean, max_upstream_response_time: number }
    half_open_requests: number
    excluded_paths: Array<{ path: string, method: string }>
  }
}

const mountForm = (model: Record<string, unknown> = {}, isEditing = false) => {
  cy.mount(KongCircuitBreakerForm, {
    props: {
      schema: { type: 'record', ...schema } as unknown as FormSchema,
      model,
      isEditing,
      pluginName: 'kong-circuit-breaker',
      onFormChange: cy.spy().as('onFormChange'),
    },
    global: {
      provide: {
        [FORMS_CONFIG]: { app: 'konnect' as const, apiBaseUrl: '/us/kong-api', controlPlaneId: '123' },
      },
    },
  })
}

const openAdvanced = () => cy.getTestId('view-advanced').findTestId('collapse-trigger-content').click()

describe('KongCircuitBreakerForm', () => {
  it('renders both circuits with schema defaults', () => {
    mountForm()

    cy.getTestId('cb-circuits-hint').should('be.visible')
    cy.getTestId('ff-config.failure_circuit.max_failure_count').should('have.value', '20')
    cy.getTestId('ff-config.failure_circuit.sampling_window').should('have.value', '60')
    cy.getTestId('ff-config.failure_circuit.recovery_period').should('have.value', '30')
    cy.getTestId('ff-config.failure_circuit.failure_percentage').should('have.value', '20')
    cy.getTestId('ff-config.latency_circuit.max_upstream_response_time').should('have.value', '3000')
    cy.getTestId('ff-config.latency_circuit.max_failure_count').should('have.value', '10')
    cy.getTestId('ff-config.latency_circuit.recovery_period').should('have.value', '30')
  })

  it('hides a circuit\'s fields while that circuit is disabled, and keeps the other one', () => {
    mountForm()
    cy.getTestId('ff-config.failure_circuit.enabled').find('.switch-control').click()
    cy.getTestId('ff-config.failure_circuit.max_failure_count').should('not.exist')
    cy.getTestId('ff-config.latency_circuit.max_failure_count').should('be.visible')

    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.failure_circuit.enabled).to.eq(false)
      expect(value.config.latency_circuit.enabled).to.eq(true)
    })
  })

  it('emits latency and recovery edits', () => {
    mountForm()

    cy.getTestId('ff-config.latency_circuit.max_upstream_response_time').clear()
    cy.getTestId('ff-config.latency_circuit.max_upstream_response_time').type('1500')

    openAdvanced()
    cy.getTestId('ff-config.half_open_requests').clear()
    cy.getTestId('ff-config.half_open_requests').type('3')

    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.latency_circuit.max_upstream_response_time).to.eq(1500)
      expect(value.config.half_open_requests).to.eq(3)
    })
  })

  it('adds an excluded path row', () => {
    mountForm()

    openAdvanced()
    cy.getTestId('ff-add-item-btn-config.excluded_paths').click()
    cy.getTestId('ff-config.excluded_paths.0.path').type('/health')
    cy.getTestId('ff-config.excluded_paths.0.method').type('GET')

    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.excluded_paths).to.deep.eq([{ path: '/health', method: 'GET' }])
    })
  })
})
