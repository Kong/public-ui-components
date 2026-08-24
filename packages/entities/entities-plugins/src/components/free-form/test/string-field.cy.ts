import Form from '../shared/Form.vue'
import type { FormSchema } from 'src/types/plugins/form-schema'
import type { FormConfig } from '../shared/types'

const FIELD_NAME = 'name'

function createStringSchema(options: {
  required?: boolean
  defaultValue?: string
} = {}): FormSchema {
  return {
    type: 'record',
    fields: [{
      [FIELD_NAME]: {
        type: 'string',
        ...(options.required ? { required: true } : {}),
        ...(options.defaultValue !== undefined ? { default: options.defaultValue } : {}),
      },
    }],
  }
}

function mountStringForm(options: {
  schema?: FormSchema
  data?: Record<string, unknown>
  config?: FormConfig
}) {
  cy.mount(Form, {
    props: {
      schema: options.schema ?? createStringSchema(),
      data: options.data,
      config: options.config,
      onChange: cy.spy().as('onChangeSpy'),
    },
  })
}

function assertLastChange(expected: Record<string, unknown>) {
  cy.get('@onChangeSpy').should((spy: any) => {
    expect(spy.lastCall?.args[0]).to.deep.equal(expected)
  })
}

describe('StringField', () => {
  it('should emit null when clearing an optional field (default behavior)', () => {
    mountStringForm({
      data: { [FIELD_NAME]: 'alpha' },
    })

    cy.getTestId(`ff-${FIELD_NAME}`).clear()

    assertLastChange({ [FIELD_NAME]: null })
  })

  describe('emptyFieldValue config', () => {
    it('should emit null when clearing an optional field with emptyFieldValue: null', () => {
      mountStringForm({
        data: { [FIELD_NAME]: 'alpha' },
        config: { emptyFieldValue: 'null' },
      })

      cy.getTestId(`ff-${FIELD_NAME}`).clear()

      assertLastChange({ [FIELD_NAME]: null })
    })

    it('should emit undefined when clearing an optional field with emptyFieldValue: undefined', () => {
      mountStringForm({
        data: { [FIELD_NAME]: 'alpha' },
        config: { emptyFieldValue: 'undefined' },
      })

      cy.getTestId(`ff-${FIELD_NAME}`).clear()

      assertLastChange({ [FIELD_NAME]: undefined })
    })

    it('should emit undefined when clearing a required field with emptyFieldValue: undefined', () => {
      mountStringForm({
        schema: createStringSchema({ required: true }),
        data: { [FIELD_NAME]: 'alpha' },
        config: { emptyFieldValue: 'undefined' },
      })

      cy.getTestId(`ff-${FIELD_NAME}`).clear()

      // Required-but-empty scalars still resolve through the same configurable
      // sentinel as optional fields — required-ness only forces structural
      // defaults (record/array/map), not scalars.
      assertLastChange({ [FIELD_NAME]: undefined })
    })
  })

  it('should emit null instead of the default when clearing a required field with a default (never re-snaps to the default)', () => {
    mountStringForm({
      schema: createStringSchema({ required: true, defaultValue: 'preset' }),
      data: { [FIELD_NAME]: 'alpha' },
    })

    cy.getTestId(`ff-${FIELD_NAME}`).clear()

    assertLastChange({ [FIELD_NAME]: null })
  })
})
