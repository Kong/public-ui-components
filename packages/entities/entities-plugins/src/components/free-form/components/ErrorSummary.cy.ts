import { defineComponent, h, onMounted, ref } from 'vue'
import ErrorSummary from './ErrorSummary.vue'

import type { FieldError, FormSchema } from '@kong-ui-public/freeform'

describe('<ErrorSummary />', () => {
  const schema: FormSchema = {
    type: 'record',
    fields: [{
      config: {
        type: 'record',
        fields: [
          { redis: { type: 'record', fields: [{ host: { type: 'string' } }] } },
          {
            servers: {
              type: 'array',
              elements: { type: 'record', fields: [{ port: { type: 'integer' } }] },
            },
          },
          { headers: { type: 'map', keys: { type: 'string' }, values: { type: 'string' } } },
        ],
      },
    }],
  }

  const entityError: FieldError = { path: '', message: 'at least one of these fields must be non-empty' }
  const hostError: FieldError = { path: 'config.redis.host', message: 'required field missing' }
  const portError: FieldError = { path: 'config.servers.1.port', message: 'value should be between 0 and 65535' }
  const headerError: FieldError = { path: 'config.headers["x.trace"]', message: 'header names must not contain a dot' }

  function mountSummary(errors: FieldError[], unmatchedErrors: FieldError[] = []) {
    // Deeply reactive, as a host's `ref` is: its items are proxies of the raw errors
    const errorsRef = ref(errors)
    const onSelect = cy.spy().as('onSelect')
    const onReveal = cy.spy().as('onReveal')
    cy.mount(() => h(ErrorSummary, {
      errors: errorsRef.value,
      unmatchedErrors,
      schema,
      onSelect,
      onReveal,
    }))
    return errorsRef
  }

  it('renders nothing without errors', () => {
    mountSummary([])

    cy.getTestId('ff-error-summary').should('not.exist')
  })

  it('lists the errors with readable field names, expanded by default', () => {
    mountSummary([entityError, hostError, portError, headerError], [entityError])

    cy.getTestId('ff-error-summary').should('contain.text', '4 errors')
    cy.getTestId('ff-error-summary-toggle').should('have.attr', 'aria-expanded', 'true')
    cy.getTestId('ff-error-summary-list').should('be.visible')

    cy.getTestId('ff-error-summary-item-config.redis.host')
      .should('contain.text', 'Redis › Host:')
      .and('contain.text', 'required field missing')
    cy.getTestId('ff-error-summary-item-config.servers.1.port').should('contain.text', 'Servers #2 › Port:')
    // The path has double quotes in it, so the selector uses single ones
    cy.get('[data-testid=\'ff-error-summary-item-config.headers["x.trace"]\']').should('contain.text', 'Headers › "x.trace":')
    // An error on the whole entity
    cy.getTestId('ff-error-summary-item-').should('contain.text', 'Plugin:')
  })

  it('links only the errors a field shows', () => {
    mountSummary([entityError, hostError], [entityError])

    cy.getTestId('ff-error-summary-item-config.redis.host').find('button').should('exist')
    cy.getTestId('ff-error-summary-item-').find('button').should('not.exist')
  })

  it('emits `select` with the error when its field name is clicked', () => {
    mountSummary([entityError, hostError, portError], [entityError])

    cy.getTestId('ff-error-summary-item-config.servers.1.port').find('button').click()
    cy.get('@onSelect').should('have.been.calledWith', portError)
  })

  it('links the fields a message names by their labels, and emits `reveal` with their path', () => {
    const checkError: FieldError = {
      path: '',
      message: "at least one of these fields must be non-empty: 'config.redis.host', 'config.unknown'",
    }
    mountSummary([checkError], [checkError])

    // Only the name the schema has is a link, showing the field's label
    cy.getTestId('ff-error-summary-item-').find('button').should('have.length', 1)
      .and('have.text', 'Redis › Host')
    cy.getTestId('ff-error-summary-item-')
      .should('contain.text', "at least one of these fields must be non-empty: Redis › Host, 'config.unknown'")

    cy.getTestId('ff-error-summary-field-link-config.redis.host').click()
    cy.get('@onReveal').should('have.been.calledOnceWith', 'config.redis.host')
    cy.get('@onSelect').should('not.have.been.called')
  })

  it('labels the fields a message names relative to the record the error is on', () => {
    const recordError: FieldError = {
      path: 'config.redis',
      message: "all or none of these fields must be set: 'host', 'config.servers'",
    }
    mountSummary([recordError])

    // `host` is in the record, so the record's label is not repeated; `config.servers` is not
    cy.getTestId('ff-error-summary-item-config.redis')
      .should('contain.text', 'Redis: all or none of these fields must be set: Host, Servers')
    cy.getTestId('ff-error-summary-field-link-config.redis.host').should('have.text', 'Host')
    cy.getTestId('ff-error-summary-field-link-config.servers').should('have.text', 'Servers')
  })

  it('collapses to the count and expands again', () => {
    mountSummary([hostError])

    cy.getTestId('ff-error-summary-toggle').click()
    cy.getTestId('ff-error-summary-toggle').should('have.attr', 'aria-expanded', 'false')
    cy.get('.ff-error-summary-body').should('have.attr', 'inert')
    cy.getTestId('ff-error-summary').should('contain.text', '1 error')

    cy.getTestId('ff-error-summary-toggle').click()
    cy.getTestId('ff-error-summary-toggle').should('have.attr', 'aria-expanded', 'true')
    cy.get('.ff-error-summary-body').should('not.have.attr', 'inert')
  })

  it('selects the first linked error when it mounts with errors', () => {
    mountSummary([entityError, hostError, portError], [entityError])

    cy.get('@onSelect').should('have.been.calledOnceWith', hostError)
  })

  it('waits for `unmatchedErrors` that the host passes one render after mounting', () => {
    const onSelect = cy.spy().as('onSelect')
    // Like a host that reads `unmatchedErrors` from a template ref to the form
    const Host = defineComponent(() => {
      const unmatchedErrors = ref<FieldError[]>()
      onMounted(() => {
        unmatchedErrors.value = [entityError]
      })
      return () => h(ErrorSummary, {
        errors: [entityError, hostError],
        unmatchedErrors: unmatchedErrors.value,
        schema,
        onSelect,
      })
    })
    cy.mount(() => h(Host))

    cy.get('@onSelect').should('have.been.calledOnceWith', hostError)
  })

  it('announces the error count to screen readers', () => {
    const errors = mountSummary([])
    cy.get('[aria-live="polite"]').should('have.text', '')

    cy.then(() => {
      errors.value = [hostError, portError]
    })
    cy.get('[aria-live="polite"]').should('contain.text', '2 errors')
  })

  it('selects the first linked error when errors show up, but not when they change', () => {
    const errors = mountSummary([])
    cy.get('@onSelect').should('not.have.been.called')

    cy.then(() => {
      errors.value = [hostError, portError]
    })
    cy.get('@onSelect').should('have.been.calledOnceWith', hostError)

    // e.g. an array item is removed through the form
    cy.then(() => {
      errors.value = [portError]
    })
    cy.getTestId('ff-error-summary').should('contain.text', '1 error')
    cy.get('@onSelect').should('have.been.calledOnce')
  })
})
