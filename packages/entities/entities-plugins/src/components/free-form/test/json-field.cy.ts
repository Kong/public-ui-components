import Form from '../shared/Form.vue'
import type { FormSchema } from 'src/types/plugins/form-schema'
import type { FormConfig } from '../shared/types'

const FIELD_NAME = 'payload'

function createJsonSchema(options: {
  required?: boolean
} = {}): FormSchema {
  return {
    type: 'record',
    fields: [{
      [FIELD_NAME]: {
        type: 'json',
        ...(options.required ? { required: true } : {}),
      },
    }],
  } as FormSchema
}

function mountJsonForm(options: {
  schema?: FormSchema
  data?: Record<string, unknown>
  config?: FormConfig
}) {
  cy.mount(Form, {
    props: {
      schema: options.schema ?? createJsonSchema(),
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

describe('JsonField', () => {
  it('should emit null when clearing an optional field (default behavior)', () => {
    mountJsonForm({
      data: { [FIELD_NAME]: 'raw text' },
    })

    cy.getTestId(`ff-${FIELD_NAME}`).clear()

    assertLastChange({ [FIELD_NAME]: null })
  })

  describe('emptyFieldValue config', () => {
    it('should emit null when clearing an optional field with emptyFieldValue: null', () => {
      mountJsonForm({
        data: { [FIELD_NAME]: 'raw text' },
        config: { emptyFieldValue: 'null' },
      })

      cy.getTestId(`ff-${FIELD_NAME}`).clear()

      assertLastChange({ [FIELD_NAME]: null })
    })

    it('should emit undefined when clearing an optional field with emptyFieldValue: undefined', () => {
      mountJsonForm({
        data: { [FIELD_NAME]: 'raw text' },
        config: { emptyFieldValue: 'undefined' },
      })

      cy.getTestId(`ff-${FIELD_NAME}`).clear()

      assertLastChange({ [FIELD_NAME]: undefined })
    })
  })
})
