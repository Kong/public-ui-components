import Form from '../shared/Form.vue'
import type { FormSchema } from 'src/types/plugins/form-schema'
import type { FormConfig } from '../shared/types'

const FIELD_NAME = 'service'

function createForeignSchema(options: {
  required?: boolean
} = {}): FormSchema {
  return {
    type: 'record',
    fields: [{
      [FIELD_NAME]: {
        type: 'foreign',
        reference: 'services',
        ...(options.required ? { required: true } : {}),
      },
    }],
  } as FormSchema
}

function mountForeignForm(options: {
  schema?: FormSchema
  data?: Record<string, unknown>
  config?: FormConfig
}) {
  cy.mount(Form, {
    props: {
      schema: options.schema ?? createForeignSchema(),
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

describe('ForeignField', () => {
  it('should emit null when clearing an optional reference (default behavior)', () => {
    mountForeignForm({
      data: { [FIELD_NAME]: { id: 'svc-1' } },
    })

    cy.getTestId(`ff-${FIELD_NAME}`).clear()

    assertLastChange({ [FIELD_NAME]: null })
  })

  describe('emptyFieldValue config', () => {
    it('should emit null when clearing an optional reference with emptyFieldValue: null', () => {
      mountForeignForm({
        data: { [FIELD_NAME]: { id: 'svc-1' } },
        config: { emptyFieldValue: 'null' },
      })

      cy.getTestId(`ff-${FIELD_NAME}`).clear()

      assertLastChange({ [FIELD_NAME]: null })
    })

    it('should emit undefined when clearing an optional reference with emptyFieldValue: undefined', () => {
      mountForeignForm({
        data: { [FIELD_NAME]: { id: 'svc-1' } },
        config: { emptyFieldValue: 'undefined' },
      })

      cy.getTestId(`ff-${FIELD_NAME}`).clear()

      assertLastChange({ [FIELD_NAME]: undefined })
    })
  })
})
