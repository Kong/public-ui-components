import Form from './Form.vue'
import type { FormSchema } from '../form-schema'
import type { FormConfig } from '../types'

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

  describe('version compatibility', () => {
    function mountVersionCompatibilityForm(options: { config?: FormConfig } = {}) {
      cy.mount(Form, {
        props: {
          schema: {
            type: 'record',
            fields: [{
              [FIELD_NAME]: {
                type: 'record',
                description: 'Legacy nested config.',
                min_ai_gateway_version: '2.1',
                fields: [{ foo: { type: 'string' } }],
              },
            }],
          } as FormSchema,
          data: { [FIELD_NAME]: { foo: 'bar' } },
          config: options.config,
        },
      })
    }

    it('disables the switch and collapse toggle, and force-collapses the content, when locked', () => {
      mountVersionCompatibilityForm({ config: { minRuntimeVersion: '2.0' } })

      cy.getTestId(`ff-object-switch-${FIELD_NAME}`).should('be.disabled')
      cy.getTestId(`ff-object-toggle-btn-${FIELD_NAME}`).should('be.disabled')
      cy.getTestId(`ff-object-content-${FIELD_NAME}`).should('not.exist')
      cy.getTestId(`ff-label-${FIELD_NAME}`)
        .should('contain.text', 'The minimum runtime version required to use this feature is 2.1')
    })

    it('leaves the switch, toggle and content usable when minRuntimeVersion satisfies the requirement', () => {
      mountVersionCompatibilityForm({ config: { minRuntimeVersion: '2.1' } })

      cy.getTestId(`ff-object-switch-${FIELD_NAME}`).should('not.be.disabled')
      cy.getTestId(`ff-object-toggle-btn-${FIELD_NAME}`).should('not.be.disabled')
      cy.getTestId(`ff-object-content-${FIELD_NAME}`).should('exist')
    })

    it('fails open when minRuntimeVersion is not provided', () => {
      mountVersionCompatibilityForm()

      cy.getTestId(`ff-object-switch-${FIELD_NAME}`).should('not.be.disabled')
      cy.getTestId(`ff-object-content-${FIELD_NAME}`).should('exist')
    })
  })
})
