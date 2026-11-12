import { defineComponent, h, ref } from 'vue'
import Form from './Form.vue'
import type { FormSchema } from '../form-schema'
import type { FieldError } from '../types'

const schema: FormSchema = {
  type: 'record',
  fields: [
    { name: { type: 'string' } },
    { port: { type: 'integer' } },
    { enabled: { type: 'boolean' } },
    { protocol: { type: 'string', one_of: ['http', 'https'] } },
    { tags: { type: 'set', elements: { type: 'string' } } },
    {
      tls: {
        type: 'record',
        required: true,
        fields: [{ client_cert: { type: 'string' } }],
      },
    },
    { headers: { type: 'map', keys: { type: 'string' }, values: { type: 'string' } } },
    { cache: { type: 'record', fields: [{ ttl: { type: 'integer' } }] } },
    {
      servers: {
        type: 'array',
        elements: { type: 'record', fields: [{ port: { type: 'integer' } }] },
      },
    },
  ],
}

const data = {
  name: 'demo',
  port: 70000,
  enabled: false,
  protocol: 'http',
  tags: ['a', 'B'],
  tls: { client_cert: 'cert' },
  headers: { 'x.y': 'dotted' },
  cache: null,
  servers: [{ port: 1 }, { port: 2 }, { port: 3 }],
}

const errors: FieldError[] = [
  { path: 'name', message: 'name is taken' },
  { path: 'port', message: 'value should be between 0 and 65535' },
  { path: 'enabled', message: 'must be enabled' },
  { path: 'protocol', message: 'https is required' },
  { path: 'tags.1', message: 'tags must be lowercase' },
  { path: 'tls', message: 'verify needs a client certificate' },
  { path: 'tls.client_cert', message: 'invalid PEM certificate' },
  { path: 'headers["x.y"]', message: 'header names must not contain a dot' },
  { path: 'cache.ttl', message: 'expected an integer' },
]

function mountForm(formErrors: FieldError[] = errors) {
  cy.mount(Form, { props: { schema, data, errors: formErrors } }).then(({ wrapper }) => {
    cy.wrap(wrapper).as('wrapper')
  })
}

describe('Field errors', () => {
  it('shows each error under the field it belongs to', () => {
    mountForm()

    cy.getTestId('ff-field-errors-name').should('have.text', 'name is taken')
    cy.getTestId('ff-field-errors-port').should('contain.text', 'between 0 and 65535')
    cy.getTestId('ff-field-errors-enabled').should('have.text', 'must be enabled')
    // The select shows the message as its help text
    cy.getTestId('ff-protocol').closest('.k-select').find('.help-text').should('have.text', 'https is required')
    // A set is one field, so it shows the errors of its items
    cy.getTestId('ff-field-errors-tags').should('have.text', 'tags must be lowercase')
    // A record shows only its own error, its fields show theirs
    cy.getTestId('ff-field-errors-tls').should('have.text', 'verify needs a client certificate')
    cy.getTestId('ff-field-errors-tls.client_cert').should('have.text', 'invalid PEM certificate')
    cy.get('[data-testid^="ff-field-errors-headers."]').should('have.text', 'header names must not contain a dot')
  })

  it('shows the error on the record of an array item', () => {
    mountForm([{ path: 'servers.1', message: "only one or none of these fields must be set: 'host', 'port'" }])
    cy.getTestId('ff-field-errors-servers.1').should('have.text', "only one or none of these fields must be set: 'host', 'port'")
  })

  it('leaves an error on the whole entity to the host', () => {
    const entityError = { path: '', message: "at least one of these fields must be non-empty: 'name', 'port'" }
    mountForm([entityError])
    cy.get('[data-testid^="ff-field-errors-"]').should('not.exist')
    cy.get('@wrapper').its('vm.unmatchedErrors').should('deep.equal', [entityError])
  })

  it('marks the inputs as invalid', () => {
    mountForm()
    cy.getTestId('ff-name').closest('.k-input').should('have.class', 'input-error')
  })

  it('exposes the errors no field can show', () => {
    mountForm()
    cy.get('@wrapper').its('vm.unmatchedErrors').should('deep.equal', [
      { path: 'cache.ttl', message: 'expected an integer' },
    ])
  })

  it('clears the errors when the host does', () => {
    mountForm()
    cy.getTestId('ff-field-errors-name').should('exist')

    cy.get('@wrapper').then((wrapper: any) => wrapper.setProps({ errors: [] }))
    cy.get('[data-testid^="ff-field-errors-"]').should('not.exist')
  })
})

describe('Field errors: structure changes', () => {
  /** A host that binds `v-model:errors`, exposing the list it holds */
  function mountHost(initial: FieldError[]) {
    const hostErrors = ref<FieldError[]>(initial)
    cy.wrap(hostErrors).as('hostErrors')
    cy.mount(defineComponent({
      setup: () => () => h(Form, {
        schema,
        data,
        errors: hostErrors.value,
        'onUpdate:errors': (value: FieldError[]) => {
          hostErrors.value = value
        },
      }),
    }))
  }

  it('drops the errors of a removed array item and moves the ones after it', () => {
    mountHost([
      { path: 'servers.0.port', message: 'first' },
      { path: 'servers.2.port', message: 'third' },
    ])

    cy.getTestId('ff-array-remove-item-btn-servers.0').click()

    cy.getTestId('ff-field-errors-servers.0.port').should('not.exist')
    cy.getTestId('ff-field-errors-servers.1.port').should('have.text', 'third')
    cy.get('@hostErrors').its('value').should('deep.equal', [{ path: 'servers.1.port', message: 'third' }])
  })

  it('keeps the error of a map entry on it when its key is renamed', () => {
    mountHost([{ path: 'headers["x.y"]', message: 'bad header' }])

    cy.getTestId('ff-map-key-headers.0').clear()
    cy.getTestId('ff-map-key-headers.0').type('x-y')

    cy.get('[data-testid^="ff-field-errors-headers."]').should('have.text', 'bad header')
    cy.get('@hostErrors').its('value').should('deep.equal', [{ path: 'headers.x-y', message: 'bad header' }])
  })

  it('drops the error of a removed map entry', () => {
    mountHost([{ path: 'headers["x.y"]', message: 'bad header' }])

    cy.getTestId('ff-map-remove-btn-headers.0').click()

    cy.get('[data-testid^="ff-field-errors-"]').should('not.exist')
    cy.get('@hostErrors').its('value').should('deep.equal', [])
  })
})
