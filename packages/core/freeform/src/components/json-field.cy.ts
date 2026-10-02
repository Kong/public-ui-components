import Form from './Form.vue'
import JsonField from './JsonField.vue'
import type { FormSchema } from '../form-schema'
import type { FormConfig } from '../types'

const FIELD_NAME = 'payload'

function createJsonSchema(options: {
  required?: boolean
} = {}): FormSchema {
  return {
    type: 'record',
    fields: [{
      [FIELD_NAME]: {
        type: 'json',
        json_schema: {},
        ...(options.required ? { required: true } : {}),
      },
    }],
  } as FormSchema
}

function mountJsonForm(options: {
  schema?: FormSchema
  data?: Record<string, unknown>
  config?: FormConfig
  labelSlotTemplate?: string
}) {
  cy.mount(Form, {
    props: {
      schema: options.schema ?? createJsonSchema(),
      data: options.data,
      config: options.config,
      onChange: cy.spy().as('onChangeSpy'),
    },
    ...(options.labelSlotTemplate
      ? {
        slots: {
          default: `<JsonField name="${FIELD_NAME}"><template #label="{ label }">${options.labelSlotTemplate}</template></JsonField>`,
        },
        global: {
          components: { JsonField },
        },
      }
      : {}),
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

  describe('label slot', () => {
    it('should render consumer-provided label slot content with the label scoped prop', () => {
      mountJsonForm({
        data: { [FIELD_NAME]: 'raw text' },
        labelSlotTemplate: '<span data-testid="custom-label">Custom: {{ label }}</span>',
      })

      cy.getTestId(`ff-label-${FIELD_NAME}`)
        .find('[data-testid="custom-label"]')
        .should('have.text', 'Custom: Payload')
    })
  })

  describe('version compatibility', () => {
    function mountVersionCompatibilityForm(options: { config?: FormConfig } = {}) {
      cy.mount(Form, {
        props: {
          schema: {
            type: 'record',
            fields: [{
              [FIELD_NAME]: {
                type: 'json',
                json_schema: {},
                min_ai_gateway_version: '2.1',
              },
            }],
          } as FormSchema,
          data: { [FIELD_NAME]: 'raw text' },
          config: options.config,
        },
      })
    }

    it('disables the field and shows a version tooltip when minRuntimeVersion is below the requirement', () => {
      mountVersionCompatibilityForm({ config: { minRuntimeVersion: '2.0' } })

      cy.getTestId(`ff-${FIELD_NAME}`).should('be.disabled')
      cy.getTestId(`ff-label-${FIELD_NAME}`)
        .should('contain.text', 'The minimum runtime version required to use this feature is 2.1')
    })

    it('does not disable the field when minRuntimeVersion satisfies the requirement', () => {
      mountVersionCompatibilityForm({ config: { minRuntimeVersion: '2.1' } })

      cy.getTestId(`ff-${FIELD_NAME}`).should('not.be.disabled')
    })

    it('fails open (not disabled) when minRuntimeVersion is not provided', () => {
      mountVersionCompatibilityForm()

      cy.getTestId(`ff-${FIELD_NAME}`).should('not.be.disabled')
    })
  })
})
