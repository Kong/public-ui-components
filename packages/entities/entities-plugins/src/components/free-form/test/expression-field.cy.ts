import Form from '../shared/Form.vue'
import type { FormSchema } from 'src/types/plugins/form-schema'
import type { FormConfig } from '../shared/types'

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

describe('ExpressionField', () => {
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
      .should('contain.text', 'Kong plug-in conditional expression')
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

    // The twin array is index-aligned with the source array, so an expression on
    // the second element lands at index 1 and leaves index 0 unset.
    cy.get('@onChangeSpy').should((spy: any) => {
      const expressions = spy.lastCall?.args[0]?.expressions
      expect(expressions.limit[1]).to.equal('req.size')
      expect(expressions.limit[0] ?? null).to.equal(null)
    })
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
