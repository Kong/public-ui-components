import Form from './Form.vue'
import type { FormSchema } from '../form-schema'
import type { FormConfig } from '../types'

const FIELD_NAME = 'enabled'

describe('BooleanField', () => {
  describe('version compatibility', () => {
    function mountVersionCompatibilityForm(options: { config?: FormConfig } = {}) {
      cy.mount(Form, {
        props: {
          schema: {
            type: 'record',
            fields: [{
              [FIELD_NAME]: {
                type: 'boolean',
                description: 'Enable this feature.',
                min_ai_gateway_version: '2.1',
              },
            }],
          } as FormSchema,
          data: { [FIELD_NAME]: true },
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
