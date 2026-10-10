import Form from './Form.vue'
import StringArrayField from './StringArrayField.vue'
import type { FormSchema } from '../form-schema'
import type { FormConfig } from '../types'

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
  labelSlotTemplate?: string
}) {
  cy.mount(Form, {
    props: {
      schema: createTagSchema(),
      data: options.data,
      config: options.config,
      onChange: cy.spy().as('onChangeSpy'),
    },
    ...(options.labelSlotTemplate
      ? {
        slots: {
          default: `<StringArrayField name="${FIELD_NAME}"><template #label="{ label }">${options.labelSlotTemplate}</template></StringArrayField>`,
        },
        global: {
          components: { StringArrayField },
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

  describe('label slot', () => {
    it('should render consumer-provided label slot content with the label scoped prop', () => {
      mountTagForm({
        data: { [FIELD_NAME]: ['a', 'b'] },
        labelSlotTemplate: '<span data-testid="custom-label">Custom: {{ label }}</span>',
      })

      cy.getTestId(`ff-label-${FIELD_NAME}`)
        .find('[data-testid="custom-label"]')
        .should('have.text', 'Custom: Tags')
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
                type: 'set',
                elements: { type: 'string' },
                min_ai_gateway_version: '2.1',
              },
            }],
          } as FormSchema,
          data: { [FIELD_NAME]: ['a', 'b'] },
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
