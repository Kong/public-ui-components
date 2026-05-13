import Form from '../shared/Form.vue'
import type { FormSchema } from 'src/types/plugins/form-schema'

const FIELD_NAME = 'protocols'

function getMultiEnumSchema(required = false): FormSchema {
  return {
    type: 'record',
    fields: [
      {
        [FIELD_NAME]: {
          type: 'set',
          elements: {
            type: 'string',
            one_of: ['http', 'https', 'grpc'],
          },
          ...(required ? { required: true } : {}),
        },
      },
    ],
  }
}

function mountEnumForm(options: {
  required?: boolean
  data: Record<string, unknown>
}) {
  cy.mount(Form, {
    props: {
      schema: getMultiEnumSchema(options.required),
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

function removeSelectedValue(value: string) {
  cy.getTestId(`ff-${FIELD_NAME}`)
    .contains('.multiselect-selection-badge', new RegExp(value, 'i'))
    .findTestId('badge-dismiss-button')
    .click()
}

describe('EnumField', () => {
  it('should emit [] when clearing all selections from required multiselect', () => {
    mountEnumForm({
      required: true,
      data: { [FIELD_NAME]: ['http', 'grpc'] },
    })

    removeSelectedValue('http')
    removeSelectedValue('grpc')

    assertLastChange({ [FIELD_NAME]: [] })
  })

  it('should emit null when clearing all selections from optional multiselect', () => {
    mountEnumForm({
      data: { [FIELD_NAME]: ['http', 'grpc'] },
    })

    removeSelectedValue('http')
    removeSelectedValue('grpc')

    assertLastChange({ [FIELD_NAME]: null })
  })

  it('should emit the remaining selections after a partial deselect', () => {
    mountEnumForm({
      data: { [FIELD_NAME]: ['http', 'grpc'] },
    })

    removeSelectedValue('grpc')

    assertLastChange({ [FIELD_NAME]: ['http'] })
  })
})
