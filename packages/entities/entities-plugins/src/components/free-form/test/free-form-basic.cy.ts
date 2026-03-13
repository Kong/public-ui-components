import { assertFormRendering } from './utils'
import { buildMockingSchema } from '../../../../fixtures/schemas/free-form-mocking'
import Form from '../shared/Form.vue'
import type { FormSchema } from 'src/types/plugins/form-schema'
import StringField from '../shared/StringField.vue'
import FieldRenderer from '../shared/FieldRenderer.vue'
import { FIELD_RENDERERS } from '../shared/composables'
import { ref, h } from 'vue'

describe('Free Form', () => {
  it('Auto render', () => {
    const schema = buildMockingSchema()

    cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

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

    describe('KeyValueField', () => {
      it('should initialize with null value', () => {
        cy.mount(Form, {
          props: {
            schema: {
              type: 'record',
              fields: [{
                kv: { type: 'map', keys: { type: 'string' }, values: { type: 'string' } },
              }],
            } as FormSchema,
            onChange: cy.spy().as('onChangeSpy'),
          },
        })

        cy.get('@onChangeSpy')
          .should('have.been.calledOnce')
          .should('have.been.calledWith', { kv: null })
      })

      it('should initialize with {} when required is true', () => {
        cy.mount(Form, {
          props: {
            schema: {
              type: 'record',
              fields: [{
                kv: { type: 'map', keys: { type: 'string' }, values: { type: 'string' }, required: true },
              }],
            } as FormSchema,
            onChange: cy.spy().as('onChangeSpy'),
          },
        })

        cy.get('@onChangeSpy')
          .should('have.been.calledOnce')
          .should('have.been.calledWith', { kv: {} })
      })

      it('should initialize with default value', () => {
        cy.mount(Form, {
          props: {
            schema: {
              type: 'record',
              fields: [{
                kv: { type: 'map', keys: { type: 'string' }, values: { type: 'string' }, default: { key1: 'value1' } },
              }],
            } as FormSchema,
            onChange: cy.spy().as('onChangeSpy'),
          },
        })

        cy.get('@onChangeSpy')
          .should('have.been.calledOnce')
          .should('have.been.calledWith', { kv: { key1: 'value1' } })
      })

      it('should initialize with {} when default value is {}', () => {
        cy.mount(Form, {
          props: {
            schema: {
              type: 'record',
              fields: [{
                kv: { type: 'map', keys: { type: 'string' }, values: { type: 'string' }, default: {} },
              }],
            } as FormSchema,
            onChange: cy.spy().as('onChangeSpy'),
          },
        })

        cy.get('@onChangeSpy')
          .should('have.been.calledOnce')
          .should('have.been.calledWith', { kv: {} })
      })
    })

    // describe('KeyValueField with non-string values', () => {
    //   it('should render NumberField for integer map values', () => {
    //     cy.mount(Form, {
    //       props: {
    //         schema: {
    //           type: 'record',
    //           fields: [{
    //             limits: { type: 'map', keys: { type: 'string' }, values: { type: 'integer' } },
    //           }],
    //         } as FormSchema,
    //         data: { limits: { max_connections: 100 } },
    //         onChange: cy.spy().as('onChangeSpy'),
    //       },
    //     })

    //     // Should render the KV field
    //     cy.getTestId('ff-kv-limits').should('exist')
    //     // Should have the key input with the key value
    //     cy.getTestId('ff-key-limits.0').find('input').should('have.value', 'max_connections')
    //     // Should have a number input for the value (rendered by Field -> NumberField)
    //     cy.getTestId('ff-field-limits.max_connections').should('exist')
    //   })

    //   it('should render BooleanField for boolean map values', () => {
    //     cy.mount(Form, {
    //       props: {
    //         schema: {
    //           type: 'record',
    //           fields: [{
    //             flags: { type: 'map', keys: { type: 'string' }, values: { type: 'boolean' } },
    //           }],
    //         } as FormSchema,
    //         data: { flags: { enabled: true } },
    //         onChange: cy.spy().as('onChangeSpy'),
    //       },
    //     })

    //     cy.getTestId('ff-kv-flags').should('exist')
    //     cy.getTestId('ff-key-flags.0').find('input').should('have.value', 'enabled')
    //     cy.getTestId('ff-field-flags.enabled').should('exist')
    //   })

    //   it('should render ObjectField with vertical layout for record map values', () => {
    //     cy.mount(Form, {
    //       props: {
    //         schema: {
    //           type: 'record',
    //           fields: [{
    //             endpoints: {
    //               type: 'map',
    //               keys: { type: 'string' },
    //               values: {
    //                 type: 'record',
    //                 fields: [
    //                   { host: { type: 'string' } },
    //                   { port: { type: 'integer' } },
    //                 ],
    //               },
    //             },
    //           }],
    //         } as FormSchema,
    //         data: { endpoints: { api: { host: 'localhost', port: 8080 } } },
    //         onChange: cy.spy().as('onChangeSpy'),
    //       },
    //     })

    //     cy.getTestId('ff-kv-endpoints').should('exist')
    //     // Vertical layout should be applied
    //     cy.get('.ff-kv-field-entry--vertical').should('exist')
    //     // Nested record fields should render
    //     cy.getTestId('ff-key-endpoints.0').find('input').should('have.value', 'api')
    //   })

    //   it('should show placeholder when key is empty for non-string values', () => {
    //     cy.mount(Form, {
    //       props: {
    //         schema: {
    //           type: 'record',
    //           fields: [{
    //             limits: { type: 'map', keys: { type: 'string' }, values: { type: 'integer' } },
    //           }],
    //         } as FormSchema,
    //         onChange: cy.spy().as('onChangeSpy'),
    //       },
    //     })

    //     // Add an entry
    //     cy.getTestId('ff-kv-add-btn-limits').click()
    //     // Key is empty, so the Field should not render — placeholder should show
    //     cy.getTestId('ff-kv-placeholder-limits.0').should('exist')
    //   })

    //   it('should initialize string map values identically to before (regression)', () => {
    //     cy.mount(Form, {
    //       props: {
    //         schema: {
    //           type: 'record',
    //           fields: [{
    //             headers: { type: 'map', keys: { type: 'string' }, values: { type: 'string' } },
    //           }],
    //         } as FormSchema,
    //         data: { headers: { 'x-api-key': 'secret' } },
    //         onChange: cy.spy().as('onChangeSpy'),
    //       },
    //     })

    //     cy.getTestId('ff-kv-headers').should('exist')
    //     cy.getTestId('ff-key-headers.0').find('input').should('have.value', 'x-api-key')
    //     cy.getTestId('ff-value-headers.0').find('input').should('have.value', 'secret')
    //   })
    // })

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
