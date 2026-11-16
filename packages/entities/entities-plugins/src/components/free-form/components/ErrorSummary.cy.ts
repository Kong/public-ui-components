import { h, ref } from 'vue'
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
    cy.mount(() => h(ErrorSummary, {
      errors: errorsRef.value,
      unmatchedErrors,
      schema,
      onSelect,
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
