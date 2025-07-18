import { assertFormRendering } from './utils'
import { buildMockingSchema } from '../../../../fixtures/schemas/free-form-mocking'
import Form from '../shared/Form.vue'
import type { FormSchema } from 'src/types/plugins/form-schema'
import StringField from '../shared/StringField.vue'
import FieldRenderer from '../shared/FieldRenderer.vue'
import { FIELD_RENDERERS } from '../shared/composables'

describe('Free Form', () => {
  it('Auto render', () => {
    const schema = buildMockingSchema()

    cy.mount(Form, {
      props: { schema },
    })

    assertFormRendering(schema)
  })

  describe('Rendering overrides', () => {
    it('should override a field by named slot', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            custom_field: {
              type: 'string',
            },
          },
        ],
      }

      cy.mount(Form, {
        props: {
          schema,
        },
        slots: {
          'custom_field': '<div class="custom-field" data-testid="my-custom-field">Custom Field</div>',
        },
      })

      cy.getTestId('ff-field-custom_field').should('not.exist')
      cy.getTestId('my-custom-field').should('exist')
    })

    it('should override a field by field name in default slot', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            custom_field: {
              type: 'string',
            },
          },
        ],
      }

      cy.mount(Form, {
        props: {
          schema,
        },
        slots: {
          'default': '<StringField name="custom_field" label="My Field" />',
        },
        global: {
          components: {
            StringField,
          },
        },
      })

      cy.getTestId('ff-label-custom_field')
        .should('exist')
        .should('contain', 'My Field')
    })

    it('should override fields by matching', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            a_by_lua: {
              type: 'string',
            },
          },
          {
            b_by_lua: {
              type: 'string',
            },
          },
          {
            c: {
              type: 'string',
            },
          },
        ],
      }

      cy.mount(Form, {
        props: {
          schema,
        },
        slots: {
          [FIELD_RENDERERS]: `
            <FieldRenderer
              v-slot="props"
              :match="({ path }) => path.endsWith('by_lua')"
            >
              <StringField
                v-bind="props"
                autosize
                multiline
              />
            </FieldRenderer>`,
        },
        global: {
          components: {
            StringField,
            FieldRenderer,
          },
        },
      })

      cy.get('textarea[data-testid="ff-a_by_lua"]').should('exist')
      cy.get('textarea[data-testid="ff-b_by_lua"]').should('exist')
      cy.get('input[data-testid="ff-c"]').should('exist')
    })
  })

  describe('Data binding', () => {
    // todo
  })

})
