import Form from './Form.vue'
import type { FormSchema, RecordFieldSchema } from '../form-schema'
import type { FormConfig } from '../types'

/**
 * A schema shaped like rate-limiting's: expressible fields under `config`, with
 * their twins under a sibling root `expressions` record.
 */
function createExpressibleSchema(): FormSchema {
  return {
    type: 'record',
    fields: [
      {
        config: {
          type: 'record',
          required: true,
          fields: [
            {
              minute: {
                type: 'number',
                expressible: true,
                gt: 0,
              },
            },
            {
              plain: {
                type: 'number',
              },
            },
            {
              limit: {
                type: 'array',
                expressible: true,
                elements: { type: 'number' },
              },
            },
          ],
        },
      },
      {
        expressions: {
          type: 'record',
          required: false,
          fields: [
            {
              minute: {
                type: 'string',
                len_min: 0,
                len_max: 1024,
                expressible_kong_type: 'number',
                source_field: { type: 'number', gt: 0 },
              },
            },
            {
              limit: {
                type: 'array',
                elements: {
                  type: 'string',
                  len_min: 0,
                  len_max: 1024,
                  expressible_kong_type: 'number',
                  source_field: { type: 'number' },
                },
              },
            },
          ],
        },
      },
    ],
  } as FormSchema
}

function mountForm(options: {
  schema?: FormSchema
  data?: Record<string, unknown>
  config?: FormConfig
} = {}) {
  cy.mount(Form, {
    props: {
      schema: options.schema ?? createExpressibleSchema(),
      data: options.data,
      config: options.config,
      onChange: cy.spy().as('onChangeSpy'),
    },
  })
}

function assertLastExpressions(expected: unknown) {
  cy.get('@onChangeSpy').should((spy: any) => {
    expect(spy.lastCall?.args[0]?.expressions).to.deep.equal(expected)
  })
}

describe('expressible fields', () => {
  it('offers the trigger only for fields that have a twin', () => {
    mountForm()

    cy.getTestId('ff-expression-add-config.minute').should('be.visible')
    // `config.plain` is not expressible, and `config.limit` is expressible only
    // element-wise — neither gets a control of its own.
    cy.getTestId('ff-expression-add-config.plain').should('not.exist')
    cy.getTestId('ff-expression-add-config.limit').should('not.exist')
  })

  it('renders nothing when the schema declares no expressions record', () => {
    mountForm({
      schema: {
        type: 'record',
        fields: [{
          config: {
            type: 'record',
            required: true,
            fields: [{ minute: { type: 'number', expressible: true } }],
          },
        }],
      },
    })

    cy.getTestId('ff-config.minute').should('be.visible')
    cy.getTestId('ff-expression-config.minute').should('not.exist')
  })

  it('does not render the expressions record as a field of its own', () => {
    mountForm()

    cy.getTestId('ff-object-expressions').should('not.exist')
    // The twin input only exists once the trigger is used.
    cy.getTestId('ff-expressions.minute').should('not.exist')
  })

  it('writes the typed expression to the twin path', () => {
    mountForm()

    cy.getTestId('ff-expression-add-config.minute').click()
    cy.getTestId('ff-expressions.minute').should('be.visible').type('req.size * 2')

    assertLastExpressions({ minute: 'req.size * 2' })
  })

  it('labels the editor and states the type the expression must return', () => {
    mountForm()

    cy.getTestId('ff-expression-add-config.minute').click()
    cy.getTestId('ff-expression-config.minute')
      .should('contain.text', 'Kong plug-in dynamic expression')
      // Derived from the twin's `expressible_kong_type`, not hardcoded copy.
      .and('contain.text', 'The expression must return a number')
      .and('contain.text', 'Learn more')
  })

  it('starts expanded when the incoming data already holds an expression', () => {
    mountForm({
      data: {
        config: { minute: null, plain: null, limit: [] },
        expressions: { minute: 'req.size' },
      },
    })

    cy.getTestId('ff-expressions.minute').should('have.value', 'req.size')
    cy.getTestId('ff-expression-add-config.minute').should('not.exist')
  })

  it('unsets the expression and collapses when removed', () => {
    mountForm({
      data: {
        config: { minute: null, plain: null, limit: [] },
        expressions: { minute: 'req.size' },
      },
    })

    cy.getTestId('ff-expression-remove-config.minute').click()

    cy.getTestId('ff-expressions.minute').should('not.exist')
    cy.getTestId('ff-expression-add-config.minute').should('be.visible')
    assertLastExpressions({ minute: null })
  })

  it('writes the configured empty sentinel when removed', () => {
    mountForm({
      config: { emptyFieldValue: 'undefined' },
      data: {
        config: { minute: undefined, plain: undefined, limit: [] },
        expressions: { minute: 'req.size' },
      },
    })

    cy.getTestId('ff-expression-remove-config.minute').click()

    assertLastExpressions({ minute: undefined })
  })

  it('gives each array element its own expression', () => {
    mountForm()

    cy.getTestId('ff-add-item-btn-config.limit').click()
    cy.getTestId('ff-add-item-btn-config.limit').click()

    cy.getTestId('ff-expression-add-config.limit.1').click()
    cy.getTestId('ff-expressions.limit.1').type('req.size')

    // The twin array is index-aligned with the source array, so the expression
    // lands at index 1 and index 0 holds `''` — the Gateway's "no expression"
    // sentinel, which keeps the slot rather than dropping it.
    assertLastExpressions({ limit: ['', 'req.size'] })
  })

  it('keeps a hidden field\'s expression hidden', () => {
    cy.mount(Form, {
      props: {
        schema: createExpressibleSchema(),
        renderRules: {
          dependencies: {
            'config.minute': ['config.plain', 42],
          },
        },
        onChange: cy.spy().as('onChangeSpy'),
      },
    })

    cy.getTestId('ff-expression-config.minute').should('not.be.visible')

    cy.getTestId('ff-config.plain').type('42')
    cy.getTestId('ff-expression-config.minute').should('be.visible')
  })
})

