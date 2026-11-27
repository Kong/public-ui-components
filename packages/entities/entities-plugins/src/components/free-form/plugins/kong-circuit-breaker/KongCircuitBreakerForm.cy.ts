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

const mountSchema = (formSchema: unknown, model: Record<string, unknown> = {}, isEditing = false) => {
  cy.mount(KongCircuitBreakerForm, {
    props: {
      schema: formSchema as FormSchema,
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

const mountForm = (model: Record<string, unknown> = {}, isEditing = false) =>
  mountSchema({ type: 'record', ...schema }, model, isEditing)

const openAdvanced = () => cy.getTestId('view-advanced').findTestId('collapse-trigger-content').click()

const enableCircuit = (circuit: 'policy_circuit' | 'latency_circuit') =>
  cy.getTestId(`ff-config.${circuit}.enabled`).find('.switch-control').click()

describe('KongCircuitBreakerForm', () => {
  // A new plugin turns the policy circuit on: the schema defaults both circuits
  // off, which the Gateway rejects ("at least one ... must be enabled").
  it('starts a new plugin with the policy circuit on and the latency one off', () => {
    mountForm()

    cy.getTestId('cb-circuits-hint').should('be.visible')
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

  it('leaves a saved plugin\'s circuits as they were', () => {
    mountForm({
      config: {
        policy_circuit: { enabled: false },
        latency_circuit: { enabled: true, max_upstream_ttfb_ms: 1200 },
      },
    }, true)

    cy.getTestId('ff-config.latency_circuit.max_upstream_ttfb_ms').should('have.value', '1200')
    cy.getTestId('ff-config.policy_circuit.max_failures').should('not.exist')

    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.policy_circuit.enabled).to.eq(false)
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

    cy.getTestId('ff-radio-config.policy_circuit.open_when-both').click()

    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.policy_circuit.open_when).to.eq('both')
    })
  })

  // Toggling a circuit on while creating preselects "Count only"; with the
  // schema declaring no default, an unset `open_when` would show both
  // thresholds and select neither condition.
  it('defaults a circuit to the count-only threshold when it is turned on', () => {
    const circuit = (maxFailures: number) => ({
      type: 'record',
      required: true,
      fields: [
        { enabled: { type: 'boolean', default: false } },
        { open_when: { type: 'string', required: true, one_of: ['max_failures', 'failure_percentage', 'both', 'either'] } },
        { max_failures: { type: 'integer', required: true, default: maxFailures } },
        { failure_percentage: { type: 'number', required: true, default: 10 } },
      ],
    })

    mountSchema({
      type: 'record',
      fields: [{
        config: {
          type: 'record',
          required: true,
          fields: [
            { policy_circuit: circuit(20) },
            { latency_circuit: circuit(10) },
          ],
        },
      }],
    })

    cy.getTestId('ff-radio-config.policy_circuit.open_when-max_failures').should('be.checked')
    cy.getTestId('ff-config.policy_circuit.max_failures').should('have.value', '20')
    cy.getTestId('ff-config.policy_circuit.failure_percentage').should('not.exist')

    cy.getTestId('ff-radio-config.latency_circuit.open_when-max_failures').should('not.exist')

    enableCircuit('latency_circuit')

    cy.getTestId('ff-radio-config.latency_circuit.open_when-max_failures').should('be.checked')
    cy.getTestId('ff-config.latency_circuit.max_failures').should('have.value', '10')
    cy.getTestId('ff-config.latency_circuit.failure_percentage').should('not.exist')

    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.policy_circuit.open_when).to.eq('max_failures')
      expect(value.config.latency_circuit.open_when).to.eq('max_failures')
    })
  })

  // A circuit record is optional in the schema, so an empty draft carries no
  // record at all: the policy circuit still has to start on and filled, and
  // the switch is what creates the latency one, with its field defaults.
  it('fills an optional circuit record from the schema', () => {
    const circuit = (maxFailures: number) => ({
      type: 'record',
      fields: [
        { enabled: { type: 'boolean', default: false } },
        { open_when: { type: 'string', required: true, one_of: ['max_failures', 'failure_percentage', 'both', 'either'], default: 'max_failures' } },
        { max_failures: { type: 'integer', required: true, default: maxFailures } },
        { failure_percentage: { type: 'number', required: true, default: 10 } },
        { sampling_window_seconds: { type: 'integer', required: true, default: 60 } },
        { recovery_period_ms: { type: 'integer', required: true, default: 30000 } },
      ],
    })

    mountSchema({
      type: 'record',
      fields: [{
        config: {
          type: 'record',
          required: true,
          fields: [
            { policy_circuit: circuit(20) },
            { latency_circuit: circuit(10) },
          ],
        },
      }],
    })

    cy.getTestId('ff-config.policy_circuit.max_failures').should('have.value', '20')
    cy.getTestId('ff-config.policy_circuit.sampling_window_seconds').should('have.value', '60')
    cy.getTestId('ff-config.policy_circuit.recovery_period_ms').should('have.value', '30000')
    cy.getTestId('ff-config.latency_circuit.max_failures').should('not.exist')

    enableCircuit('latency_circuit')

    cy.getTestId('ff-config.latency_circuit.max_failures').should('have.value', '10')
    cy.getTestId('ff-config.latency_circuit.sampling_window_seconds').should('have.value', '60')
    cy.getTestId('ff-config.latency_circuit.recovery_period_ms').should('have.value', '30000')

    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.policy_circuit.enabled).to.eq(true)
      expect(value.config.latency_circuit.enabled).to.eq(true)
    })
  })

  // A plugin saved while the record was optional comes back without it, and
  // the fill has to run while editing too.
  it('fills a circuit saved without a record when it is turned on while editing', () => {
    mountForm({
      config: { policy_circuit: null, latency_circuit: null, half_open_calls: 5 },
    }, true)

    enableCircuit('policy_circuit')

    cy.getTestId('ff-config.policy_circuit.max_failures').should('have.value', '20')
    cy.getTestId('ff-config.policy_circuit.sampling_window_seconds').should('have.value', '60')
  })

  // The fill restores every missing key, including the threshold the selected
  // condition does not use; that one has to be dropped again.
  it('keeps the unused threshold out of the payload across an off/on toggle', () => {
    mountForm()

    cy.getTestId('ff-radio-config.policy_circuit.open_when-failure_percentage').click()
    enableCircuit('policy_circuit')
    enableCircuit('policy_circuit')

    cy.getTestId('ff-config.policy_circuit.failure_percentage').should('have.value', '10')
    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.policy_circuit).to.not.have.property('max_failures')
    })
  })

  // The default is a create-time convenience: a saved threshold must survive a
  // circuit being switched off and back on.
  it('keeps a saved threshold when a circuit is turned back on while editing', () => {
    mountForm({
      config: {
        policy_circuit: { enabled: false },
        latency_circuit: { enabled: false, open_when: 'both', max_failures: 10, failure_percentage: 10 },
      },
    }, true)

    enableCircuit('latency_circuit')

    cy.getTestId('ff-radio-config.latency_circuit.open_when-both').should('be.checked')
    cy.get('@onFormChange').its('lastCall.args.0').should((value: CircuitBreakerPayload) => {
      expect(value.config.latency_circuit.open_when).to.eq('both')
    })
  })

  // Both thresholds are `required`: the Gateway rejects a null ("required field
  // missing") but accepts an absent key, so the unused one is dropped.
  it('shows only the threshold its condition uses, and drops the other', () => {
    mountForm()

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

  // Offering a value the schema dropped would fail the Gateway's enum check.
  it('offers only the enum options the schema declares', () => {
    mountSchema({
      type: 'record',
      fields: [{
        config: {
          type: 'record',
          required: true,
          fields: [
            { identifier: { type: 'string', one_of: ['service'], default: 'service' } },
            {
              policy_circuit: {
                type: 'record',
                required: true,
                fields: [
                  { enabled: { type: 'boolean', default: false } },
                  { open_when: { type: 'string', one_of: ['max_failures'], default: 'max_failures' } },
                  { max_failures: { type: 'integer', required: true, default: 20 } },
                ],
              },
            },
          ],
        },
      }],
    })

    openAdvanced()
    cy.getTestId('ff-radio-config.identifier-service').should('exist')
    cy.getTestId('ff-radio-config.identifier-route').should('not.exist')
    cy.getTestId('ff-radio-config.policy_circuit.open_when-max_failures').should('exist')
    cy.getTestId('ff-radio-config.policy_circuit.open_when-both').should('not.exist')
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
