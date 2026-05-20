import { h } from 'vue'
import Form from '../shared/Form.vue'
import EnumField from '../shared/EnumField.vue'
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
  onUpdate?: (value: string | string[] | null) => void
}) {
  const props = {
    schema: getMultiEnumSchema(options.required),
    data: options.data,
    onChange: cy.spy().as('onChangeSpy'),
  }

  if (options.onUpdate) {
    cy.mount(() => h(Form, props, {
      default: () => h(EnumField, {
        name: FIELD_NAME,
        multiple: true,
        onUpdate: options.onUpdate,
      }),
    }))

    return
  }

  cy.mount(Form, {
    props,
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

  it('should emit null from @update when clearing all selections from optional multiselect', () => {
    const onUpdateSpy = cy.spy().as('onUpdateSpy')

    mountEnumForm({
      data: { [FIELD_NAME]: ['http', 'grpc'] },
      onUpdate: onUpdateSpy,
    })

    removeSelectedValue('http')
    removeSelectedValue('grpc')

    cy.get('@onUpdateSpy').should((spy: any) => {
      expect(spy.lastCall?.args[0]).to.equal(null)
    })
  })
})