// ── Version compatibility ─────────────────────────────────────────────────────

/**
 * `createExpressibleSchema()` with `min_ai_gateway_version: '2.4'` on one field
 * of one root record — `('config', 'minute')` tags the source field, locking
 * the whole value/expression pair; `('expressions', 'minute')` tags the twin
 * alone, locking only the expression affordances.
 */
function createTaggedSchema(recordName: 'config' | 'expressions', fieldName: string): FormSchema {
  const schema = createExpressibleSchema()
  const record = schema.fields
    .map(entry => entry[recordName])
    .find((candidate): candidate is RecordFieldSchema => !!candidate && candidate.type === 'record')
  const target = record?.fields.find(entry => fieldName in entry)?.[fieldName]

  if (target) {
    target.min_ai_gateway_version = '2.4'
  }

  return schema
}

describe('expressible fields — version gating', () => {
  it('disables the trigger beside the locked value input when the source field is version-locked', () => {
    mountForm({ schema: createTaggedSchema('config', 'minute'), config: { minRuntimeVersion: '2.3' } })

    // The value input locks through its own useField versionInfo...
    cy.getTestId('ff-config.minute').should('be.disabled')
    // ...and the expression affordance locks with it: an expression overrides
    // the value on every request, so a runtime that can't support the value
    // can't support its expression either.
    cy.getTestId('ff-expression-add-config.minute').should('be.disabled')
  })

  it('keeps a saved expression visible but read-only, and its value in the payload, when locked', () => {
    mountForm({
      schema: createTaggedSchema('config', 'minute'),
      config: { minRuntimeVersion: '2.3' },
      data: { config: { minute: null, plain: null, limit: [] }, expressions: { minute: 'req.size' } },
    })

    // Read-only, same contract as every other version-locked field: the editor
    // renders with its saved value and neither the textarea nor the remove
    // button can change it.
    cy.getTestId('ff-expressions.minute').should('have.value', 'req.size').and('be.disabled')
    cy.getTestId('ff-expression-remove-config.minute').should('be.disabled')

    // Disabled, not hidden — and never pruned: the expression stays in the
    // emitted payload untouched.
    assertLastExpressions({ minute: 'req.size' })
  })

  it('leaves the pair fully usable when the runtime satisfies the requirement', () => {
    mountForm({ schema: createTaggedSchema('config', 'minute'), config: { minRuntimeVersion: '2.4' } })

    cy.getTestId('ff-config.minute').should('not.be.disabled')
    cy.getTestId('ff-expression-add-config.minute').should('not.be.disabled')

    cy.getTestId('ff-expression-add-config.minute').click()
    cy.getTestId('ff-expressions.minute').should('not.be.disabled').type('req.size * 2')
    assertLastExpressions({ minute: 'req.size * 2' })
  })

  it('locks through the twin\'s own requirement when the source field is untagged', () => {
    mountForm({ schema: createTaggedSchema('expressions', 'minute'), config: { minRuntimeVersion: '2.3' } })

    // The value input is fine — the runtime supports the field — but the
    // expression feature arrived later, so its affordances lock.
    cy.getTestId('ff-config.minute').should('not.be.disabled')
    cy.getTestId('ff-expression-add-config.minute').should('be.disabled')
  })

  it('locks every expression affordance when the root expressions record is version-locked and no twin is tagged', () => {
    // The shape the AI Gateway Plugin entity declares (kong-ee aigw-master):
    // the root `expressions` record itself carries the requirement — the
    // whole expression feature is version-gated — while neither the source
    // fields nor their twins are tagged individually. Every twin must
    // inherit the lock through the ancestor walk.
    const schema = createExpressibleSchema()
    const expressionsRecord = schema.fields
      .map(entry => entry.expressions)
      .find((candidate): candidate is RecordFieldSchema => !!candidate && candidate.type === 'record')
    if (expressionsRecord) {
      expressionsRecord.min_ai_gateway_version = '2.3'
    }

    mountForm({ schema, config: { minRuntimeVersion: '2.2' } })

    // The value inputs are fine — the runtime supports the fields — but
    // expressions as a feature arrived later, so every affordance locks.
    cy.getTestId('ff-config.minute').should('not.be.disabled')
    cy.getTestId('ff-expression-add-config.minute').should('be.disabled')
  })

  it('fails open when no minRuntimeVersion is configured', () => {
    mountForm({ schema: createTaggedSchema('config', 'minute') })

    cy.getTestId('ff-config.minute').should('not.be.disabled')
    cy.getTestId('ff-expression-add-config.minute').should('not.be.disabled')
  })
})
