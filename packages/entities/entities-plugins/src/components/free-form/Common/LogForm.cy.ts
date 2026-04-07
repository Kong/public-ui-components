import LogForm from './LogForm.vue'

describe('<LogForm />', () => {
  const mountLogForm = () => {
    cy.mount(LogForm as any, {
      props: {
        schema: {
          type: 'record',
          fields: [
            {
              config: {
                type: 'record',
                fields: [
                  {
                    custom_fields_by_lua: {
                      type: 'map',
                      keys: { type: 'string' },
                      values: { type: 'string' },
                    },
                  },
                ],
              },
            },
          ],
        },
        formSchema: {
          fields: [],
        },
        model: {
          config: {
            custom_fields_by_lua: {
              my_key: 'my_value',
            },
          },
        },
        formModel: {},
        isEditing: false,
        onFormChange: cy.spy().as('onFormChange'),
        pluginName: 'test-plugin',
      },
    })
  }

  it('should render config.custom_fields_by_lua value as textarea', () => {
    mountLogForm()

    // The value input for custom_fields_by_lua should be a textarea (multiline)
    cy.getTestId('ff-map-container-config.custom_fields_by_lua.0').should('exist')
    cy.getTestId('ff-map-container-config.custom_fields_by_lua.0').find('textarea').should('exist')
  })
})
