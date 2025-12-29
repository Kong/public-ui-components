import CommonForm from './CommonForm.vue'

describe('<CommonForm />', () => {
  const createBaseSchema = () => ({
    type: 'record',
    fields: [
      {
        config: {
          type: 'record',
          fields: [],
        },
      },
    ],
  })

  const createFormSchema = (disabled = false) => ({
    fields: [
      {
        model: 'enabled',
        type: 'switch',
        default: true,
      },
      {
        type: 'selectionGroup',
        disabled,
        fields: [
          {
            label: 'Global',
            description: 'Plugin will apply to all requests',
          },
          {
            label: 'Scoped',
            description: 'Specific Services, Routes, Consumers, and/or Consumer Groups',
            fields: [
              {
                model: 'service-id',
                label: 'Service',
                placeholder: 'Select a Service',
                type: 'AutoSuggest',
                entity: 'services',
                labelField: 'name',
                inputValues: {
                  fields: ['name', 'id'],
                },
                help: 'The service this plugin will target',
              },
              {
                model: 'route-id',
                label: 'Route',
                placeholder: 'Select a Route',
                type: 'AutoSuggest',
                entity: 'routes',
                labelField: 'name',
                inputValues: {
                  fields: ['name', 'id'],
                },
                help: 'The route this plugin will target',
              },
            ],
          },
        ],
      },
    ],
  })

  const createBaseModel = () => ({
    enabled: true,
    config: {},
  })

  const mountCommonForm = (overrides: {
    schema?: any
    formSchema?: any
    model?: any
    formModel?: any
    formOptions?: any
    isEditing?: boolean
    onFormChange?: any
    provide?: any
  } = {}) => {
    const {
      schema = createBaseSchema(),
      formSchema = createFormSchema(),
      model = createBaseModel(),
      formModel = { enabled: true },
      formOptions = {},
      isEditing = false,
      onFormChange = cy.spy().as('onFormChange'),
      provide,
    } = overrides

    const mountOptions: any = {
      props: {
        schema,
        formSchema,
        model,
        formModel,
        formOptions,
        isEditing,
        onModelUpdated: cy.spy().as('onModelUpdated'),
        onFormChange,
        pluginName: 'test-plugin',
      },
    }

    if (provide) {
      mountOptions.global = { provide }
    }

    cy.mount(CommonForm as any, mountOptions)
  }

  it('Advanced fields should be visible when it has content', () => {
    mountCommonForm({
      schema: {
        type: 'record',
        fields: [
          {
            config: {
              type: 'record',
              fields: [
                {
                  foo: {
                    type: 'string',
                    required: true,
                  },
                },
                {
                  bar: {
                    type: 'string',
                  },
                },
              ],
            },
          },
        ],
      },
    })

    cy.getTestId('ff-advanced-fields-container').should('exist').should('be.visible')
  })

  it('Advanced fields should be hidden when it is empty', () => {
    mountCommonForm({
      schema: {
        type: 'record',
        fields: [
          {
            config: {
              type: 'record',
              fields: [
                {
                  foo: {
                    type: 'string',
                    required: true,
                  },
                },
              ],
            },
          },
        ],
      },
    })

    cy.getTestId('ff-advanced-fields-container').should('exist').should('not.be.visible')
  })
})
