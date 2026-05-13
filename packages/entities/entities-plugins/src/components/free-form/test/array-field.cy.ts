import Form from '../shared/Form.vue'
import type { FormSchema } from 'src/types/plugins/form-schema'

const FIELD_NAME = 'list'

function createArraySchema(options: {
  required?: boolean
  defaultValue?: string[]
} = {}): FormSchema {
  return {
    type: 'record',
    fields: [{
      [FIELD_NAME]: {
        type: 'array',
        elements: { type: 'string' },
        ...(options.required ? { required: true } : {}),
        ...(options.defaultValue !== undefined ? { default: options.defaultValue } : {}),
      },
    }],
  }
}

function mountArrayForm(options: {
  schema?: FormSchema
  data?: Record<string, unknown>
}) {
  cy.mount(Form, {
    props: {
      schema: options.schema ?? createArraySchema(),
      data: options.data,
      onChange: cy.spy().as('onChangeSpy'),
    },
  })
}

function assertLastChange(expected: Record<string, unknown>) {
  cy.get('@onChangeSpy').should((spy: any) => {
    expect(spy.lastCall?.args[0]).to.deep.equal(expected)
  })
}

describe('ArrayField', () => {
  it('should emit [] when removing last item from required array', () => {
    mountArrayForm({
      schema: createArraySchema({ required: true }),
      data: { [FIELD_NAME]: ['alpha'] },
    })

    cy.getTestId(`ff-array-remove-item-btn-${FIELD_NAME}.0`).click()

    assertLastChange({ [FIELD_NAME]: [] })
  })

  it('should emit null when removing last item from optional array', () => {
    mountArrayForm({
      data: { [FIELD_NAME]: ['alpha'] },
    })

    cy.getTestId(`ff-array-remove-item-btn-${FIELD_NAME}.0`).click()

    assertLastChange({ [FIELD_NAME]: null })
  })

  it('should emit null instead of the default when removing last item from optional array with default', () => {
    mountArrayForm({
      schema: createArraySchema({ defaultValue: ['alpha'] }),
    })

    cy.getTestId(`ff-array-remove-item-btn-${FIELD_NAME}.0`).click()

    assertLastChange({ [FIELD_NAME]: null })
  })

  it('should emit [] instead of the default when removing last item from required array with default', () => {
    mountArrayForm({
      schema: createArraySchema({ required: true, defaultValue: ['alpha'] }),
    })

    cy.getTestId(`ff-array-remove-item-btn-${FIELD_NAME}.0`).click()

    assertLastChange({ [FIELD_NAME]: [] })
  })

  it('should emit the remaining items when removing one of two entries', () => {
    mountArrayForm({
      data: { [FIELD_NAME]: ['alpha', 'beta'] },
    })

    cy.getTestId(`ff-array-remove-item-btn-${FIELD_NAME}.1`).click()

    assertLastChange({ [FIELD_NAME]: ['alpha'] })
  })
})
