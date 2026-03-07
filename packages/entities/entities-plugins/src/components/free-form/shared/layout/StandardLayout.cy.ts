import StandardLayout from './StandardLayout.vue'
import { FREE_FORM_SCHEMA_MAP_KEY } from '../../../../constants'

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
    isEditing?: boolean
    onFormChange?: any
    provide?: any
  } = {}) => {
    const {
      schema = createBaseSchema(),
      formSchema = createFormSchema(),
      model = createBaseModel(),
      formModel = { enabled: true },
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
        isEditing,
        onFormChange,
        pluginName: 'test-plugin',
      },
    }

    if (provide) {
      mountOptions.global = { provide }
    }

    return cy.mount(StandardLayout as any, mountOptions)
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
        'route-id': 'test-route-456',
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
      expect(call.args[0]).to.have.property('route')
      expect(call.args[0].route).to.deep.equal({ id: 'test-route-456' })
    })
  })

  describe('Scope entity integration', () => {
    it('should map AutoSuggest scope fields to freeform foreign fields', () => {
      mountStandardLayout()

      cy.get('[data-testid="ff-standard-layout-form"]')
        .invoke('attr', 'data-instance-id')
        .then((instanceId) => {
          cy.window().then((win) => {
            const map = (win as any)[FREE_FORM_SCHEMA_MAP_KEY]
            const freeFormSchema = map[instanceId as string]

            const serviceField = freeFormSchema.fields.find((item: any) => item.service)?.service
            const routeField = freeFormSchema.fields.find((item: any) => item.route)?.route

            expect(serviceField.type).to.equal('foreign')
            expect(serviceField.reference).to.equal('services')
            expect(routeField.type).to.equal('foreign')
            expect(routeField.reference).to.equal('routes')
          })
        })
    })

    it('should clear and restore cached scope ids when toggling scoped mode', () => {
      const onFormChangeSpy = cy.spy().as('onFormChange')

      mountStandardLayout({
        isEditing: true,
        model: {
          ...createBaseModel(),
          service: { id: 'svc-1' },
          route: { id: 'rt-1' },
        },
        onFormChange: onFormChangeSpy,
      })

      cy.contains('.k-radio', 'Global').click()

      cy.get('@onFormChange').its('lastCall.args.0').should((payload: any) => {
        expect(payload.service).to.equal(null)
        expect(payload.route).to.equal(null)
      })

      cy.contains('.k-radio', 'Scoped').click()

      cy.get('@onFormChange').its('lastCall.args.0').should((payload: any) => {
        expect(payload.service).to.deep.equal({ id: 'svc-1' })
        expect(payload.route).to.deep.equal({ id: 'rt-1' })
      })
    })
  })

  it('should show form sections and hide code editor when editorMode is form (default)', () => {
    mountStandardLayout()

    cy.get('.ff-standard-layout').should('exist')

    // Form mode sections should be visible
    cy.getTestId('form-section-plugin-scope').should('exist')
    cy.getTestId('form-section-plugin-config').should('exist')
    cy.getTestId('form-section-general-info').should('exist')

    // Code editor section should not exist
    cy.get('.plugin-code-editor').should('not.exist')
  })

  it('should show code editor and hide form sections when editorMode is code', () => {
    cy.mount(StandardLayout as any, {
      props: {
        schema: createBaseSchema(),
        formSchema: createFormSchema(),
        model: createBaseModel(),
        formModel: { enabled: true },
        isEditing: false,
        onFormChange: cy.spy(),
        pluginName: 'test-plugin',
        editorMode: 'code',
      },
    })

    cy.get('.ff-standard-layout').should('exist')

    // Form mode sections should not exist
    cy.getTestId('form-section-plugin-scope').should('not.exist')
    cy.getTestId('form-section-plugin-config').should('not.exist')
    cy.getTestId('form-section-general-info').should('not.exist')

    // Code editor section should exist
    cy.get('.plugin-code-editor').should('exist')
  })

  describe('Condition field', () => {
    it('should not render condition field when formSchema does not include condition', () => {
      mountStandardLayout()

      cy.get('.ff-standard-layout').should('exist')
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

      mountStandardLayout({
        formSchema: formSchemaWithCondition,
      })

      cy.get('.ff-standard-layout').should('exist')
      cy.getTestId('ff-condition').should('exist')
    })
  })

  describe('SwitchField (enabled toggle)', () => {
    it('should render enabled toggle in general info section', () => {
      mountStandardLayout()

      cy.get('.ff-standard-layout').should('exist')
      cy.getTestId('form-section-general-info').should('exist')

      cy.getTestId('ff-enabled').should('exist')

      cy.getTestId('ff-enabled').find('.k-input-switch').should('exist')
    })

    it('should display enabled text when switch is on', () => {
      mountStandardLayout()

      cy.getTestId('ff-enabled').should('contain.text', 'Enabled')
    })

    it('should toggle the switch and emit form change', () => {
      const onFormChangeSpy = cy.spy().as('onFormChange')

      mountStandardLayout({
        onFormChange: onFormChangeSpy,
      })

      // Click the switch to toggle it
      cy.getTestId('ff-enabled').find('input[type="checkbox"]').click({ force: true })

      cy.get('@onFormChange').should('have.been.called')
    })
  })

  describe('ScopeEntityField (scope entity selection)', () => {
    it('should render scope entity fields when scoped radio is selected', () => {
      mountStandardLayout()

      // Initially in Global mode, scope fields should be hidden
      cy.get('.scope-detail').should('not.be.visible')

      // Click "Scoped" radio
      cy.get('.k-radio').eq(1).click()

      cy.get('.scope-detail').should('be.visible')

      cy.getTestId('ff-service').should('exist')
      cy.getTestId('ff-route').should('exist')
    })

    it('should render scope entity labels', () => {
      mountStandardLayout()

      // Click "Scoped" radio to show entity fields
      cy.get('.k-radio').eq(1).click()

      cy.getTestId('ff-service').should('contain.text', 'Service')
      cy.getTestId('ff-route').should('contain.text', 'Route')
    })

    it('should render scope entity help text', () => {
      mountStandardLayout()

      // Click "Scoped" radio
      cy.get('.k-radio').eq(1).click()

      cy.getTestId('ff-service').find('.ff-scope-entity-help')
        .should('exist')
        .should('contain.text', 'The service this plugin will target')
    })
  })

  it('should expose freeform schema on window and clean up on unmount', () => {
    mountStandardLayout()
      .then(({ wrapper }) => wrapper)
      .as('vueWrapper')

    cy.get('[data-testid="ff-standard-layout-form"]')
      .invoke('attr', 'data-instance-id')
      .as('instanceId')

    cy.get('@instanceId').then((instanceId) => {
      cy.window().then((win) => {
        const map = (win as any)[FREE_FORM_SCHEMA_MAP_KEY]
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(map).to.exist
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(map[instanceId as unknown as string]).to.exist
      })
    })

    cy.get('@vueWrapper').then(wrapper => wrapper.unmount())

    cy.get('@instanceId').then((instanceId) => {
      cy.window().then((win) => {
        const map = (win as any)[FREE_FORM_SCHEMA_MAP_KEY]
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(map?.[instanceId as unknown as string]).to.be.undefined
      })
    })
  })
})
