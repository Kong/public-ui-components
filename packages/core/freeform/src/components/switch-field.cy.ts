import Form from './Form.vue'
import FieldRenderer from './FieldRenderer.vue'
import SwitchField from './SwitchField.vue'
import { FIELD_RENDERERS } from '../composables'
import type { FormSchema } from '../form-schema'
import type { FormConfig } from '../types'

const FIELD_NAME = 'debug_mode'

describe('SwitchField', () => {
  describe('version compatibility', () => {
    function mountVersionCompatibilityForm(options: { config?: FormConfig } = {}) {
      cy.mount(Form, {
        props: {
          schema: {
            type: 'record',
            fields: [{
              [FIELD_NAME]: {
                type: 'boolean',
                min_ai_gateway_version: '2.1',
              },
            }],
          } as FormSchema,
          data: { [FIELD_NAME]: true },
          config: options.config,
        },
        slots: {
          [FIELD_RENDERERS]: `
            <FieldRenderer
              v-slot="props"
              :match="({ path }) => path === '${FIELD_NAME}'"
            >
              <SwitchField v-bind="props" />
            </FieldRenderer>`,
        },
        global: {
          components: {
            SwitchField,
            FieldRenderer,
          },
        },
      })
    }

    it('disables the switch and sets its disabled tooltip when minRuntimeVersion is below the requirement', () => {
      mountVersionCompatibilityForm({ config: { minRuntimeVersion: '2.0' } })

      cy.getTestId(`ff-${FIELD_NAME}`).find('input[type="checkbox"]').should('be.disabled')
    })

    it('does not disable the switch when minRuntimeVersion satisfies the requirement', () => {
      mountVersionCompatibilityForm({ config: { minRuntimeVersion: '2.1' } })

      cy.getTestId(`ff-${FIELD_NAME}`).find('input[type="checkbox"]').should('not.be.disabled')
    })

    it('fails open (not disabled) when minRuntimeVersion is not provided', () => {
      mountVersionCompatibilityForm()

      cy.getTestId(`ff-${FIELD_NAME}`).find('input[type="checkbox"]').should('not.be.disabled')
    })
  })
})
