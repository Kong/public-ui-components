import { h } from 'vue'
import Form from './Form.vue'
import ArrayField from './ArrayField.vue'
import type { FormSchema } from '../form-schema'
import type { FormConfig } from '../types'

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
  requiredOverride?: boolean
  config?: FormConfig
}) {
  const props = {
    schema: options.schema ?? createArraySchema(),
    data: options.data,
    config: options.config,
    onChange: cy.spy().as('onChangeSpy'),
  }

  if (options.requiredOverride) {
    cy.mount(() => h(Form, props, {
      default: () => h(ArrayField, { name: FIELD_NAME, required: true }),
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

  it('should emit [] when removing the last item from an array marked required via prop override', () => {
    mountArrayForm({
      data: { [FIELD_NAME]: ['alpha'] },
      requiredOverride: true,
    })

    cy.getTestId(`ff-array-remove-item-btn-${FIELD_NAME}.0`).click()

    assertLastChange({ [FIELD_NAME]: [] })
  })

  describe('emptyFieldValue config', () => {
    it('should emit undefined when removing last item from optional array with emptyFieldValue: undefined', () => {
      mountArrayForm({
        data: { [FIELD_NAME]: ['alpha'] },
        config: { emptyFieldValue: 'undefined' },
      })

      cy.getTestId(`ff-array-remove-item-btn-${FIELD_NAME}.0`).click()

      assertLastChange({ [FIELD_NAME]: undefined })
    })

    it('should still emit [] when removing last item from required array with emptyFieldValue: undefined', () => {
      mountArrayForm({
        schema: createArraySchema({ required: true }),
        data: { [FIELD_NAME]: ['alpha'] },
        config: { emptyFieldValue: 'undefined' },
      })

      cy.getTestId(`ff-array-remove-item-btn-${FIELD_NAME}.0`).click()

      assertLastChange({ [FIELD_NAME]: [] })
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
                type: 'array',
                description: 'Custom upstream hosts.',
                min_ai_gateway_version: '2.1',
                elements: { type: 'string' },
              },
            }],
          } as FormSchema,
          data: { [FIELD_NAME]: ['alpha'] },
          config: options.config,
        },
      })
    }

    it('disables add/remove buttons and cascades disabling down to existing items when locked', () => {
      mountVersionCompatibilityForm({ config: { minRuntimeVersion: '2.0' } })

      cy.getTestId(`ff-add-item-btn-${FIELD_NAME}`).should('be.disabled')
      cy.getTestId(`ff-array-remove-item-btn-${FIELD_NAME}.0`).should('be.disabled')
      // The item's own field has no `min_ai_gateway_version` of its own — it
      // inherits the lock from its array ancestor.
      cy.getTestId(`ff-${FIELD_NAME}.0`).should('be.disabled')
      cy.getTestId(`ff-label-${FIELD_NAME}`)
        .should('contain.text', 'The minimum runtime version required to use this feature is 2.1')
    })

    it('leaves add/remove buttons and items usable when minRuntimeVersion satisfies the requirement', () => {
      mountVersionCompatibilityForm({ config: { minRuntimeVersion: '2.1' } })

      cy.getTestId(`ff-add-item-btn-${FIELD_NAME}`).should('not.be.disabled')
      cy.getTestId(`ff-array-remove-item-btn-${FIELD_NAME}.0`).should('not.be.disabled')
      cy.getTestId(`ff-${FIELD_NAME}.0`).should('not.be.disabled')
    })

    it('fails open when minRuntimeVersion is not provided', () => {
      mountVersionCompatibilityForm()

      cy.getTestId(`ff-add-item-btn-${FIELD_NAME}`).should('not.be.disabled')
      cy.getTestId(`ff-${FIELD_NAME}.0`).should('not.be.disabled')
    })
  })
})
