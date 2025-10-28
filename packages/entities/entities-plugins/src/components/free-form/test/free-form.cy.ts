import { assertFormRendering } from './utils'
import { buildMockingSchema } from '../../../../fixtures/schemas/free-form-mocking'
import Form from '../shared/Form.vue'
import type { FormSchema } from 'src/types/plugins/form-schema'
import StringField from '../shared/StringField.vue'
import FieldRenderer from '../shared/FieldRenderer.vue'
import { FIELD_RENDERERS } from '../shared/composables'
import { ref } from 'vue'

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

  describe('Reactivity', () => {
    function getSchema(defaultName?: string) : FormSchema {
      return {
        type: 'record',
        fields: [
          {
            name: {
              type: 'string',
              default: defaultName,
            },
          },
        ],
      }
    }

    it('should call onChange with default value when initialized', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')

      cy.mount(Form, {
        props: {
          schema: getSchema('Default Name'),
          onChange: onChangeSpy,
        },
      })
      cy.get('@onChangeSpy')
        .should('have.been.calledOnce')
        .should('have.been.calledWith', { name: 'Default Name' })
    })

    it('should call onChange with initial value when initialized', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')
      const initialData = { name: 'Initial Name' }

      cy.mount(Form, {
        props: {
          schema: getSchema(),
          onChange: onChangeSpy,
          data: initialData,
        },
      })
      cy.get('@onChangeSpy')
        .should('have.been.calledOnce')
        .should('have.been.calledWith', initialData)
    })

    it('should call onChange when data changes', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')

      cy.mount(Form, {
        props: {
          schema: getSchema(),
          onChange: onChangeSpy,
        },
      })

      cy.get('@onChangeSpy')
        .should('have.been.calledOnce')
        .should('have.been.calledWith', { name: null })

      cy.getTestId('ff-name').type('n')
      cy.get('@onChangeSpy')
        .should('have.been.calledTwice')
        .should('have.been.calledWith', { name: 'n' })
    })

    it('should update form when data prop changes', () => {
      const onChangeSpy = cy.spy().as('onChangeSpy')

      const data = ref({ name: 'Initial Name' })
      const newData = { name: 'New Name' }

      cy.mount(Form, {
        props: {
          schema: getSchema(),
          data,
          onChange: onChangeSpy,
        },
      })

      cy.getTestId('ff-name').should('have.value', 'Initial Name')
      cy.get('@onChangeSpy')
        .should('have.been.calledOnce')
        .should('have.been.calledWith', data.value)

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(0).then(() => { // wait for next tick
        data.value = newData
        cy.getTestId('ff-name').should('have.value', 'New Name')
        cy.get('@onChangeSpy')
          .should('have.been.calledTwice')
          .should('have.been.calledWith', newData)
      })
    })

    it('should call `prepareFormData` on initial data', () => {
      const prepareFormData = cy.spy(() => {
        return {
          name: 'New Name from prepareFormData',
        }
      }).as('prepareFormDataSpy')

      cy.mount(Form, {
        props: {
          schema: getSchema(),
          config: { prepareFormData },
        },
      })

      cy.getTestId('ff-name').should('have.value', 'New Name from prepareFormData')
      cy.get('@prepareFormDataSpy').should('have.been.calledOnce')
    })

    it('should call `hasValue` on initial changes', () => {
      const hasValue = cy.spy(() => false).as('hasValueSpy')

      cy.mount(Form, {
        props: {
          schema: getSchema(),
          data: { name: 'Some Name' },
          config: { hasValue },
        },
      })

      cy.get('@hasValueSpy')
        .should('have.been.calledOnce')
        .should('have.been.calledWith', { name: 'Some Name' })
    })

    /**
     * todo:
     * for every type of field, test that:
     * - initialize with default value
     * - initialize with initial value
     * - empty value
     * - active update by user operation
     * - passive update by external data prop change
     */
  })

})
