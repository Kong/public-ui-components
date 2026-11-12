import { defineComponent, h, type Component } from 'vue'
import Form from './Form.vue'
import ArrayField from './ArrayField.vue'
import FieldRenderer from './FieldRenderer.vue'
import { FIELD_RENDERERS, useField } from '../composables'
import type { FormSchema } from '../form-schema'
import type { RenderRules } from '../types'
import type { RevealResult } from '../composables'

const schema: FormSchema = {
  type: 'record',
  fields: [
    {
      connection: {
        type: 'record',
        required: true,
        fields: [
          {
            tls: {
              type: 'record',
              fields: [{ client_cert: { type: 'string' } }],
            },
          },
        ],
      },
    },
    {
      upstreams: {
        type: 'array',
        elements: {
          type: 'record',
          fields: [{ host: { type: 'string' } }],
        },
      },
    },
    // Rendered by `RendersNothing`, see below
    { note: { type: 'string' } },
    {
      headers: {
        type: 'map',
        keys: { type: 'string' },
        values: { type: 'string' },
      },
    },
    {
      cache: {
        type: 'record',
        fields: [{ ttl: { type: 'integer' } }],
      },
    },
    {
      rate_limit: {
        type: 'record',
        required: true,
        fields: [
          { strategy: { type: 'string', one_of: ['local', 'redis'] } },
          {
            redis: {
              type: 'record',
              required: true,
              fields: [{ host: { type: 'string' } }],
            },
          },
        ],
      },
    },
  ],
}

const renderRules: RenderRules = {
  dependencies: {
    'rate_limit.redis': ['rate_limit.strategy', 'redis'],
  },
}

const data = {
  connection: { tls: { client_cert: 'cert' } },
  upstreams: [{ host: 'a' }, { host: 'b' }, { host: 'c' }],
  headers: { 'X-Request-Id': 'abc', 'x.y': 'dotted' },
  cache: null,
  rate_limit: { strategy: 'local', redis: { host: 'localhost' } },
}

/** A field component that registers its path but renders no element */
const RendersNothing = defineComponent({
  props: { name: { type: String, required: true } },
  setup(props) {
    useField(() => props.name)
    return () => null
  },
})

/** What the test needs from the form's exposed API */
type RevealingForm = { reveal: (path: string) => Promise<RevealResult | null> }

function mountForm() {
  cy.mount(Form, {
    props: { schema, data, renderRules },
    slots: {
      [FIELD_RENDERERS]: () => [
        h(FieldRenderer, { match: ({ path }: { path: string }) => path === 'upstreams' }, {
          default: (props: Record<string, unknown>) => h(ArrayField as Component, { ...props, appearance: 'tabs' }),
        }),
        h(FieldRenderer, { match: ({ path }: { path: string }) => path === 'note' }, {
          default: (props: Record<string, unknown>) => h(RendersNothing, props as { name: string }),
        }),
      ],
    },
  }).then(({ wrapper }) => {
    cy.wrap(wrapper.vm as unknown as RevealingForm).as('form')
  })
}

function reveal(path: string) {
  return cy.get<RevealingForm>('@form').then(form => cy.wrap(form.reveal(path)))
}

describe('Field navigation', () => {
  it('expands collapsed records on the way and focuses the field', () => {
    mountForm()
    cy.getTestId('ff-object-toggle-btn-connection.tls').click()
    cy.getTestId('ff-connection.tls.client_cert').should('not.exist')

    reveal('connection.tls.client_cert').should('deep.equal', { path: 'connection.tls.client_cert', exact: true })
    cy.getTestId('ff-connection.tls.client_cert').should('be.visible').and('have.focus')
  })

  it('switches to the tab of an array item', () => {
    mountForm()
    reveal('upstreams.2.host').should('deep.equal', { path: 'upstreams.2.host', exact: true })
    cy.getTestId('ff-upstreams.2.host').should('be.visible').and('have.focus').and('have.value', 'c')
  })

  it('reveals map entries, including keys with a dot', () => {
    mountForm()
    reveal('headers.X-Request-Id').should('deep.equal', { path: 'headers.X-Request-Id', exact: true })
    cy.focused().should('have.value', 'abc')

    reveal('headers["x.y"]').should('deep.equal', { path: 'headers["x.y"]', exact: true })
    cy.focused().should('have.value', 'dotted')
  })

  it('stops at a record that is switched off and does not switch it on', () => {
    mountForm()
    reveal('cache.ttl').should('deep.equal', { path: 'cache', exact: false })
    cy.getTestId('ff-object-switch-cache').should('not.be.checked')
    cy.getTestId('ff-cache.ttl').should('not.exist')
  })

  it('stops at the nearest visible ancestor of a field hidden by a render rule', () => {
    mountForm()
    reveal('rate_limit.redis.host').should('deep.equal', { path: 'rate_limit', exact: false })
  })

  it('returns null for a path that is not in the form', () => {
    mountForm()
    reveal('no_such.field').should('equal', null)
  })

  it('returns null for a malformed path', () => {
    mountForm()
    reveal('headers["x.y"').should('equal', null)
  })

  it('does not land on the next field when a field renders no element', () => {
    mountForm()
    reveal('note').should('equal', null)
    cy.focused().should('not.exist')
  })
})
