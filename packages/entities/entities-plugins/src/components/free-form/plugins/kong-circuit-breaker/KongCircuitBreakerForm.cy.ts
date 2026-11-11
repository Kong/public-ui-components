import KongCircuitBreakerForm from './KongCircuitBreakerForm.vue'
import { FORMS_CONFIG } from '../../const'
import schema from '../../../../../fixtures/schemas/kong-circuit-breaker'
import type { FormSchema } from '@kong-ui-public/freeform'

interface CircuitBreakerPayload {
  config: {
    policy_circuit: { enabled: boolean, open_when: string, max_failures: number | null, failure_percentage: number | null }
    latency_circuit: { enabled: boolean, max_upstream_ttfb_ms: number }
    half_open_calls: number
    identifier: string
  }
}

const mountSchema = (formSchema: unknown, model: Record<string, unknown> = {}) => {
  cy.mount(KongCircuitBreakerForm, {
    props: {
      schema: formSchema as FormSchema,
      model,
      isEditing: false,
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

const mountForm = (model: Record<string, unknown> = {}) =>
  mountSchema({ type: 'record', ...schema }, model)

const openAdvanced = () => cy.getTestId('view-advanced').findTestId('collapse-trigger-content').click()

const enableCircuit = (circuit: 'policy_circuit' | 'latency_circuit') =>
  cy.getTestId(`ff-config.${circuit}.enabled`).find('.switch-control').click()

describe('KongCircuitBreakerForm', () => {
  // Both circuits default to `enabled: false`, so the cards start collapsed.
  it('reveals a circuit\'s fields only once that circuit is enabled', () => {
    mountForm()

    cy.getTestId('cb-circuits-hint').should('be.visible')
    cy.getTestId('ff-config.policy_circuit.max_failures').should('not.exist')
    cy.getTestId('ff-config.latency_circuit.max_upstream_ttfb_ms').should('not.exist')

    enableCircuit('policy_circuit')

    cy.getTestId('ff-config.policy_circuit.max_failures').should('have.value', '20')
    cy.getTestId('ff-config.policy_circuit.sampling_window_seconds').should('have.value', '60')
    cy.getTestId('ff-config.policy_circuit.recovery_period_ms').should('have.value', '30000')
    cy.getTestId('ff-config.policy_circuit.min_samples').should('be.empty')
    cy.getTestId('ff-config.latency_circuit.max_upstream_ttfb_ms').should('not.exist')

    enableCircuit('latency_circuit')

    cy.getTestId('ff-config.latency_circuit.max_upstream_ttfb_ms').should('have.value', '3000')
    cy.getTestId('ff-config.latency_circuit.max_failures').should('have.value', '10')

    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.policy_circuit.enabled).to.eq(true)
      expect(value.config.latency_circuit.enabled).to.eq(true)
    })
  })

  it('emits latency and recovery edits', () => {
    mountForm()

    enableCircuit('latency_circuit')
    cy.getTestId('ff-config.latency_circuit.max_upstream_ttfb_ms').clear()
    cy.getTestId('ff-config.latency_circuit.max_upstream_ttfb_ms').type('1500')

    openAdvanced()
    cy.getTestId('ff-config.half_open_calls').clear()
    cy.getTestId('ff-config.half_open_calls').type('3')

    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.latency_circuit.max_upstream_ttfb_ms).to.eq(1500)
      expect(value.config.half_open_calls).to.eq(3)
    })
  })

  it('keys circuits by route when the identifier is switched', () => {
    mountForm()

    openAdvanced()
    cy.getTestId('ff-radio-config.identifier-route').click()

    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.identifier).to.eq('route')
    })
  })

  it('switches a circuit\'s threshold condition', () => {
    mountForm()

    enableCircuit('policy_circuit')
    cy.getTestId('ff-radio-config.policy_circuit.open_when-both').click()

    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.policy_circuit.open_when).to.eq('both')
    })
  })

  // Both thresholds are `required`: the Gateway rejects a null ("required field
  // missing") but accepts an absent key, so the unused one is dropped.
  it('shows only the threshold its condition uses, and drops the other', () => {
    mountForm()

    enableCircuit('policy_circuit')
    cy.getTestId('ff-config.policy_circuit.max_failures').should('have.value', '20')
    cy.getTestId('ff-config.policy_circuit.failure_percentage').should('not.exist')

    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.policy_circuit.max_failures).to.eq(20)
      expect(value.config.policy_circuit).to.not.have.property('failure_percentage')
    })

    cy.getTestId('ff-radio-config.policy_circuit.open_when-failure_percentage').click()
    cy.getTestId('ff-config.policy_circuit.max_failures').should('not.exist')
    cy.getTestId('ff-config.policy_circuit.failure_percentage').should('have.value', '10')

    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.policy_circuit).to.not.have.property('max_failures')
      expect(value.config.policy_circuit.failure_percentage).to.eq(10)
    })

    // `both` and `either` need the pair, each back at its default.
    cy.getTestId('ff-radio-config.policy_circuit.open_when-both').click()
    cy.getTestId('ff-config.policy_circuit.max_failures').should('have.value', '20')
    cy.getTestId('ff-config.policy_circuit.failure_percentage').should('have.value', '10')
  })

  // The Gateway's schema is still changing: an unknown field list used to throw
  // while a hand-placed field resolved its label, blanking the whole form.
  it('renders a schema that declares none of the fields it places', () => {
    mountSchema({
      type: 'record',
      fields: [{
        config: {
          type: 'record',
          required: true,
          fields: [
            { trip_threshold: { type: 'integer', default: 7 } },
            { reset_timeout: { type: 'integer', default: 15 } },
          ],
        },
      }],
    })

    cy.getTestId('cb-circuits-hint').should('be.visible')
    openAdvanced()
    cy.getTestId('ff-config.trip_threshold').should('have.value', '7')
    cy.getTestId('ff-config.reset_timeout').should('have.value', '15')
  })
})
