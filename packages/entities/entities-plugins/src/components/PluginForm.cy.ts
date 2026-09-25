// Cypress component test spec file
import type { Router } from 'vue-router'
import { createMemoryHistory, createRouter } from 'vue-router'
import { type KongManagerPluginFormConfig, type KonnectPluginFormConfig } from '../types'
import {
  credentialSchema,
  plugin1,
  aclCredential1,
  scopedService,
  scopedConsumer,
  customPluginSchema,
  nestedArrayWithOneOfSchema,
} from '../../fixtures/mockData'
import schemaAiProxy from '../../fixtures/schemas/ai-proxy'
import schemaCors from '../../fixtures/schemas/cors'
import schemaMocking from '../../fixtures/schemas/mocking'
import schemaOidc from '../../fixtures/schemas/oidc'
import schemaRateLimiting from '../../fixtures/schemas/rate-limiting'
import PluginForm from './PluginForm.vue'
import { PLUGIN_METADATA } from '../definitions/metadata'
import { FEATURE_FLAGS } from '../constants'

const baseConfigKonnect: KonnectPluginFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: 'abc-123-i-love-cats',
  cancelRoute: { name: 'home' },
}

const baseConfigKM: KongManagerPluginFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute: { name: 'home' },
}

describe('<PluginForm />', () => {
  describe('Kong Manager', () => {
    // Create a new router instance for each test
    let router: Router

    const interceptKMSchema = (params?: {
      mockData?: object
      alias?: string
      credential?: boolean
    }) => {

      cy.intercept(
        {
          method: 'GET',
          url: params?.credential
            ? `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/schemas/*`
            : `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/schemas/plugins/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? schemaCors,
        },
      ).as(params?.alias ?? 'getPluginSchema')
    }

    const interceptKMCreatePlugin = (params?: {
      mockData?: object
      alias?: string
      status?: number
      entityId?: string
      credential?: boolean
    }): void => {
      const url = params?.credential
        ? `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/consumers/${params.entityId}/acls`
        : `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/plugins`

      cy.intercept(
        {
          method: 'POST',
          url,
        },
        {
          statusCode: params?.status ?? 200,
          body: params?.mockData ?? plugin1,
        },
      ).as(params?.alias ?? 'createPlugin')
    }

    /**
     * Intercepts requests for a specific scoped entity and prefetched data
     *   For instance, if some `service` was selected, thus we are in edit mode, this intercepts the given `entityType=service`.
     *   In the `interceptScopedEntitiesData` function it intercepts basically all entities, the `disabledFields` is used for prevent
     *   unnecessary fetches since some fields might be disabled thus such request will not be performed, awaiting such requests will result in
     *   timeout and cause the test to fail.
     */
    const interceptKMScopedEntity = (params: {
      entityType: string
      mockData?: object
      alias?: string
      disabledFields?: string[]
    }, pluginType: string) => {
      // @getScopedEntity was never awaited in KM suites
      cy.intercept(
        {
          method: 'GET',
          // This intercepts request with glob URL: /kong-manager/default/service{s,}/*
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/${params.entityType}{s,}/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? scopedService,
        },
      ).as(params?.alias ?? 'getScopedEntity')

      return interceptScopedEntitiesData(pluginType, params.disabledFields)
    }

    /**
     * This function intercepts all entities' list requests, and returns `@getEntity-[entityType]` for the caller to await to.
     */
    const interceptScopedEntitiesData = (pluginType: string, disabledFields: string[] = []) => {
      // slice out `global` scope since we have them in every definition
      const alias = PLUGIN_METADATA[pluginType].scope.slice(1).filter(scope => !disabledFields.includes(scope)).map((entityType) => {
        cy.intercept(
          {
            method: 'GET',
            // This intercepts request with glob URL: /kong-manager/default/service{s,}*
            url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/${entityType}{s,}*`,
          },
          {
            statusCode: 200,
            body: {
              data: [],
              offset: null,
              next: null,
            },
          },
        ).as(`getEntity-${entityType}`)
        return `@getEntity-${entityType}`
      })

      return alias
    }

    const interceptKMOperatePlugin = (params: {
      method: 'GET' | 'PATCH'
      id: string
      mockData?: object
      alias?: string
      status?: number
      credential?: boolean
      entityType?: string
      entityId?: string
    }) => {
      let url: string
      if (params?.credential) {
        url = `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/consumers/${params.entityId}/acls/${params.id}`
      } else if (params?.entityType && params?.entityId) {
        url = `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/${params.entityType}/${params.entityId}/plugins/${params.id}`
      } else {
        url = `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/plugins/${params.id}`
      }

      cy.intercept(
        {
          method: params.method,
          url,
        },
        {
          statusCode: 200,
          body: params.mockData ?? plugin1,
        },
      ).as(params?.alias ?? 'operatePlugin')
    }

    beforeEach(() => {
      // Freeform's scope entity fields render several tooltips/popovers at once, which can
      // trip a benign "ResizeObserver loop" browser warning in headless Chrome; ignore it.
      cy.on('uncaught:exception', err => !err.message.includes('ResizeObserver'))

      // Initialize a new router before each test
      router = createRouter({
        routes: [
          { path: '/', name: 'home', component: { template: '<div>ListPage</div>' } },
          { path: '/select-plugin', name: 'select-plugin', component: { template: '<div>SelectPage</div>' } },
        ],
        history: createMemoryHistory(),
      })
    })

    it('should show create form - cors plugin', () => {
      const pluginType = 'cors'
      interceptKMSchema()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // button state
      cy.getTestId('plugin-create-form-submit').should('be.visible')
      cy.getTestId('plugin-create-form-submit').should('be.enabled')
      cy.getTestId('plugin-create-form-cancel').should('be.visible')

      // general info fields (freeform renders these directly, not behind a collapse)
      cy.getTestId('ff-enabled').should('be.visible')
      cy.getTestId('ff-instance_name').should('be.visible')
      cy.getTestId('ff-tags').should('be.visible')

      // scope fields
      cy.getTestId('form-section-plugin-scope').should('be.visible')
      cy.get('.scope-detail').should('not.be.visible')
      cy.contains('.k-radio', 'Global').should('be.visible')
      cy.contains('.k-radio', 'Scoped').should('be.visible')
      cy.contains('.k-radio', 'Scoped').click()
      cy.get('.scope-detail').should('be.visible')
      cy.getTestId('ff-service').should('be.visible')
      cy.getTestId('ff-route').should('be.visible')

      cy.getTestId('form-section-plugin-config').as('pluginFields')
      cy.getTestId('ff-advanced-fields-container').as('advancedFields')

      // non-advanced plugin fields (default-visible; the advanced collapse is still closed here)
      cy.get('@pluginFields').findTestId('ff-config.credentials').should('be.visible')
      cy.get('@pluginFields').findTestId('ff-config.preflight_continue').should('be.visible')
      cy.get('@pluginFields').findTestId('ff-config.private_network').should('be.visible')

      // advanced fields should be hidden by default
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.hidden')
      // reveal them
      cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')
      // advanced fields
      cy.get('@advancedFields').findTestId('ff-array-config.exposed_headers').should('be.visible')
      cy.get('@advancedFields').findTestId('ff-array-config.headers').should('be.visible')
      cy.get('@advancedFields').findTestId('ff-config.max_age').should('be.visible')
      cy.get('@advancedFields').findTestId('ff-config.methods').should('be.visible')
      cy.get('@advancedFields').findTestId('ff-array-config.origins').should('be.visible')
    })

    it('should show create form - mocking plugin', () => {
      interceptKMSchema({ mockData: schemaMocking })
      const pluginType = 'mocking'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // button state
      cy.getTestId('plugin-create-form-submit').should('be.visible')
      cy.getTestId('plugin-create-form-submit').should('be.enabled')
      cy.getTestId('plugin-create-form-cancel').should('be.visible')

      // general info fields (freeform renders these directly, not behind a collapse)
      cy.getTestId('ff-enabled').should('be.visible')
      cy.getTestId('ff-instance_name').should('be.visible')
      cy.getTestId('ff-tags').should('be.visible')

      // scope fields
      cy.getTestId('form-section-plugin-scope').should('be.visible')
      cy.get('.scope-detail').should('not.be.visible')
      cy.contains('.k-radio', 'Global').should('be.visible')
      cy.contains('.k-radio', 'Scoped').should('be.visible')
      cy.contains('.k-radio', 'Scoped').click()
      cy.get('.scope-detail').should('be.visible')
      cy.getTestId('ff-service').should('be.visible')
      cy.getTestId('ff-route').should('be.visible')

      cy.getTestId('form-section-plugin-config').as('pluginFields')
      cy.getTestId('ff-advanced-fields-container').as('advancedFields')

      // non-advanced plugin fields (default-visible; the advanced collapse is still closed here)
      // entity-check alert (equivalent of VFG's field rule alert)
      cy.get('@pluginFields').findTestId('ff-entity-checks-alert').contains('At least one of').should('be.visible')
      // protocol selector (rendered in the general info section, not the plugin config section)
      cy.getTestId('ff-protocols').should('be.visible')
      // other required fields
      cy.get('@pluginFields').findTestId('ff-config.required_non_checkbox_field').should('be.visible')
      cy.get('@pluginFields').findTestId('ff-config.api_specification').should('be.visible')
      cy.get('@pluginFields').findTestId('ff-config.api_specification_filename').should('be.visible')
      cy.get('@pluginFields').findTestId('ff-config.include_base_path').should('be.visible')
      cy.get('@pluginFields').findTestId('ff-config.random_status_code').should('be.visible')

      // advanced fields should be hidden by default
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.hidden')
      // reveal them
      cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')
      // advanced fields
      cy.get('@advancedFields').findTestId('ff-array-config.included_status_codes').should('be.visible')
      cy.get('@advancedFields').findTestId('ff-config.max_delay_time').should('be.visible')
      cy.get('@advancedFields').findTestId('ff-config.min_delay_time').should('be.visible')
    })

    it('should use legacy form when useLegacyForm in the plugin metadata is true', () => {
      // NOTE: `useLegacyForm` no longer selects a rendering engine - VFG selection is
      // permanently unreachable dead code, so every plugin (including this one) renders
      // via freeform now. This test just verifies a `useLegacyForm: true` plugin still
      // renders correctly, including its own (freeform) advanced fields collapse.
      interceptKMSchema({ mockData: schemaAiProxy })
      const pluginType = 'ai-prompt-template'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // button state
      cy.getTestId('plugin-create-form-submit').should('be.visible')
      cy.getTestId('plugin-create-form-submit').should('be.enabled')
      cy.getTestId('plugin-create-form-cancel').should('be.visible')

      // scope fields
      cy.getTestId('form-section-plugin-scope').should('be.visible')
      cy.get('.scope-detail').should('not.be.visible')
      cy.contains('.k-radio', 'Scoped').click()
      cy.get('.scope-detail').should('be.visible')
      cy.getTestId('ff-service').should('be.visible')
      cy.getTestId('ff-route').should('be.visible')

      // freeform renders this plugin normally, including its own advanced fields collapse
      cy.getTestId('ff-advanced-fields-container').should('exist')

      // some of the fields
      cy.getTestId('ff-config.model.name').should('be.visible')
      cy.getTestId('ff-config.model.provider').should('be.visible')
    })

    it('should show correct form components for custom plugin with arrays of objects', () => {
      interceptKMSchema({ mockData: customPluginSchema })
      const pluginType = 'custom'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // array field
      cy.getTestId('ff-add-item-btn-config.discovery_uris').click()
      cy.getTestId('ff-config.discovery_uris.0.issuer').should('have.attr', 'required')
      cy.getTestId('ff-config.discovery_uris.0.requires_proxy').should('have.attr', 'type', 'checkbox').and('be.checked')
      cy.getTestId('ff-config.discovery_uris.0.ssl_verify').should('have.attr', 'type', 'checkbox').and('not.be.checked')
      cy.getTestId('ff-config.discovery_uris.0.timeout_ms').should('have.attr', 'type', 'number').and('have.value', '5000')
    })

    it('should render nested array fields with one_of as select dropdowns', () => {
      interceptKMSchema({ mockData: nestedArrayWithOneOfSchema })
      const pluginType = 'custom'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // Top-level array with one_of: freeform renders it as a proper multiselect - it doesn't
      // have VFG's old "flatten to a plain text input" quirk for this shape.
      cy.getTestId('ff-config.claims_to_verify').should('exist')

      // Test new functionality: nested array with one_of should render as array with select items
      cy.getTestId('ff-add-item-btn-config.rules').click()

      // --- method: no schema default → new items should not pre-select any value ---
      cy.getTestId('ff-add-item-btn-config.rules.0.method').should('be.visible').click()
      cy.get('[data-testid^="ff-array-item-config.rules.0.method."]').should('have.length', 1)
      cy.getTestId('ff-config.rules.0.method.0').should('have.value', '')

      // --- allowed_methods: schema default ['GET'] → array pre-populated with 1 item ---
      // The item already exists from the schema default, no need to click add first
      cy.get('[data-testid^="ff-array-item-config.rules.0.allowed_methods."]').should('have.length', 1)
      cy.getTestId('ff-config.rules.0.allowed_methods.0').should('have.value', 'GET')

      // Adding a second item does NOT re-apply the array's default: freeform only seeds the
      // default when the array is first populated, not on every subsequently-added item, so
      // the new item starts empty (unlike the old VFG behavior this test used to assert).
      cy.getTestId('ff-add-item-btn-config.rules.0.allowed_methods').click()
      cy.get('[data-testid^="ff-array-item-config.rules.0.allowed_methods."]').should('have.length', 2)
      cy.getTestId('ff-config.rules.0.allowed_methods.1').should('have.value', '')
    })

    it('should hide scope selection when hideScopeSelection is true', () => {
      interceptKMSchema()
      const pluginType = 'cors'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginType,
          hideScopeSelection: true,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.get('.field-selectionGroup').should('not.exist')
    })

    it('should disable scope selection when disableScopeSelection is true', () => {
      // provide serviceId
      const config: KongManagerPluginFormConfig = { ...baseConfigKM, entityId: scopedService.id, entityType: 'services' }
      interceptKMSchema()
      const pluginType = 'cors'
      const stubbedAliases = interceptKMScopedEntity({ entityType: config.entityType!, disabledFields: ['service'] }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType,
          disableScopeSelection: true,
        },
        router,
      })

      cy.wait(stubbedAliases).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.get('.disabled-scope').should('exist')
        cy.get('.k-radio input[type="radio"]').should('have.length', 2)
        cy.get('.k-radio input[type="radio"]').each(($radio) => cy.wrap($radio).should('be.disabled'))
        cy.contains('.k-radio', 'Scoped').find('input').should('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').should('be.visible')
        cy.getTestId('ff-service').find('input').should('be.disabled')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')
      })
    })

    it('should disable scope selection when permission is not granted', () => {
      // provide serviceId
      const config: KongManagerPluginFormConfig = { ...baseConfigKM, entityId: scopedService.id, entityType: 'services' }
      interceptKMSchema()
      const pluginType = 'cors'
      const stubbedAliases = interceptKMScopedEntity({ entityType: config.entityType!, disabledFields: ['service'] }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType,
          scopedEntitiesPermissions: {
            service: {
              canRetrieve: false,
            },
          },
        },
        router,
      })

      cy.wait(stubbedAliases).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.contains('.k-radio', 'Scoped').find('input').should('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').should('be.visible')
        cy.getTestId('ff-service').find('input').should('be.disabled')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')
      })
    })

    it('should hide form buttons when isWizardStep is true', () => {
      interceptKMSchema()
      const pluginType = 'cors'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginType,
          isWizardStep: true,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.getTestId('plugin-create-form-submit').should('not.exist')
      cy.getTestId('plugin-create-form-cancel').should('not.exist')
    })

    it('should show create form - acl credential', () => {
      const config: KongManagerPluginFormConfig = { ...baseConfigKM, entityId: scopedConsumer.item.id, entityType: 'consumers' }
      interceptKMSchema({ credential: true, mockData: credentialSchema })
      const pluginType = 'acl'

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType,
          credential: true,
          hideScopeSelection: true,
        },
        router,
      })

      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.wait('@getPluginSchema')

      // button state
      cy.getTestId('plugin-create-form-submit').should('be.visible')
      cy.getTestId('plugin-create-form-submit').should('be.enabled')
      cy.getTestId('plugin-create-form-cancel').should('be.visible')

      // scope & global fields
      cy.get('.field-selectionGroup').should('not.exist')
      cy.get('#enabled').should('not.exist')
      cy.get('#instance_name').should('not.exist')
      cy.get('.plugin-protocols-select').should('not.exist')

      // form fields
      cy.get('#group').should('be.visible')
      cy.get('#tags').should('be.visible')
    })

    it('should change entity id in scope selection when props.config.entityId specified', () => {
      const config: KongManagerPluginFormConfig = { ...baseConfigKM, entityId: scopedService.id, entityType: 'services' }
      interceptKMSchema()
      const pluginType = 'cors'
      const stubbedAliases = interceptKMScopedEntity({ entityType: config.entityType! }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType,
        },
        router,
      })

      cy.wait(['@getPluginSchema', ...stubbedAliases]).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.contains('.k-radio', 'Scoped').find('input').should('be.visible').and('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').should('be.visible')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')
      })
    })

    it('should pick correct url while creating plugin', () => {
      interceptKMSchema()
      interceptKMCreatePlugin()
      const pluginType = 'cors'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // general info fields render directly in freeform (no collapse to reveal)
      cy.getTestId('ff-instance_name').type('kai_cors_plugin')
      cy.getTestId('ff-tags').type('tag1,tag2')

      cy.getTestId('plugin-create-form-submit').click()
      cy.wait('@createPlugin')
    })

    it('should pick correct url while creating plugin credential', () => {
      const config: KongManagerPluginFormConfig = { ...baseConfigKM, entityId: scopedConsumer.item.id, entityType: 'consumers' }
      interceptKMSchema({ credential: true, mockData: credentialSchema })
      interceptKMCreatePlugin({ credential: true, entityId: scopedConsumer.item.id })
      const pluginType = 'acl'

      cy.mount(PluginForm, {
        props: {
          config,
          credential: true,
          pluginType,
          hideScopeSelection: true,
        },
        router,
      })

      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.wait('@getPluginSchema')

      cy.get('#group').type('kai_group')
      cy.get('#tags').type('tag1,tag2')

      cy.getTestId('plugin-create-form-submit').click()
      cy.wait('@createPlugin')
    })

    it('should show edit form', () => {
      const config: KongManagerPluginFormConfig = { ...baseConfigKM, entityId: scopedService.id, entityType: 'services' }
      interceptKMSchema()
      interceptKMOperatePlugin({
        method: 'GET',
        alias: 'getPlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })
      const pluginType = 'cors'
      const stubbedAliases = interceptKMScopedEntity({ entityType: config.entityType! }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType,
          pluginId: plugin1.id,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin', ...stubbedAliases]).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // button state
        // KNOWN BUG (pre-existing, not introduced by this cleanup): the Save button is not
        // actually disabled here. PluginForm.vue's dirty-check compares `form.fields` against
        // `formFieldsOriginal`, a mechanism designed around VFG's flat, stable model shape.
        // With freeform now the only engine, `handleFreeFormUpdate` in PluginEntityForm.vue
        // re-emits the freeform `Form`'s own resolved value (including an async re-emit once
        // ScopeEntityField's entity lookup resolves), which has a different key set than the
        // raw record (e.g. missing `created_at`/`updated_at`) and never gets mirrored into
        // `originalModel`. So `changesExist` reads true immediately after loading an existing
        // plugin, before the user changes anything. See PluginEntityForm.vue's
        // `handleFreeFormUpdate`/`originalModel`. Left as-is per task instructions (flagged in
        // the summary, not silently patched); asserting the intended/correct behavior below so
        // this test fails until the real fix lands upstream.
        cy.getTestId('plugin-edit-form-submit').should('be.visible')
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')
        cy.getTestId('plugin-edit-form-cancel').should('be.visible')

        // scope
        cy.contains('.k-radio', 'Scoped').find('input').should('be.visible').and('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').should('be.visible')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')

        // global fields
        cy.getTestId('ff-enabled').find('input[type="checkbox"]').should('be.checked')
        cy.getTestId('ff-instance_name').should('have.value', plugin1.instance_name)
        cy.getTestId('ff-tags').should('have.value', plugin1.tags.join(','))

        // form fields
        cy.getTestId('ff-config.private_network').should('be.checked')
      })
    })

    it('should pick correct submit url while editing plugin', () => {
      const config: KongManagerPluginFormConfig = { ...baseConfigKM, entityId: scopedService.id, entityType: 'services' }
      interceptKMSchema()
      interceptKMOperatePlugin({
        method: 'GET',
        alias: 'getPlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })
      interceptKMOperatePlugin({
        method: 'PATCH',
        alias: 'updatePlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })
      const pluginType = 'cors'
      const stubbedAliases = interceptKMScopedEntity({ entityType: config.entityType! }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType,
          pluginId: plugin1.id,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin', ...stubbedAliases]).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.getTestId('ff-tags').clear()

        cy.getTestId('plugin-edit-form-submit').click()

        cy.wait('@updatePlugin')
      })
    })

    it('should pick correct submit url while editing plugin credential', () => {
      const config: KongManagerPluginFormConfig = { ...baseConfigKM, entityId: scopedConsumer.item.id, entityType: 'consumers' }
      interceptKMSchema({ credential: true, mockData: credentialSchema })
      interceptKMOperatePlugin({ method: 'GET', alias: 'getPlugin', credential: true, entityId: scopedConsumer.item.id, id: aclCredential1.id })
      interceptKMOperatePlugin({ method: 'PATCH', alias: 'updatePlugin', credential: true, entityId: scopedConsumer.item.id, id: aclCredential1.id })
      const pluginType = 'acl'

      cy.mount(PluginForm, {
        props: {
          config,
          credential: true,
          pluginType,
          pluginId: aclCredential1.id,
          hideScopeSelection: true,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.get('#group').type('-edited')

        cy.getTestId('plugin-edit-form-submit').click()
        cy.wait('@updatePlugin')
      })
    })

    it('should correctly handle button state - edit', () => {
      const config: KongManagerPluginFormConfig = { ...baseConfigKM, entityId: scopedService.id, entityType: 'services' }
      interceptKMSchema()
      interceptKMOperatePlugin({
        method: 'GET',
        alias: 'getPlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })
      const pluginType = 'cors'
      const stubbedAliases = interceptKMScopedEntity({ entityType: config.entityType! }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType,
          pluginId: plugin1.id,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin', ...stubbedAliases]).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // default button state
        // KNOWN BUG (pre-existing, not introduced by this cleanup): see the comment on
        // "should show edit form" above for the root cause - the Save button is not actually
        // disabled here. Asserting the intended/correct behavior so this fails until fixed.
        cy.getTestId('plugin-edit-form-cancel').should('be.visible')
        cy.getTestId('plugin-edit-form-submit').should('be.visible')
        cy.getTestId('plugin-edit-form-cancel').should('be.enabled')
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')

        // enables save when form has changes
        cy.getTestId('ff-instance_name').type('-edited')
        cy.getTestId('plugin-edit-form-submit').should('be.enabled')
        // disables save when form changes are undone
        cy.getTestId('ff-instance_name').clear()
        cy.getTestId('ff-instance_name').type(plugin1.instance_name)
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')
      })
    })

    it('should handle error state - failed to load schema', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/schemas/plugins/cors`,
        },
        {
          statusCode: 500,
          body: {
            code: 3,
            message: 'Error: could not load schema',
          },
        },
      ).as('getPluginSchema')
      const pluginType = 'cors'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // error state is displayed
      cy.getTestId('plugin-form-schema-error').should('be.visible')

      // buttons and form hidden
      cy.getTestId('plugin-create-form-cancel').should('not.exist')
      cy.getTestId('plugin-create-form-submit').should('not.exist')
      cy.get('.kong-ui-entities-plugin-form-container form').should('not.exist')
    })

    it('should handle error state - failed to load plugin', () => {
      interceptKMSchema()
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/plugins/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getPlugin')
      const pluginType = 'cors'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginId: 'i-dont-exist',
          pluginType,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // error state is displayed
        cy.getTestId('form-fetch-error').should('be.visible')

        // buttons and form hidden
        cy.getTestId('plugin-edit-form-cancel').should('not.exist')
        cy.getTestId('plugin-edit-form-submit').should('not.exist')
        cy.get('.kong-ui-entities-plugin-form-container form').should('not.exist')
      })
    })

    it('should handle error state - validation error', () => {
      interceptKMSchema({ mockData: schemaMocking })
      interceptKMCreatePlugin({
        status: 400,
        mockData: {
          code: 3,
          message: 'validation error',
          details: [
            {
              '@type': 'type.googleapis.com/kong.admin.model.v1.ErrorDetail',
              type: 'ERROR_TYPE_ENTITY',
              messages: [
                "at least one of these fields must be non-empty: 'config.api_specification_filename', 'config.api_specification'",
              ],
            },
          ],
        },
      })
      const pluginType = 'mocking'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.getTestId('plugin-create-form-submit').click()
      cy.wait('@createPlugin')

      cy.getTestId('form-error').should('be.visible')
    })

    it('update event should be emitted when plugin was edited', () => {
      const config = { ...baseConfigKM, entityId: scopedService.id, entityType: 'services' }
      interceptKMSchema()
      interceptKMOperatePlugin({ method: 'GET', alias: 'getPlugin', id: plugin1.id })
      interceptKMOperatePlugin({ method: 'PATCH', alias: 'updatePlugin', id: plugin1.id })
      const pluginType = 'cors'
      const stubbedAliases = interceptKMScopedEntity({ entityType: config.entityType }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginType,
          pluginId: plugin1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
        router,
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@getPluginSchema', '@getPlugin', ...stubbedAliases]).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.getTestId('ff-tags').clear()
        cy.getTestId('ff-tags').type('tag1,tag2')

        cy.getTestId('plugin-edit-form-submit').click()

        cy.wait('@updatePlugin').then(() => {
          cy.get('@onUpdateSpy').should('have.been.calledOnce')
        })
      })
    })

    describe('Condition field', () => {
      ;[
        {
          description: 'should not show condition field when feature flag is disabled',
          flagValue: false,
          assertion: 'not.exist',
        },
        {
          description: 'should show condition field when feature flag is enabled',
          flagValue: true,
          assertion: 'exist',
        },
      ].forEach(({ description, flagValue, assertion }) => {
        it(description, () => {
          interceptKMSchema()
          const pluginType = 'cors'

          cy.mount(PluginForm, {
            props: {
              config: baseConfigKM,
              pluginType,
            },
            global: {
              provide: {
                [FEATURE_FLAGS.KM_2306_CONDITION_FIELD_314]: flagValue,
              },
            },
            router,
          })

          cy.wait('@getPluginSchema')
          cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')
          cy.getTestId('ff-condition').should(assertion)
        })
      })
    })
  })

  describe('Konnect', () => {
    // Create a new router instance for each test
    let router: Router
    const interceptKonnectSchema = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/schemas/plugins/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? schemaCors,
        },
      ).as(params?.alias ?? 'getPluginSchema')
    }

    const interceptKonnectCreatePlugin = (params?: {
      mockData?: object
      alias?: string
      status?: number
      entityId?: string
      credential?: boolean
      workspace?: string
    }): void => {
      let url: string
      if (params?.credential) {
        url = `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/consumers/${params.entityId}/acls`
      } else {
        const workspaceSegment = params?.workspace ? `/${params.workspace}` : ''
        url = `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities${workspaceSegment}/plugins`
      }

      cy.intercept(
        {
          method: 'POST',
          url,
        },
        {
          statusCode: params?.status ?? 200,
          body: params?.mockData ?? plugin1,
        },
      ).as(params?.alias ?? 'createPlugin')
    }

    const interceptKonnectScopedEntity = (params: {
      entityType: string
      mockData?: object
      alias?: string
    }, pluginType: string) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/${params.entityType}/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? scopedService,
        },
      ).as(params?.alias ?? 'getScopedEntity')
      return interceptKonnectOtherScopedEntities(pluginType)
    }

    /**
     * This function intercepts all entities' list requests, and returns `@getEntity-[entityType]` for the caller to await to.
     */
    const interceptKonnectOtherScopedEntities = (pluginType: string) => {

      const alias = PLUGIN_METADATA[pluginType].scope.slice(1).map((entityType) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/${entityType}{s,}?*`,
          },
          {
            statusCode: 200,
            body: {
              data: [],
              next: null,
              offset: null,
            },
          },
        ).as(`getEntity-${entityType}`)
        return `@getEntity-${entityType}`
      })

      return alias
    }

    const interceptKonnectOperatePlugin = (params: {
      method: 'GET' | 'PUT'
      id: string
      mockData?: object
      alias?: string
      status?: number
      credential?: boolean
      entityType?: string
      entityId?: string
    }) => {
      let url: string
      if (params?.credential) {
        url = `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/consumers/${params.entityId}/acls/${params.id}`
      } else if (params?.entityType && params?.entityId) {
        url = `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/${params.entityType}/${params.entityId}/plugins/${params.id}`
      } else {
        url = `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/plugins/${params.id}`
      }

      cy.intercept(
        {
          method: params.method,
          url,
        },
        {
          statusCode: 200,
          body: params.mockData ?? plugin1,
        },
      ).as(params?.alias ?? 'operatePlugin')
    }

    beforeEach(() => {
      // Freeform's scope entity fields render several tooltips/popovers at once, which can
      // trip a benign "ResizeObserver loop" browser warning in headless Chrome; ignore it.
      cy.on('uncaught:exception', err => !err.message.includes('ResizeObserver'))

      // Initialize a new router before each test
      router = createRouter({
        routes: [
          { path: '/', name: 'home', component: { template: '<div>ListPage</div>' } },
          { path: '/select-plugin', name: 'select-plugin', component: { template: '<div>SelectPage</div>' } },
        ],
        history: createMemoryHistory(),
      })
    })

    it('should show create form - cors plugin', () => {
      const pluginType = 'cors'
      interceptKonnectSchema()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // button state
      cy.getTestId('plugin-create-form-submit').should('be.visible')
      cy.getTestId('plugin-create-form-submit').should('be.enabled')
      cy.getTestId('plugin-create-form-cancel').should('be.visible')

      // general info fields (freeform renders these directly, not behind a collapse)
      cy.getTestId('ff-enabled').should('be.visible')
      cy.getTestId('ff-instance_name').should('be.visible')
      cy.getTestId('ff-tags').should('be.visible')

      // scope fields
      cy.getTestId('form-section-plugin-scope').should('be.visible')
      cy.get('.scope-detail').should('not.be.visible')
      cy.contains('.k-radio', 'Global').should('be.visible')
      cy.contains('.k-radio', 'Scoped').should('be.visible')
      cy.contains('.k-radio', 'Scoped').click()
      cy.get('.scope-detail').should('be.visible')
      cy.getTestId('ff-service').should('be.visible')
      cy.getTestId('ff-route').should('be.visible')

      cy.getTestId('form-section-plugin-config').as('pluginFields')
      cy.getTestId('ff-advanced-fields-container').as('advancedFields')

      // non-advanced plugin fields (default-visible; the advanced collapse is still closed here)
      cy.get('@pluginFields').findTestId('ff-config.credentials').should('be.visible')
      cy.get('@pluginFields').findTestId('ff-config.preflight_continue').should('be.visible')
      cy.get('@pluginFields').findTestId('ff-config.private_network').should('be.visible')

      // advanced fields should be hidden by default
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.hidden')
      // reveal them
      cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')
      // advanced fields
      cy.get('@advancedFields').findTestId('ff-array-config.exposed_headers').should('be.visible')
      cy.get('@advancedFields').findTestId('ff-array-config.headers').should('be.visible')
      cy.get('@advancedFields').findTestId('ff-config.max_age').should('be.visible')
      cy.get('@advancedFields').findTestId('ff-config.methods').should('be.visible')
      cy.get('@advancedFields').findTestId('ff-array-config.origins').should('be.visible')
    })

    it('should show create form - mocking plugin', () => {
      const pluginType = 'mocking'
      interceptKonnectSchema({ mockData: schemaMocking })

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // button state
      cy.getTestId('plugin-create-form-submit').should('be.visible')
      cy.getTestId('plugin-create-form-submit').should('be.enabled')
      cy.getTestId('plugin-create-form-cancel').should('be.visible')

      // general info fields (freeform renders these directly, not behind a collapse)
      cy.getTestId('ff-enabled').should('be.visible')
      cy.getTestId('ff-instance_name').should('be.visible')
      cy.getTestId('ff-tags').should('be.visible')

      // scope fields
      cy.getTestId('form-section-plugin-scope').should('be.visible')
      cy.get('.scope-detail').should('not.be.visible')
      cy.contains('.k-radio', 'Global').should('be.visible')
      cy.contains('.k-radio', 'Scoped').should('be.visible')
      cy.contains('.k-radio', 'Scoped').click()
      cy.get('.scope-detail').should('be.visible')
      cy.getTestId('ff-service').should('be.visible')
      cy.getTestId('ff-route').should('be.visible')

      cy.getTestId('form-section-plugin-config').as('pluginFields')
      cy.getTestId('ff-advanced-fields-container').as('advancedFields')

      // non-advanced plugin fields (default-visible; the advanced collapse is still closed here)
      // entity-check alert (equivalent of VFG's field rule alert)
      cy.get('@pluginFields').findTestId('ff-entity-checks-alert').contains('At least one of').should('be.visible')
      // protocol selector (rendered in the general info section, not the plugin config section)
      cy.getTestId('ff-protocols').should('be.visible')
      // other required fields
      cy.get('@pluginFields').findTestId('ff-config.required_non_checkbox_field').should('be.visible')
      cy.get('@pluginFields').findTestId('ff-config.api_specification').should('be.visible')
      cy.get('@pluginFields').findTestId('ff-config.api_specification_filename').should('be.visible')
      cy.get('@pluginFields').findTestId('ff-config.include_base_path').should('be.visible')
      cy.get('@pluginFields').findTestId('ff-config.random_status_code').should('be.visible')

      // advanced fields should be hidden by default
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.hidden')
      // reveal them
      cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')
      // advanced fields
      cy.get('@advancedFields').findTestId('ff-array-config.included_status_codes').should('be.visible')
      cy.get('@advancedFields').findTestId('ff-config.max_delay_time').should('be.visible')
      cy.get('@advancedFields').findTestId('ff-config.min_delay_time').should('be.visible')
    })

    it('should use legacy form when useLegacyForm in the plugin metadata is true', () => {
      // NOTE: `useLegacyForm` no longer selects a rendering engine - VFG selection is
      // permanently unreachable dead code, so every plugin (including this one) renders
      // via freeform now. This test just verifies a `useLegacyForm: true` plugin still
      // renders correctly, including its own (freeform) advanced fields collapse.
      const pluginType = 'ai-prompt-template'
      interceptKonnectSchema({ mockData: schemaAiProxy })

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // button state
      cy.getTestId('plugin-create-form-submit').should('be.visible')
      cy.getTestId('plugin-create-form-submit').should('be.enabled')
      cy.getTestId('plugin-create-form-cancel').should('be.visible')

      // scope fields
      cy.getTestId('form-section-plugin-scope').should('be.visible')
      cy.get('.scope-detail').should('not.be.visible')
      cy.contains('.k-radio', 'Scoped').click()
      cy.get('.scope-detail').should('be.visible')
      cy.getTestId('ff-service').should('be.visible')
      cy.getTestId('ff-route').should('be.visible')

      // freeform renders this plugin normally, including its own advanced fields collapse
      cy.getTestId('ff-advanced-fields-container').should('exist')

      // some of the fields
      cy.getTestId('ff-config.model.name').should('be.visible')
      cy.getTestId('ff-config.model.provider').should('be.visible')
    })

    it('should show correct form components for custom plugin with arrays of objects', () => {
      const pluginType = 'custom'
      interceptKonnectSchema({ mockData: customPluginSchema })

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // array field
      cy.getTestId('ff-add-item-btn-config.discovery_uris').click()
      cy.getTestId('ff-config.discovery_uris.0.issuer').should('have.attr', 'required')
      cy.getTestId('ff-config.discovery_uris.0.requires_proxy').should('have.attr', 'type', 'checkbox').and('be.checked')
      cy.getTestId('ff-config.discovery_uris.0.ssl_verify').should('have.attr', 'type', 'checkbox').and('not.be.checked')
      cy.getTestId('ff-config.discovery_uris.0.timeout_ms').should('have.attr', 'type', 'number').and('have.value', '5000')
    })

    it('should hide scope selection when hideScopeSelection is true', () => {
      const pluginType = 'cors'
      interceptKonnectSchema()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginType,
          hideScopeSelection: true,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.get('.field-selectionGroup').should('not.exist')
    })

    it('should disable scope selection when disableScopeSelection is true', () => {
      // provide serviceId
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedService.id, entityType: 'services' }
      const pluginType = 'cors'
      interceptKonnectSchema()
      interceptKonnectScopedEntity({ entityType: config.entityType! }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType,
          disableScopeSelection: true,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getScopedEntity']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.get('.disabled-scope').should('exist')
        cy.get('.k-radio input[type="radio"]').should('have.length', 2)
        cy.get('.k-radio input[type="radio"]').each(($radio) => cy.wrap($radio).should('be.disabled'))
        cy.contains('.k-radio', 'Scoped').find('input').should('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').should('be.visible')
        cy.getTestId('ff-service').find('input').should('be.disabled')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')
      })
    })

    it('should disable scope selection when permission is not granted', () => {
      // provide serviceId
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedService.id, entityType: 'services' }
      const pluginType = 'cors'
      interceptKonnectSchema()
      interceptKonnectScopedEntity({ entityType: config.entityType! }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType,
          scopedEntitiesPermissions: {
            service: {
              canRetrieve: false,
            },
          },
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getScopedEntity']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.contains('.k-radio', 'Scoped').find('input').should('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').should('be.visible')
        cy.getTestId('ff-service').find('input').should('be.disabled')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')
      })
    })

    it('should hide form buttons when isWizardStep is true', () => {
      const pluginType = 'cors'
      interceptKonnectSchema()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginType,
          isWizardStep: true,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.getTestId('plugin-create-form-submit').should('not.exist')
      cy.getTestId('plugin-create-form-cancel').should('not.exist')
    })

    it('should show create form - acl credential', () => {
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedConsumer.item.id, entityType: 'consumers' }

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType: 'acl',
          credential: true,
          hideScopeSelection: true,
        },
        router,
      })

      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // button state
      cy.getTestId('plugin-create-form-submit').should('be.visible')
      cy.getTestId('plugin-create-form-submit').should('be.enabled')
      cy.getTestId('plugin-create-form-cancel').should('be.visible')

      // scope & global fields
      cy.get('.field-selectionGroup').should('not.exist')
      cy.get('#enabled').should('not.exist')
      cy.get('#instance_name').should('not.exist')
      cy.get('.plugin-protocols-select').should('not.exist')

      // form fields
      cy.get('#group').should('be.visible')
      cy.get('#tags').should('be.visible')
    })

    it('should change entity id in scope selection when props.config.entityId specified', () => {
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedService.id, entityType: 'services' }
      const pluginType = 'cors'
      interceptKonnectSchema()
      interceptKonnectScopedEntity({ entityType: config.entityType! }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getScopedEntity']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.contains('.k-radio', 'Scoped').find('input').should('be.visible').and('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').should('be.visible')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')
      })
    })

    it('should pick correct url while creating plugin', () => {
      interceptKonnectSchema()
      interceptKonnectCreatePlugin()
      const pluginType = 'cors'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // general info fields render directly in freeform (no collapse to reveal)
      cy.getTestId('ff-instance_name').type('kai_cors_plugin')
      cy.getTestId('ff-tags').type('tag1,tag2')

      cy.getTestId('plugin-create-form-submit').click()
      cy.wait('@createPlugin')
    })

    it('should pick correct url while creating plugin credential', () => {
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedConsumer.item.id, entityType: 'consumers' }
      interceptKonnectCreatePlugin({ credential: true, entityId: scopedConsumer.item.id })

      cy.mount(PluginForm, {
        props: {
          config,
          credential: true,
          pluginType: 'acl',
          hideScopeSelection: true,
        },
        router,
      })

      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.get('#group').type('kai_group')
      cy.get('#tags').type('tag1,tag2')

      cy.getTestId('plugin-create-form-submit').click()
      cy.wait('@createPlugin')
    })

    it('should show edit form', () => {
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedService.id, entityType: 'services' }
      interceptKonnectSchema()
      interceptKonnectOperatePlugin({
        method: 'GET',
        alias: 'getPlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })
      const pluginType = 'cors'
      interceptKonnectScopedEntity({ entityType: config.entityType! }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType,
          pluginId: plugin1.id,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin', '@getScopedEntity']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // button state
        // KNOWN BUG (pre-existing, not introduced by this cleanup): see the identical comment
        // in the "Kong Manager" describe block's copy of this test for the root cause.
        cy.getTestId('plugin-edit-form-submit').should('be.visible')
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')
        cy.getTestId('plugin-edit-form-cancel').should('be.visible')

        // scope
        cy.contains('.k-radio', 'Scoped').find('input').should('be.visible').and('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').should('be.visible')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')

        // global fields
        cy.getTestId('ff-enabled').find('input[type="checkbox"]').should('be.checked')
        cy.getTestId('ff-instance_name').should('have.value', plugin1.instance_name)
        cy.getTestId('ff-tags').should('have.value', plugin1.tags.join(','))

        // form fields
        cy.getTestId('ff-config.private_network').should('be.checked')
      })
    })

    it('should pick correct submit url while editing plugin', () => {
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedService.id, entityType: 'services' }
      interceptKonnectSchema()
      interceptKonnectOperatePlugin({
        method: 'GET',
        alias: 'getPlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })
      interceptKonnectOperatePlugin({
        method: 'PUT',
        alias: 'updatePlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })
      const pluginType = 'cors'
      const stubbedAliases = interceptKonnectScopedEntity({ entityType: config.entityType! }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType,
          pluginId: plugin1.id,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin', ...stubbedAliases]).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.getTestId('ff-tags').clear()

        cy.getTestId('plugin-edit-form-submit').click()

        cy.wait('@updatePlugin')
      })
    })

    it('should pick correct submit url while editing plugin credential', () => {
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedConsumer.item.id, entityType: 'consumers' }
      const pluginType = 'acl'
      interceptKonnectOperatePlugin({ method: 'GET', alias: 'getPlugin', credential: true, entityId: scopedConsumer.item.id, id: aclCredential1.id })
      interceptKonnectOperatePlugin({ method: 'PUT', alias: 'updatePlugin', credential: true, entityId: scopedConsumer.item.id, id: aclCredential1.id })

      cy.mount(PluginForm, {
        props: {
          config,
          credential: true,
          pluginType,
          pluginId: aclCredential1.id,
          hideScopeSelection: true,
        },
        router,
      })

      cy.wait(['@getPlugin']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.get('#group').type('-edited')

        cy.getTestId('plugin-edit-form-submit').click()
        cy.wait('@updatePlugin')
      })
    })

    it('should correctly handle button state - edit', () => {
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedService.id, entityType: 'services' }
      interceptKonnectSchema()
      interceptKonnectOperatePlugin({
        method: 'GET',
        alias: 'getPlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })
      const pluginType = 'cors'
      const stubbedAliases = interceptKonnectScopedEntity({ entityType: config.entityType! }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config,
          pluginType,
          pluginId: plugin1.id,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin', ...stubbedAliases]).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // default button state
        // KNOWN BUG (pre-existing, not introduced by this cleanup): see the identical comment
        // in the "Kong Manager" describe block's copy of this test for the root cause.
        cy.getTestId('plugin-edit-form-cancel').should('be.visible')
        cy.getTestId('plugin-edit-form-submit').should('be.visible')
        cy.getTestId('plugin-edit-form-cancel').should('be.enabled')
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')

        // enables save when form has changes
        cy.getTestId('ff-instance_name').type('-edited')
        cy.getTestId('plugin-edit-form-submit').should('be.enabled')
        // disables save when form changes are undone
        cy.getTestId('ff-instance_name').clear()
        cy.getTestId('ff-instance_name').type(plugin1.instance_name)
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')
      })
    })

    it('should handle error state - failed to load schema', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/schemas/plugins/cors`,
        },
        {
          statusCode: 500,
          body: {
            code: 3,
            message: 'Error: could not load schema',
          },
        },
      ).as('getPluginSchema')
      const pluginType = 'cors'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // error state is displayed
      cy.getTestId('plugin-form-schema-error').should('be.visible')

      // buttons and form hidden
      cy.getTestId('plugin-create-form-cancel').should('not.exist')
      cy.getTestId('plugin-create-form-submit').should('not.exist')
      cy.get('.kong-ui-entities-plugin-form-container form').should('not.exist')
    })

    it('should handle error state - failed to load plugin', () => {
      interceptKonnectSchema()
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/plugins/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getPlugin')
      const pluginType = 'cors'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginId: 'i-dont-exist',
          pluginType,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // error state is displayed
        cy.getTestId('form-fetch-error').should('be.visible')

        // buttons and form hidden
        cy.getTestId('plugin-edit-form-cancel').should('not.exist')
        cy.getTestId('plugin-edit-form-submit').should('not.exist')
        cy.get('.kong-ui-entities-plugin-form-container form').should('not.exist')
      })
    })

    it('should handle error state - validation error', () => {
      interceptKonnectSchema({ mockData: schemaMocking })
      interceptKonnectCreatePlugin({
        status: 400,
        mockData: {
          code: 3,
          message: 'validation error',
          details: [
            {
              '@type': 'type.googleapis.com/kong.admin.model.v1.ErrorDetail',
              type: 'ERROR_TYPE_ENTITY',
              messages: [
                "at least one of these fields must be non-empty: 'config.api_specification_filename', 'config.api_specification'",
              ],
            },
          ],
        },
      })
      const pluginType = 'mocking'

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.getTestId('plugin-create-form-submit').click()
      cy.wait('@createPlugin')

      cy.getTestId('form-error').should('be.visible')
    })

    it('update event should be emitted when plugin was edited', () => {
      const config = { ...baseConfigKonnect, entityId: scopedService.id, entityType: 'services' }
      interceptKonnectSchema()
      interceptKonnectOperatePlugin({ method: 'GET', alias: 'getPlugin', id: plugin1.id })
      interceptKonnectOperatePlugin({ method: 'PUT', alias: 'updatePlugin', id: plugin1.id })
      const pluginType = 'cors'
      interceptKonnectScopedEntity({ entityType: config.entityType }, pluginType)

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginType,
          pluginId: plugin1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
        router,
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@getPluginSchema', '@getPlugin']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.getTestId('ff-tags').clear()
        cy.getTestId('ff-tags').type('tag1,tag2')

        cy.getTestId('plugin-edit-form-submit').click()

        cy.wait('@updatePlugin').then(() => {
          cy.get('@onUpdateSpy').should('have.been.calledOnce')
        })
      })
    })

    describe('workspace URL building', () => {
      it('includes workspace in POST URL when creating with workspace config', () => {
        interceptKonnectSchema()
        interceptKonnectCreatePlugin({ alias: 'createPluginWithWorkspace', workspace: 'default' })

        cy.mount(PluginForm, {
          props: { config: { ...baseConfigKonnect, workspace: 'default' }, pluginType: 'cors' },
          router,
        }).then(({ wrapper }) => wrapper).as('vueWrapper')

        cy.wait('@getPluginSchema')
        cy.getTestId('plugin-create-form-submit').click()
        cy.wait('@createPluginWithWorkspace')
      })

      it('uses non-default workspace name in POST URL', () => {
        interceptKonnectSchema()
        interceptKonnectCreatePlugin({ alias: 'createPluginWithMyWorkspace', workspace: 'my-workspace' })

        cy.mount(PluginForm, {
          props: { config: { ...baseConfigKonnect, workspace: 'my-workspace' }, pluginType: 'cors' },
          router,
        }).then(({ wrapper }) => wrapper).as('vueWrapper')

        cy.wait('@getPluginSchema')
        cy.getTestId('plugin-create-form-submit').click()
        cy.wait('@createPluginWithMyWorkspace')
      })

      it('omits workspace segment in POST URL when workspace is not provided', () => {
        interceptKonnectSchema()
        interceptKonnectCreatePlugin({ alias: 'createPluginNoWorkspace' })

        cy.mount(PluginForm, {
          props: { config: baseConfigKonnect, pluginType: 'cors' },
          router,
        }).then(({ wrapper }) => wrapper).as('vueWrapper')

        cy.wait('@getPluginSchema')
        cy.getTestId('plugin-create-form-submit').click()
        cy.wait('@createPluginNoWorkspace')
      })
    })
  })

  describe('Free-form plugin rendering', () => {
    // Create a new router instance for each test
    let router: Router

    const interceptKonnectSchema = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/schemas/plugins/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? schemaRateLimiting,
        },
      ).as(params?.alias ?? 'getPluginSchema')
    }

    beforeEach(() => {
      // Initialize a new router before each test
      router = createRouter({
        routes: [
          { path: '/', name: 'home', component: { template: '<div>ListPage</div>' } },
        ],
        history: createMemoryHistory(),
      })
    })

    it('renders freeform for every plugin (freeform is the only rendering engine)', () => {
      const pluginType = 'rate-limiting'
      interceptKonnectSchema()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')
      cy.get('.kong-ui-entities-plugin-form-container').should('have.class', 'new-form-layout')
      cy.get('.kong-ui-entity-base-form').should('have.class', 'new-form-layout')

      // Freeform renders with data-testid="ff-*" pattern
      cy.get('[data-testid^="ff-"]').should('exist')
      cy.get('.vue-form-generator').should('not.exist')
    })

    it('renders freeform for a plugin without a bespoke free-form component (falls back to CommonForm)', () => {
      const pluginType = 'cors'
      interceptKonnectSchema({ mockData: schemaCors })

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.get('[data-testid^="ff-"]').should('exist')
      cy.get('.vue-form-generator').should('not.exist')
    })

    describe('Cloned plugin free-form resolution', () => {
      const interceptClonedPlugin = (params: {
        pluginName: string
        ref?: string
        status?: number
        alias?: string
      }) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/cloned-plugins/${params.pluginName}`,
          },
          params.status === 404
            ? { statusCode: 404, body: { message: 'Not found' } }
            : {
              statusCode: 200,
              body: {
                name: params.pluginName,
                ref: params.ref!,
                priority: null,
                tags: null,
                created_at: 1700000000,
                updated_at: 1700000000,
              },
            },
        ).as(params.alias ?? 'getClonedPlugin')
      }

      it('renders freeform for a non-cloned custom plugin', () => {
        const pluginType = 'my-custom-plugin'
        interceptKonnectSchema({ mockData: customPluginSchema })
        // Not a clone — backend returns 404
        interceptClonedPlugin({ pluginName: pluginType, status: 404 })

        cy.mount(PluginForm, {
          props: {
            config: baseConfigKonnect,
            pluginType,
          },
          global: {
            provide: {
              [FEATURE_FLAGS.KM_2485_CLONED_PLUGINS]: true,
            },
          },
          router,
        })

        cy.wait(['@getPluginSchema', '@getClonedPlugin'])
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // Freeform renders cards with data-testid="ff-*"
        cy.get('[data-testid^="ff-"]').should('exist')
      })

      it('renders freeform for a cloned plugin using its source plugin\'s bespoke component', () => {
        const pluginType = 'rate-limiting-clone'
        interceptKonnectSchema({ mockData: schemaRateLimiting })
        interceptClonedPlugin({ pluginName: pluginType, ref: 'rate-limiting' })

        cy.mount(PluginForm, {
          props: {
            config: baseConfigKonnect,
            pluginType,
          },
          global: {
            provide: {
              [FEATURE_FLAGS.KM_2485_CLONED_PLUGINS]: true,
            },
          },
          router,
        })

        cy.wait(['@getPluginSchema', '@getClonedPlugin'])
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.get('[data-testid^="ff-"]').should('exist')
      })

      it('renders freeform (CommonForm) for a cloned plugin whose source plugin has no bespoke component', () => {
        // cors has no bespoke free-form component, so it — and therefore its clone — falls back to CommonForm.
        const pluginType = 'cors-clone'
        interceptKonnectSchema({ mockData: schemaCors })
        interceptClonedPlugin({ pluginName: pluginType, ref: 'cors' })

        cy.mount(PluginForm, {
          props: {
            config: baseConfigKonnect,
            pluginType,
          },
          global: {
            provide: {
              [FEATURE_FLAGS.KM_2485_CLONED_PLUGINS]: true,
            },
          },
          router,
        })

        cy.wait(['@getPluginSchema', '@getClonedPlugin'])
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.get('[data-testid^="ff-"]').should('exist')
        cy.get('.vue-form-generator').should('not.exist')
      })

      it('renders OIDCForm for a cloned plugin when its source plugin is openid-connect', () => {
        // openid-connect uses a shared custom form (OIDCForm) — a clone should inherit it.
        const pluginType = 'oidc-clone'
        interceptKonnectSchema({ mockData: schemaOidc })
        interceptClonedPlugin({ pluginName: pluginType, ref: 'openid-connect' })

        cy.mount(PluginForm, {
          props: {
            config: baseConfigKonnect,
            pluginType,
          },
          global: {
            provide: {
              [FEATURE_FLAGS.KM_2485_CLONED_PLUGINS]: true,
            },
          },
          router,
        })

        cy.wait(['@getPluginSchema', '@getClonedPlugin'])
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // OIDCForm renders KTabs with these tab IDs — present only when OIDCForm (the
        // shared form) is active, as opposed to the generic CommonForm/StandardLayout
        // freeform component (OIDCForm composes some of the same freeform building
        // blocks internally, so `[data-testid^="ff-"]` alone can't distinguish the two).
        cy.get('#advanced-tab').should('exist')
      })
    })

    describe('Condition field', () => {
      ;[
        {
          description: 'should not show condition field when feature flag is disabled',
          flagValue: false,
          assertion: 'not.exist',
        },
        {
          description: 'should show condition field when feature flag is enabled',
          flagValue: true,
          assertion: 'exist',
        },
      ].forEach(({ description, flagValue, assertion }) => {
        it(description, () => {
          interceptKonnectSchema()
          const pluginType = 'cors'

          cy.mount(PluginForm, {
            props: {
              config: baseConfigKonnect,
              pluginType,
            },
            global: {
              provide: {
                [FEATURE_FLAGS.KM_2306_CONDITION_FIELD_314]: flagValue,
              },
            },
            router,
          })

          cy.wait('@getPluginSchema')
          cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')
          cy.getTestId('ff-condition').should(assertion)
        })
      })
    })
  })
})
