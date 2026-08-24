import Form from '../shared/Form.vue'
import type { FormSchema } from 'src/types/plugins/form-schema'
import type { FormConfig } from '../shared/types'

const FIELD_NAME = 'nested'

function createObjectSchema(): FormSchema {
  return {
    type: 'record',
    fields: [{
      [FIELD_NAME]: {
        type: 'record',
        fields: [{ foo: { type: 'string' } }],
      },
    }],
  }
}

function mountObjectForm(options: {
  data?: Record<string, unknown>
  config?: FormConfig
}) {
  cy.mount(Form, {
    props: {
      schema: createObjectSchema(),
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

describe('ObjectField', () => {
  it('should emit null when toggling an optional object field off (default behavior)', () => {
    mountObjectForm({
      data: { [FIELD_NAME]: { foo: 'bar' } },
    })

    cy.getTestId(`ff-object-switch-${FIELD_NAME}`).click({ force: true })

    assertLastChange({ [FIELD_NAME]: null })
  })

  describe('emptyFieldValue config', () => {
    it('should emit undefined when toggling an optional object field off with emptyFieldValue: undefined', () => {
      mountObjectForm({
        data: { [FIELD_NAME]: { foo: 'bar' } },
        config: { emptyFieldValue: 'undefined' },
      })

      cy.getTestId(`ff-object-switch-${FIELD_NAME}`).click({ force: true })

      assertLastChange({ [FIELD_NAME]: undefined })
    })
  })
})
