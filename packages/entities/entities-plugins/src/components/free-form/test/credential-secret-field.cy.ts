import { h } from 'vue'
import Form from '../shared/Form.vue'
import CredentialSecretField from '../shared/CredentialSecretField.vue'
import type { FormSchema } from 'src/types/plugins/form-schema'
import type { FormConfig } from '../shared/types'

const FIELD_NAME = 'secret'

function createSecretSchema(options: {
  required?: boolean
} = {}): FormSchema {
  return {
    type: 'record',
    fields: [{
      [FIELD_NAME]: {
        type: 'string',
        ...(options.required ? { required: true } : {}),
      },
    }],
  }
}

function mountSecretForm(options: {
  schema?: FormSchema
  data?: Record<string, unknown>
  config?: FormConfig
}) {
  const props = {
    schema: options.schema ?? createSecretSchema(),
    data: options.data,
    config: options.config,
    onChange: cy.spy().as('onChangeSpy'),
  }

  cy.mount(() => h(Form, props, {
    default: () => h(CredentialSecretField, { name: FIELD_NAME }),
  }))
}

function assertLastChange(expected: Record<string, unknown>) {
  cy.get('@onChangeSpy').should((spy: any) => {
    expect(spy.lastCall?.args[0]).to.deep.equal(expected)
  })
}

// `ff-<path>` lands on SensitiveInput's outer wrapper div (it has no
// `inheritAttrs: false`); the actual input carries a fixed `sensitive-input`
// testid instead, so it must be looked up scoped within the wrapper.
function getSecretInput() {
  return cy.getTestId(`ff-${FIELD_NAME}`).find('[data-testid="sensitive-input"]')
}

describe('CredentialSecretField', () => {
  it('should emit null when clearing an optional field (default behavior)', () => {
    mountSecretForm({
      data: { [FIELD_NAME]: 'sekret' },
    })

    getSecretInput().clear()

    assertLastChange({ [FIELD_NAME]: null })
  })

  describe('emptyFieldValue config', () => {
    it('should emit null when clearing an optional field with emptyFieldValue: null', () => {
      mountSecretForm({
        data: { [FIELD_NAME]: 'sekret' },
        config: { emptyFieldValue: 'null' },
      })

      getSecretInput().clear()

      assertLastChange({ [FIELD_NAME]: null })
    })

    it('should emit undefined when clearing an optional field with emptyFieldValue: undefined', () => {
      mountSecretForm({
        data: { [FIELD_NAME]: 'sekret' },
        config: { emptyFieldValue: 'undefined' },
      })

      getSecretInput().clear()

      assertLastChange({ [FIELD_NAME]: undefined })
    })
  })
})
