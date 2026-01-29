import StandardLayout from './StandardLayout.vue'

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
    renderRules?: any
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
      renderRules,
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
        renderRules,
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

    // Verify all sections render
    cy.get('[data-testid="form-section-plugin-scope"]').should('exist')
    cy.get('[data-testid="form-section-plugin-config"]').should('exist')
    cy.get('[data-testid="form-section-general-info"]').should('exist')

    // Verify scope radio group renders
    cy.get('.radio-group').should('exist')
    cy.get('.k-radio').should('have.length', 2)

    // Verify radio buttons are not disabled
    cy.get('.k-radio').each(($radio) => {
      cy.wrap($radio).should('not.have.attr', 'disabled')
    })
  })

  it('should disable scope selection when disabled flag is true', () => {
    mountStandardLayout({
      formSchema: createFormSchema(true), // disabled = true
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

  describe('fieldOverrides', () => {
    describe('StringFieldOverride', () => {
      it('should render a string field as textarea when multiline is true', () => {
        const schema = {
          type: 'record',
          fields: [
            {
              config: {
                type: 'record',
                fields: [
                  { body_template: { type: 'string' } },
                  { other_field: { type: 'string' } },
                ],
              },
            },
          ],
        }

        mountStandardLayout({
          schema,
          model: { enabled: true, config: {} },
          renderRules: {
            fieldOverrides: {
              'config.body_template': { multiline: true },
            },
          },
        })

        cy.getTestId('ff-object-switch-config').check({ force: true })

        // Verify body_template is rendered as textarea
        cy.getTestId('ff-config.body_template').find('textarea').should('exist')

        // Verify other_field is rendered as regular input
        cy.getTestId('ff-config.other_field').find('input').should('exist')
        cy.getTestId('ff-config.other_field').find('textarea').should('not.exist')
      })

      it('should apply rows prop to textarea', () => {
        const schema = {
          type: 'record',
          fields: [
            {
              config: {
                type: 'record',
                fields: [
                  { body_template: { type: 'string' } },
                ],
              },
            },
          ],
        }

        mountStandardLayout({
          schema,
          model: { enabled: true, config: {} },
          renderRules: {
            fieldOverrides: {
              'config.body_template': { multiline: true, rows: 6 },
            },
          },
        })

        cy.getTestId('ff-object-switch-config').check({ force: true })
        cy.getTestId('ff-config.body_template').find('textarea').should('have.attr', 'rows', '6')
      })

      it('should apply placeholder override', () => {
        const schema = {
          type: 'record',
          fields: [
            {
              config: {
                type: 'record',
                fields: [
                  { api_key: { type: 'string' } },
                ],
              },
            },
          ],
        }

        mountStandardLayout({
          schema,
          model: { enabled: true, config: {} },
          renderRules: {
            fieldOverrides: {
              'config.api_key': { placeholder: 'Enter your API key here' },
            },
          },
        })

        cy.getTestId('ff-object-switch-config').check({ force: true })
        cy.getTestId('ff-config.api_key').find('input').should('have.attr', 'placeholder', 'Enter your API key here')
      })

      it('should render password field with mask toggle when showPasswordMaskToggle is true', () => {
        const schema = {
          type: 'record',
          fields: [
            {
              config: {
                type: 'record',
                fields: [
                  { secret_key: { type: 'string' } },
                ],
              },
            },
          ],
        }

        mountStandardLayout({
          schema,
          model: { enabled: true, config: {} },
          renderRules: {
            fieldOverrides: {
              'config.secret_key': { showPasswordMaskToggle: true },
            },
          },
        })

        cy.getTestId('ff-object-switch-config').check({ force: true })
        // Password field should have type="password"
        cy.getTestId('ff-config.secret_key').find('input').should('have.attr', 'type', 'password')
        // Should have a visibility toggle button
        cy.getTestId('ff-config.secret_key').find('button').should('exist')
      })
    })

    describe('multiple fieldOverrides', () => {
      it('should apply multiple overrides to different fields', () => {
        const schema = {
          type: 'record',
          fields: [
            {
              config: {
                type: 'record',
                fields: [
                  { template: { type: 'string' } },
                  { description: { type: 'string' } },
                  { api_key: { type: 'string' } },
                ],
              },
            },
          ],
        }

        mountStandardLayout({
          schema,
          model: { enabled: true, config: {} },
          renderRules: {
            fieldOverrides: {
              'config.template': { multiline: true, rows: 4 },
              'config.description': { multiline: true, rows: 2 },
              'config.api_key': { placeholder: 'Your API key' },
            },
          },
        })

        cy.getTestId('ff-object-switch-config').check({ force: true })

        // Verify template is textarea with rows=4
        cy.getTestId('ff-config.template').find('textarea').should('have.attr', 'rows', '4')

        // Verify description is textarea with rows=2
        cy.getTestId('ff-config.description').find('textarea').should('have.attr', 'rows', '2')

        // Verify api_key is input with placeholder
        cy.getTestId('ff-config.api_key').find('input').should('have.attr', 'placeholder', 'Your API key')
      })
    })

    describe('fieldOverrides combined with other renderRules', () => {
      it('should work alongside bundles and dependencies', () => {
        const schema = {
          type: 'record',
          fields: [
            {
              config: {
                type: 'record',
                fields: [
                  { strategy: { type: 'string' } },
                  { redis_host: { type: 'string' } },
                  { template: { type: 'string' } },
                ],
              },
            },
          ],
        }

        mountStandardLayout({
          schema,
          model: { enabled: true, config: {} },
          renderRules: {
            bundles: [
              ['config.strategy', 'config.redis_host'],
            ],
            dependencies: {
              'config.redis_host': ['config.strategy', 'redis'],
            },
            fieldOverrides: {
              'config.template': { multiline: true, rows: 5 },
            },
          },
        })

        cy.getTestId('ff-object-switch-config').check({ force: true })

        // Verify template is rendered as textarea despite other rules
        cy.getTestId('ff-config.template').find('textarea').should('have.attr', 'rows', '5')

        // Verify redis_host is hidden (dependency not met)
        cy.getTestId('ff-config.redis_host').should('not.be.visible')

        // Set strategy to 'redis' to show redis_host
        cy.getTestId('ff-config.strategy').type('redis')
        cy.getTestId('ff-config.redis_host').should('be.visible')
      })
    })
  })
})
