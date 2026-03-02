import CommonForm from './CommonForm.vue'
import { FEATURE_FLAGS } from '../../../constants'

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

  describe('Condition field', () => {
    it('should not render condition field when formSchema does not include condition', () => {
      mountCommonForm()

      cy.getTestId('ff-condition').should('not.exist')
    })

    it('should render condition field when formSchema includes condition', () => {
      const formSchemaWithCondition = {
        ...createFormSchema(),
        fields: [
          ...createFormSchema().fields,
          {
            model: 'condition',
            type: 'input',
            inputType: 'text',
            label: 'Condition',
            help: 'An expression used for conditional control over plugin execution.',
            placeholder: 'Enter a condition expression',
          },
        ],
      }

      mountCommonForm({
        formSchema: formSchemaWithCondition,
      })

      cy.getTestId('ff-condition').should('exist')
    })
  })

  describe('Editor mode switcher', () => {
    beforeEach(() => {
      // Create the teleport target element for the editor mode switcher
      const el = document.createElement('div')
      el.id = 'plugin-form-page-actions'
      document.body.appendChild(el)
    })

    afterEach(() => {
      document.getElementById('plugin-form-page-actions')?.remove()
    })

    it('should not render editor mode switcher when KM_2262_CODE_MODE feature flag is not provided', () => {
      mountCommonForm()

      cy.getTestId('plugin-editor-mode-switcher').should('not.exist')
    })

    it('should render editor mode switcher when KM_2262_CODE_MODE feature flag is enabled', () => {
      mountCommonForm({
        provide: {
          [FEATURE_FLAGS.KM_2262_CODE_MODE]: true,
        },
      })

      cy.getTestId('plugin-editor-mode-switcher').should('exist')
    })

    it('should default to form mode and show form sections', () => {
      mountCommonForm({
        provide: {
          [FEATURE_FLAGS.KM_2262_CODE_MODE]: true,
        },
      })

      // Form sections should be visible
      cy.getTestId('form-section-plugin-scope').should('exist')
      cy.getTestId('form-section-plugin-config').should('exist')
      cy.getTestId('form-section-general-info').should('exist')

      // Code editor should not exist
      cy.getTestId('plugin-code-editor').should('not.exist')
    })

    it('should switch to code editor when clicking code mode option', () => {
      mountCommonForm({
        provide: {
          [FEATURE_FLAGS.KM_2262_CODE_MODE]: true,
        },
      })

      // Click the "Code editor" option in the segmented control
      cy.getTestId('plugin-editor-mode-switcher').contains('Code editor').click()

      // Code editor should now be visible
      cy.getTestId('plugin-code-editor').should('exist')

      // Form sections should not exist
      cy.getTestId('form-section-plugin-scope').should('not.exist')
      cy.getTestId('form-section-plugin-config').should('not.exist')
      cy.getTestId('form-section-general-info').should('not.exist')
    })

    it('should switch back to form mode from code mode', () => {
      mountCommonForm({
        provide: {
          [FEATURE_FLAGS.KM_2262_CODE_MODE]: true,
        },
      })

      // Switch to code mode
      cy.getTestId('plugin-editor-mode-switcher').contains('Code editor').click()
      cy.getTestId('plugin-code-editor').should('exist')

      // Switch back to form mode
      cy.getTestId('plugin-editor-mode-switcher').contains('Visual editor').click()

      // Form sections should be visible again
      cy.getTestId('form-section-plugin-scope').should('exist')
      cy.getTestId('form-section-plugin-config').should('exist')
      cy.getTestId('form-section-general-info').should('exist')

      // Code editor should not exist
      cy.getTestId('plugin-code-editor').should('not.exist')
    })
  })
})
