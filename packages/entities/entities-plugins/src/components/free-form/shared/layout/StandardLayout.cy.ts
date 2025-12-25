import StandardLayout from './StandardLayout.vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'

describe('<StandardLayout />', () => {
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

  const mountStandardLayout = (overrides: {
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

    cy.mount(StandardLayout as any, mountOptions)
  }

  it('should render with minimal required props', () => {
    mountStandardLayout()

    cy.get('.ff-standard-layout').should('exist')

    // Verify both EntityFormBlock sections render
    cy.get('[data-testid="form-section-general-info"]').should('exist')
    cy.get('[data-testid="form-section-plugin-config"]').should('exist')

    // Verify scope radio group renders
    cy.get('.radio-group').should('exist')
    cy.get('.k-radio').should('have.length', 2)

    // Verify radio buttons are not disabled
    cy.get('.k-radio').each(($radio) => {
      cy.wrap($radio).should('not.have.attr', 'disabled')
    })
  })

  it('should disable scope selection when disabled flag is true', () => {
    // Provide FORMS_CONFIG to test tooltip message
    const pluginFormConfig = {
      entityType: 'services',
      app: 'konnect',
    }

    mountStandardLayout({
      formSchema: createFormSchema(true), // disabled = true
      provide: {
        [FORMS_CONFIG]: pluginFormConfig,
      },
    })

    // Verify component renders successfully
    cy.get('.ff-standard-layout').should('exist')

    // Verify disabled-scope class exists
    cy.get('.disabled-scope').should('exist')

    // Verify both radio buttons are disabled
    cy.get('.k-radio').should('have.length', 2)
    cy.get('.k-radio').each(($radio) => {
      cy.wrap($radio).find('input[type="radio"]').should('be.disabled')
    })

  })

  it('should initialize scope from formModel when creating new plugin', () => {
    const onFormChangeSpy = cy.spy().as('onFormChange')

    mountStandardLayout({
      formModel: {
        enabled: true,
        'service-id': 'test-service-123',
      },
      onFormChange: onFormChangeSpy,
    })

    // Verify component renders successfully
    cy.get('.ff-standard-layout').should('exist')

    // Verify onFormChange is called with service initialized from formModel
    cy.get('@onFormChange').should('have.been.called')
    cy.get('@onFormChange').then((spy) => {
      const call = (spy as any).getCall(0)
      expect(call.args[0]).to.have.property('service')
      expect(call.args[0].service).to.deep.equal({ id: 'test-service-123' })
    })
  })
})
