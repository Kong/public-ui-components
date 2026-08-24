import Form from '../shared/Form.vue'
import type { FormSchema } from 'src/types/plugins/form-schema'
import type { FormConfig } from '../shared/types'

const FIELD_NAME = 'tags'

function createTagSchema(): FormSchema {
  return {
    type: 'record',
    fields: [{
      [FIELD_NAME]: {
        type: 'set',
        elements: { type: 'string' },
        len_min: 1,
      },
    }],
  } as FormSchema
}

function mountTagForm(options: {
  data?: Record<string, unknown>
  config?: FormConfig
}) {
  cy.mount(Form, {
    props: {
      schema: createTagSchema(),
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

describe('StringArrayField', () => {
  it('should emit null when clearing a tag field constrained to a minimum length (default behavior)', () => {
    mountTagForm({
      data: { [FIELD_NAME]: ['a', 'b'] },
    })

    cy.getTestId(`ff-${FIELD_NAME}`).clear()

    assertLastChange({ [FIELD_NAME]: null })
  })

  describe('emptyFieldValue config', () => {
    it('should emit undefined when clearing a tag field constrained to a minimum length with emptyFieldValue: undefined', () => {
      mountTagForm({
        data: { [FIELD_NAME]: ['a', 'b'] },
        config: { emptyFieldValue: 'undefined' },
      })

      cy.getTestId(`ff-${FIELD_NAME}`).clear()

      assertLastChange({ [FIELD_NAME]: undefined })
    })
  })
})
