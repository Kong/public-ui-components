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
} from '../../fixtures/mockData'
import schemaAiProxy from '../../fixtures/schemas/ai-proxy'
import schemaCors from '../../fixtures/schemas/cors'
import schemaMocking from '../../fixtures/schemas/mocking'
import PluginForm from './PluginForm.vue'
import { VueFormGenerator } from '../../src'

const baseConfigKonnect: KonnectPluginFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: 'abc-123-i-love-cats',
  cancelRoute: { name: 'home' },
}

const baseConfigKM:KongManagerPluginFormConfig = {
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
      interceptKMScopedEntityFallback()

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

    const interceptKMValidatePlugin = (params?: {
      mockData?: object
      alias?: string
      status?: number
    }): void => {
      const url = `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/schemas/plugins/validate`

      cy.intercept(
        {
          method: 'POST',
          url,
        },
        {
          statusCode: params?.status ?? 200,
          body: params?.mockData ?? plugin1,
        },
      ).as(params?.alias ?? 'validatePlugin')
    }

    const interceptKMScopedEntity = (params: {
      entityType: string
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/${params.entityType}/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? scopedService,
        },
      ).as(params?.alias ?? 'getScopedEntity')
    }

    // We just need to stub this call and we don't care about the response, otherwise it will fail occasionally
    const interceptKMScopedEntityFallback = () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/services?*`,
        },
        {
          statusCode: 200,
          body: { data: [] },
        },
      ).as('getScopedEntityFallback')
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
      interceptKMSchema()

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKM,
          pluginType: 'cors',
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // button state
      cy.getTestId('plugin-create-form-submit').should('be.visible')
      cy.getTestId('plugin-create-form-submit').should('be.enabled')
      cy.getTestId('plugin-create-form-cancel').should('be.visible')

      // pinned fields (but they should not be under a KCollapse)
      cy.get('#enabled').should('exist')
        .parent('.k-collapse').should('not.exist')

      // scope fields (this is also pinned, but they should not be under a KCollapse)
      cy.get('.field-selectionGroup').should('be.visible')
        .parent('.k-collapse').should('not.exist')
      cy.get('.Global-check').should('be.visible')
      cy.get('.Scoped-check').should('be.visible')
      cy.get('.field-selectionGroup').find('.field-AutoSuggest').should('not.be.visible')
      cy.get('.Scoped-check input').click()
      cy.get('.field-selectionGroup').find('.field-AutoSuggest').should('be.visible')
      cy.get('#service-id').should('be.visible')
      cy.get('#route-id').should('be.visible')

      cy.getTestId('collapse-title')
        .contains('Plugin Configuration')
        .parents('.k-collapse')
        .first()
        .as('pluginFields')

      cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
        .contains('Advanced Parameters')
        .parents('.k-collapse.nested-collapse')
        .first()
        .as('advancedFields')

      cy.get('@pluginFields').find('#config-credentials').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      cy.get('@pluginFields').find('#config-preflight_continue').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      cy.get('@pluginFields').find('#config-private_network').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')

      // advanced plugin fields (they should be under the nested KCollapse)
      // instance name and tags
      cy.get('@advancedFields').find('#instance_name').should('exist').parent('.k-collapse').should('not.exist')
      cy.get('@advancedFields').find('#tags').should('exist').parent('.k-collapse').should('not.exist')
      // advanced fields should be hidden by default
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.hidden')
      // reveal them
      cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')
      // advanced fields
      cy.get('@advancedFields').find('#config-exposed_headers').should('be.visible')
      cy.get('@advancedFields').find('#config-headers').should('be.visible')
      cy.get('@advancedFields').find('#config-max_age').should('be.visible')
      cy.get('@advancedFields').find('#config-methods').should('be.visible')
      cy.get('@advancedFields').find('#config-origins').should('be.visible')
    })

    it('should show create form - mocking plugin', () => {
      interceptKMSchema({ mockData: schemaMocking })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKM,
          pluginType: 'mocking',
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // button state
      cy.getTestId('plugin-create-form-submit').should('be.visible')
      cy.getTestId('plugin-create-form-submit').should('be.enabled')
      cy.getTestId('plugin-create-form-cancel').should('be.visible')

      // pinned fields (but they should not be under a KCollapse)
      cy.get('#enabled').should('exist')
        .parent('.k-collapse').should('not.exist')

      // scope fields (this is also pinned, but they should not be under a KCollapse)
      cy.get('.field-selectionGroup').should('be.visible')
        .parent('.k-collapse').should('not.exist')
      cy.get('.Global-check').should('be.visible')
      cy.get('.Scoped-check').should('be.visible')
      cy.get('.field-selectionGroup').find('.field-AutoSuggest').should('not.be.visible')
      cy.get('.Scoped-check input').click()
      cy.get('.field-selectionGroup').find('.field-AutoSuggest').should('be.visible')
      cy.get('#service-id').should('be.visible')
      cy.get('#route-id').should('be.visible')

      cy.getTestId('collapse-title')
        .contains('Plugin Configuration')
        .parents('.k-collapse')
        .first()
        .as('pluginFields')

      cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
        .contains('Advanced Parameters')
        .parents('.k-collapse.nested-collapse')
        .first()
        .as('advancedFields')

      // non-advanced plugin fields (but they should not be under the nested KCollapse)
      // field rule alerts
      cy.get('@pluginFields').find('.plugin-field-rule-alerts').contains('At least one of').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      // protocol selector
      cy.get('@pluginFields').find('.plugin-protocols-select').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      // other required fields
      cy.get('@pluginFields').find('#config-required_non_checkbox_field').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      cy.get('@pluginFields').find('#config-api_specification').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      cy.get('@pluginFields').find('#config-api_specification_filename').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      cy.get('@pluginFields').find('#config-include_base_path').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      cy.get('@pluginFields').find('#config-random_status_code').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')

      // advanced plugin fields (they should be under the nested KCollapse)
      // instance name and tags
      cy.get('@advancedFields').find('#instance_name').should('exist').parent('.k-collapse').should('not.exist')
      cy.get('@advancedFields').find('#tags').should('exist').parent('.k-collapse').should('not.exist')
      // advanced fields should be hidden by default
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.hidden')
      // reveal them
      cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')
      // advanced fields
      cy.get('@advancedFields').find('#config-included_status_codes').should('be.visible')
      cy.get('@advancedFields').find('#config-max_delay_time').should('be.visible')
      cy.get('@advancedFields').find('#config-min_delay_time').should('be.visible')
    })

    it('should use legacy form when useLegacyForm in the plugin metadata is true', () => {
      interceptKMSchema({ mockData: schemaAiProxy })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKM,
          pluginType: 'ai-proxy',
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
      cy.get('.field-selectionGroup').should('be.visible')
      cy.get('.Global-check').should('be.visible')
      cy.get('.Scoped-check').should('be.visible')
      cy.get('.field-selectionGroup').find('.field-AutoSuggest').should('not.be.visible')
      cy.get('.Scoped-check input').click()
      cy.get('.field-selectionGroup').find('.field-AutoSuggest').should('be.visible')
      cy.get('#service-id').should('be.visible')
      cy.get('#route-id').should('be.visible')

      // legacy form should not contain any KCollapse elements
      cy.get('.k-collapse').should('not.exist')

      // some of the fields
      cy.get('#config-model-name').should('be.visible')
      cy.get('#config-model-provider').should('be.visible')
    })

    it('should show correct form components for custom plugin with arrays of objects', () => {
      interceptKMSchema({ mockData: customPluginSchema })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKM,
          pluginType: 'custom',
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
        .parents('.k-collapse.nested-collapse')
        .first()
        .as('advancedFields')
      cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')

      // array field
      cy.getTestId('add-config-discovery_uris').click()
      cy.get('#config-discovery_uris-issuer-0').should('have.attr', 'required')
      cy.get('#config-discovery_uris-requires_proxy-0').should('have.attr', 'type', 'checkbox').and('be.checked')
      cy.get('#config-discovery_uris-ssl_verify-0').should('have.attr', 'type', 'checkbox').and('not.be.checked')
      cy.get('#config-discovery_uris-timeout_ms-0').should('have.attr', 'type', 'number').and('have.value', '5000')
    })

    it('should hide scope selection when hideScopeSelection is true', () => {
      interceptKMSchema()

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKM,
          pluginType: 'cors',
          hideScopeSelection: true,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.get('.field-selectionGroup').should('not.exist')
    })

    it('should hide form buttons when isWizardStep is true', () => {
      interceptKMSchema()

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKM,
          pluginType: 'cors',
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

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          pluginType: 'acl',
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
      interceptKMScopedEntity({ entityType: config.entityType! })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          pluginType: 'cors',
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getScopedEntity']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.get('.Scoped-check input').should('be.visible')
        cy.get('.Scoped-check input').should('have.value', '1')
        cy.get('.field-selectionGroup .field-AutoSuggest').should('be.visible')
        cy.get('#service-id').should('be.visible')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')
      })
    })

    it('should pick correct url while creating plugin', () => {
      interceptKMSchema()
      interceptKMValidatePlugin()
      interceptKMCreatePlugin()

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKM,
          pluginType: 'cors',
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // reveal advanced fields
      cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
        .parents('.k-collapse.nested-collapse')
        .first()
        .as('advancedFields')
      cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')

      cy.get('#instance_name').type('kai_cors_plugin')
      cy.get('#tags').type('tag1,tag2')

      cy.getTestId('plugin-create-form-submit').click()
      cy.wait(['@validatePlugin', '@createPlugin'])
    })

    it('should pick correct url while creating plugin credential', () => {
      const config: KongManagerPluginFormConfig = { ...baseConfigKM, entityId: scopedConsumer.item.id, entityType: 'consumers' }
      interceptKMSchema({ credential: true, mockData: credentialSchema })
      interceptKMCreatePlugin({ credential: true, entityId: scopedConsumer.item.id })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          credential: true,
          pluginType: 'acl',
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
      interceptKMScopedEntity({ entityType: config.entityType! })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          pluginType: 'cors',
          pluginId: plugin1.id,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin', '@getScopedEntity']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // button state
        cy.getTestId('plugin-edit-form-submit').should('be.visible')
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')
        cy.getTestId('plugin-edit-form-cancel').should('be.visible')

        // reveal advanced fields
        cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
          .parents('.k-collapse.nested-collapse')
          .first()
          .as('advancedFields')
        cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
        cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')

        // scope
        cy.get('.Scoped-check input').should('be.visible')
        cy.get('.Scoped-check input').should('have.value', '1')
        cy.get('.field-selectionGroup .field-AutoSuggest').should('be.visible')
        cy.get('#service-id').should('be.visible')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')

        // global fields
        cy.get('#enabled').should('be.checked')
        cy.get('#instance_name').should('have.value', plugin1.instance_name)
        cy.get('#tags').should('have.value', plugin1.tags.join(','))

        // form fields
        cy.get('#config-private_network').should('be.checked')
      })
    })

    it('should pick correct submit url while editing plugin', () => {
      const config: KongManagerPluginFormConfig = { ...baseConfigKM, entityId: scopedService.id, entityType: 'services' }
      interceptKMSchema()
      interceptKMScopedEntity({ entityType: config.entityType! })
      interceptKMOperatePlugin({
        method: 'GET',
        alias: 'getPlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })
      interceptKMValidatePlugin()
      interceptKMOperatePlugin({
        method: 'PATCH',
        alias: 'updatePlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          pluginType: 'cors',
          pluginId: plugin1.id,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin', '@getScopedEntity']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // reveal advanced fields
        cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
          .parents('.k-collapse.nested-collapse')
          .first()
          .as('advancedFields')
        cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
        cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')

        cy.get('#tags').clear()

        cy.getTestId('plugin-edit-form-submit').click()

        cy.wait(['@validatePlugin', '@updatePlugin'])
      })
    })

    it('should pick correct submit url while editing plugin credential', () => {
      const config: KongManagerPluginFormConfig = { ...baseConfigKM, entityId: scopedConsumer.item.id, entityType: 'consumers' }
      interceptKMSchema({ credential: true, mockData: credentialSchema })
      interceptKMOperatePlugin({ method: 'GET', alias: 'getPlugin', credential: true, entityId: scopedConsumer.item.id, id: aclCredential1.id })
      interceptKMOperatePlugin({ method: 'PATCH', alias: 'updatePlugin', credential: true, entityId: scopedConsumer.item.id, id: aclCredential1.id })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          credential: true,
          pluginType: 'acl',
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
      interceptKMScopedEntity({ entityType: config.entityType! })
      interceptKMOperatePlugin({
        method: 'GET',
        alias: 'getPlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          pluginType: 'cors',
          pluginId: plugin1.id,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin', '@getScopedEntity']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // default button state
        cy.getTestId('plugin-edit-form-cancel').should('be.visible')
        cy.getTestId('plugin-edit-form-submit').should('be.visible')
        cy.getTestId('plugin-edit-form-cancel').should('be.enabled')
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')

        // reveal advanced fields
        cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
          .parents('.k-collapse.nested-collapse')
          .first()
          .as('advancedFields')
        cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
        cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')

        // enables save when form has changes
        cy.get('#instance_name').type('-edited')
        cy.getTestId('plugin-edit-form-submit').should('be.enabled')
        // disables save when form changes are undone
        cy.get('#instance_name').clear()
        cy.get('#instance_name').type(plugin1.instance_name)
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

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKM,
          pluginType: 'cors',
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

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKM,
          pluginId: 'i-dont-exist',
          pluginType: 'cors',
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
      cy.intercept(
        {
          method: 'POST',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/schemas/plugins/validate`,
        },
        {
          statusCode: 400,
          body: {
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
        },
      ).as('validate')

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKM,
          pluginType: 'mocking',
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.getTestId('plugin-create-form-submit').click()
      cy.wait('@validate')

      cy.getTestId('form-error').should('be.visible')
    })

    it('update event should be emitted when plugin was edited', () => {
      const config = { ...baseConfigKM, entityId: scopedService.id, entityType: 'services' }
      interceptKMSchema()
      interceptKMScopedEntity({ entityType: config.entityType })
      interceptKMOperatePlugin({ method: 'GET', alias: 'getPlugin', id: plugin1.id })
      interceptKMValidatePlugin()
      interceptKMOperatePlugin({ method: 'PATCH', alias: 'updatePlugin', id: plugin1.id })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKM,
          pluginType: 'cors',
          pluginId: plugin1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
        router,
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@getPluginSchema', '@getPlugin', '@getScopedEntity']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // reveal advanced fields
        cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
          .parents('.k-collapse.nested-collapse')
          .first()
          .as('advancedFields')
        cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
        cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')

        cy.get('#tags').clear()
        cy.get('#tags').type('tag1,tag2')

        cy.getTestId('plugin-edit-form-submit').click()

        cy.wait(['@validatePlugin', '@updatePlugin'])

        cy.get('@onUpdateSpy').should('have.been.calledOnce')
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
      interceptKonnectScopedEntityFallback()

      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/schemas/core-entities/plugins/*`,
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
    }): void => {
      const url = params?.credential
        ? `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/consumers/${params.entityId}/acls`
        : `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/plugins`

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

    const interceptKonnectValidatePlugin = (params?: {
      mockData?: object
      alias?: string
      status?: number
    }): void => {
      const url = `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/v1/schemas/json/plugin/validate`

      cy.intercept(
        {
          method: 'POST',
          url,
        },
        {
          statusCode: params?.status ?? 200,
          body: params?.mockData ?? plugin1,
        },
      ).as(params?.alias ?? 'validatePlugin')
    }

    const interceptKonnectScopedEntity = (params: {
      entityType: string
      mockData?: object
      alias?: string
    }) => {
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
    }

    // We just need to stub this call and we don't care about the response, otherwise it will fail occasionally
    const interceptKonnectScopedEntityFallback = () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/service?*`,
        },
        {
          statusCode: 200,
          body: { data: [] },
        },
      ).as('getScopedEntityFallback')
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
      interceptKonnectSchema()

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKonnect,
          pluginType: 'cors',
          useCustomNamesForPlugin: true,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // button state
      cy.getTestId('plugin-create-form-submit').should('be.visible')
      cy.getTestId('plugin-create-form-submit').should('be.enabled')
      cy.getTestId('plugin-create-form-cancel').should('be.visible')

      // pinned fields (but they should not be under a KCollapse)
      cy.get('#enabled').should('exist')
        .parent('.k-collapse').should('not.exist')

      // scope fields (this is also pinned, but they should not be under a KCollapse)
      cy.get('.field-selectionGroup').should('be.visible')
        .parent('.k-collapse').should('not.exist')
      cy.get('.Global-check').should('be.visible')
      cy.get('.Scoped-check').should('be.visible')
      cy.get('.field-selectionGroup').find('.field-AutoSuggest').should('not.be.visible')
      cy.get('.Scoped-check input').click()
      cy.get('.field-selectionGroup').find('.field-AutoSuggest').should('be.visible')
      cy.get('#service-id').should('be.visible')
      cy.get('#route-id').should('be.visible')

      cy.getTestId('collapse-title')
        .contains('Plugin Configuration')
        .parents('.k-collapse')
        .first()
        .as('pluginFields')

      cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
        .contains('Advanced Parameters')
        .parents('.k-collapse.nested-collapse')
        .first()
        .as('advancedFields')

      cy.get('@pluginFields').find('#config-credentials').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      cy.get('@pluginFields').find('#config-preflight_continue').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      cy.get('@pluginFields').find('#config-private_network').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')

      // advanced plugin fields (they should be under the nested KCollapse)
      // instance name and tags
      cy.get('@advancedFields').find('#instance_name').should('exist').parent('.k-collapse').should('not.exist')
      cy.get('@advancedFields').find('#tags').should('exist').parent('.k-collapse').should('not.exist')
      // advanced fields should be hidden by default
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.hidden')
      // reveal them
      cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')
      // advanced fields
      cy.get('@advancedFields').find('#config-exposed_headers').should('be.visible')
      cy.get('@advancedFields').find('#config-headers').should('be.visible')
      cy.get('@advancedFields').find('#config-max_age').should('be.visible')
      cy.get('@advancedFields').find('#config-methods').should('be.visible')
      cy.get('@advancedFields').find('#config-origins').should('be.visible')
    })

    it('should show create form - mocking plugin', () => {
      interceptKonnectSchema({ mockData: schemaMocking })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKonnect,
          pluginType: 'mocking',
          useCustomNamesForPlugin: true,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // button state
      cy.getTestId('plugin-create-form-submit').should('be.visible')
      cy.getTestId('plugin-create-form-submit').should('be.enabled')
      cy.getTestId('plugin-create-form-cancel').should('be.visible')

      // pinned fields (but they should not be under a KCollapse)
      cy.get('#enabled').should('exist')
        .parent('.k-collapse').should('not.exist')

      // scope fields (this is also pinned, but they should not be under a KCollapse)
      cy.get('.field-selectionGroup').should('be.visible')
        .parent('.k-collapse').should('not.exist')
      cy.get('.Global-check').should('be.visible')
      cy.get('.Scoped-check').should('be.visible')
      cy.get('.field-selectionGroup').find('.field-AutoSuggest').should('not.be.visible')
      cy.get('.Scoped-check input').click()
      cy.get('.field-selectionGroup').find('.field-AutoSuggest').should('be.visible')
      cy.get('#service-id').should('be.visible')
      cy.get('#route-id').should('be.visible')

      cy.getTestId('collapse-title')
        .contains('Plugin Configuration')
        .parents('.k-collapse')
        .first()
        .as('pluginFields')

      cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
        .contains('Advanced Parameters')
        .parents('.k-collapse.nested-collapse')
        .first()
        .as('advancedFields')

      // non-advanced plugin fields (but they should not be under the nested KCollapse)
      // field rule alerts
      cy.get('@pluginFields').find('.plugin-field-rule-alerts').contains('At least one of').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      // protocol selector
      cy.get('@pluginFields').find('.plugin-protocols-select').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      // other required fields
      cy.get('@pluginFields').find('#config-required_non_checkbox_field').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      cy.get('@pluginFields').find('#config-api_specification').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      cy.get('@pluginFields').find('#config-api_specification_filename').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      cy.get('@pluginFields').find('#config-include_base_path').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')
      cy.get('@pluginFields').find('#config-random_status_code').should('be.visible')
        .parent('.k-collapse.nested-collapse').should('not.exist')

      // advanced plugin fields (they should be under the nested KCollapse)
      // instance name and tags
      cy.get('@advancedFields').find('#instance_name').should('exist').parent('.k-collapse').should('not.exist')
      cy.get('@advancedFields').find('#tags').should('exist').parent('.k-collapse').should('not.exist')
      // advanced fields should be hidden by default
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.hidden')
      // reveal them
      cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')
      // advanced fields
      cy.get('@advancedFields').find('#config-included_status_codes').should('be.visible')
      cy.get('@advancedFields').find('#config-max_delay_time').should('be.visible')
      cy.get('@advancedFields').find('#config-min_delay_time').should('be.visible')
    })

    it('should use legacy form when useLegacyForm in the plugin metadata is true', () => {
      interceptKonnectSchema({ mockData: schemaAiProxy })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKonnect,
          pluginType: 'ai-proxy',
          useCustomNamesForPlugin: true,
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
      cy.get('.field-selectionGroup').should('be.visible')
      cy.get('.Global-check').should('be.visible')
      cy.get('.Scoped-check').should('be.visible')
      cy.get('.field-selectionGroup').find('.field-AutoSuggest').should('not.be.visible')
      cy.get('.Scoped-check input').click()
      cy.get('.field-selectionGroup').find('.field-AutoSuggest').should('be.visible')
      cy.get('#service-id').should('be.visible')
      cy.get('#route-id').should('be.visible')

      // legacy form should not contain any KCollapse elements
      cy.get('.k-collapse').should('not.exist')

      // some of the fields
      cy.get('#config-model-name').should('be.visible')
      cy.get('#config-model-provider').should('be.visible')
    })

    it('should show correct form components for custom plugin with arrays of objects', () => {
      interceptKonnectSchema({ mockData: customPluginSchema })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKonnect,
          pluginType: 'custom',
          useCustomNamesForPlugin: true,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
        .parents('.k-collapse.nested-collapse')
        .first()
        .as('advancedFields')
      cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')

      // array field
      cy.getTestId('add-config-discovery_uris').click()
      cy.get('#config-discovery_uris-issuer-0').should('have.attr', 'required')
      cy.get('#config-discovery_uris-requires_proxy-0').should('have.attr', 'type', 'checkbox').and('be.checked')
      cy.get('#config-discovery_uris-ssl_verify-0').should('have.attr', 'type', 'checkbox').and('not.be.checked')
      cy.get('#config-discovery_uris-timeout_ms-0').should('have.attr', 'type', 'number').and('have.value', '5000')
    })

    it('should hide scope selection when hideScopeSelection is true', () => {
      interceptKonnectSchema()

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKonnect,
          pluginType: 'cors',
          useCustomNamesForPlugin: true,
          hideScopeSelection: true,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.get('.field-selectionGroup').should('not.exist')
    })

    it('should hide form buttons when isWizardStep is true', () => {
      interceptKonnectSchema()

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKonnect,
          pluginType: 'cors',
          useCustomNamesForPlugin: true,
          isWizardStep: true,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.getTestId('plugin-create-form-submit').should('not.exist')
      cy.getTestId('plugin-create-form-cancel').should('not.exist')
    })

    it('should hide instance name field if useCustomNamesForPlugin is false', () => {
      interceptKonnectSchema()

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKonnect,
          pluginType: 'cors',
          useCustomNamesForPlugin: false,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.get('#instance_name').should('not.exist')
    })

    it('should show create form - acl credential', () => {
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedConsumer.item.id, entityType: 'consumers' }

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          pluginType: 'acl',
          credential: true,
          hideScopeSelection: true,
          useCustomNamesForPlugin: true,
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
      interceptKonnectSchema()
      interceptKonnectScopedEntity({ entityType: config.entityType! })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          pluginType: 'cors',
          useCustomNamesForPlugin: true,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getScopedEntity']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.get('.Scoped-check input').should('be.visible')
        cy.get('.Scoped-check input').should('have.value', '1')
        cy.get('.field-selectionGroup .field-AutoSuggest').should('be.visible')
        cy.get('#service-id').should('be.visible')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')
      })
    })

    it('should pick correct url while creating plugin', () => {
      interceptKonnectSchema()
      interceptKonnectValidatePlugin()
      interceptKonnectCreatePlugin()

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKonnect,
          pluginType: 'cors',
          useCustomNamesForPlugin: true,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // reveal advanced fields
      cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
        .parents('.k-collapse.nested-collapse')
        .first()
        .as('advancedFields')
      cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')

      cy.get('#instance_name').type('kai_cors_plugin')
      cy.get('#tags').type('tag1,tag2')

      cy.getTestId('plugin-create-form-submit').click()
      cy.wait(['@validatePlugin', '@createPlugin'])
    })

    it('should pick correct url while creating plugin credential', () => {
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedConsumer.item.id, entityType: 'consumers' }
      interceptKonnectCreatePlugin({ credential: true, entityId: scopedConsumer.item.id })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          credential: true,
          pluginType: 'acl',
          hideScopeSelection: true,
          useCustomNamesForPlugin: true,
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
      interceptKonnectScopedEntity({ entityType: config.entityType! })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          pluginType: 'cors',
          pluginId: plugin1.id,
          useCustomNamesForPlugin: true,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin', '@getScopedEntity']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // button state
        cy.getTestId('plugin-edit-form-submit').should('be.visible')
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')
        cy.getTestId('plugin-edit-form-cancel').should('be.visible')

        // reveal advanced fields
        cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
          .parents('.k-collapse.nested-collapse')
          .first()
          .as('advancedFields')
        cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
        cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')

        // scope
        cy.get('.Scoped-check input').should('be.visible')
        cy.get('.Scoped-check input').should('have.value', '1')
        cy.get('.field-selectionGroup .field-AutoSuggest').should('be.visible')
        cy.get('#service-id').should('be.visible')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')

        // global fields
        cy.get('#enabled').should('be.checked')
        cy.get('#instance_name').should('have.value', plugin1.instance_name)
        cy.get('#tags').should('have.value', plugin1.tags.join(','))

        // form fields
        cy.get('#config-private_network').should('be.checked')
      })
    })

    it('should pick correct submit url while editing plugin', () => {
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedService.id, entityType: 'services' }
      interceptKonnectSchema()
      interceptKonnectScopedEntity({ entityType: config.entityType! })
      interceptKonnectOperatePlugin({
        method: 'GET',
        alias: 'getPlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })
      interceptKonnectValidatePlugin()
      interceptKonnectOperatePlugin({
        method: 'PUT',
        alias: 'updatePlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          pluginType: 'cors',
          pluginId: plugin1.id,
          useCustomNamesForPlugin: true,
        },
        router,
      })

      // reveal advanced fields
      cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
        .parents('.k-collapse.nested-collapse')
        .first()
        .as('advancedFields')
      cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
      cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')

      cy.wait(['@getPluginSchema', '@getPlugin', '@getScopedEntity']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.get('#tags').clear()

        cy.getTestId('plugin-edit-form-submit').click()
        cy.wait(['@validatePlugin', '@updatePlugin'])
      })
    })

    it('should pick correct submit url while editing plugin credential', () => {
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedConsumer.item.id, entityType: 'consumers' }
      interceptKonnectScopedEntityFallback()
      interceptKonnectOperatePlugin({ method: 'GET', alias: 'getPlugin', credential: true, entityId: scopedConsumer.item.id, id: aclCredential1.id })
      interceptKonnectOperatePlugin({ method: 'PUT', alias: 'updatePlugin', credential: true, entityId: scopedConsumer.item.id, id: aclCredential1.id })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          credential: true,
          pluginType: 'acl',
          pluginId: aclCredential1.id,
          hideScopeSelection: true,
          useCustomNamesForPlugin: true,
        },
        router,
      })

      cy.wait('@getPlugin')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.get('#group').type('-edited')

      cy.getTestId('plugin-edit-form-submit').click()
      cy.wait('@updatePlugin')
    })

    it('should correctly handle button state - edit', () => {
      const config: KonnectPluginFormConfig = { ...baseConfigKonnect, entityId: scopedService.id, entityType: 'services' }
      interceptKonnectSchema()
      interceptKonnectScopedEntity({ entityType: config.entityType! })
      interceptKonnectOperatePlugin({
        method: 'GET',
        alias: 'getPlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config,
          pluginType: 'cors',
          pluginId: plugin1.id,
          useCustomNamesForPlugin: true,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin', '@getScopedEntity']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // default button state
        cy.getTestId('plugin-edit-form-cancel').should('be.visible')
        cy.getTestId('plugin-edit-form-submit').should('be.visible')
        cy.getTestId('plugin-edit-form-cancel').should('be.enabled')
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')

        // reveal advanced fields
        cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
          .parents('.k-collapse.nested-collapse')
          .first()
          .as('advancedFields')
        cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
        cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')

        // enables save when form has changes
        cy.get('#instance_name').type('-edited')
        cy.getTestId('plugin-edit-form-submit').should('be.enabled')
        // disables save when form changes are undone
        cy.get('#instance_name').clear()
        cy.get('#instance_name').type(plugin1.instance_name)
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')
      })
    })

    it('should handle error state - failed to load schema', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/schemas/core-entities/plugins/cors`,
        },
        {
          statusCode: 500,
          body: {
            code: 3,
            message: 'Error: could not load schema',
          },
        },
      ).as('getPluginSchema')

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKonnect,
          pluginType: 'cors',
          useCustomNamesForPlugin: true,
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

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKonnect,
          pluginId: 'i-dont-exist',
          pluginType: 'cors',
          useCustomNamesForPlugin: true,
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
      cy.intercept(
        {
          method: 'POST',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/v1/schemas/json/plugin/validate`,
        },
        {
          statusCode: 400,
          body: {
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
        },
      ).as('validate')

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKonnect,
          pluginType: 'mocking',
          useCustomNamesForPlugin: true,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.getTestId('plugin-create-form-submit').click()
      cy.wait('@validate')

      cy.getTestId('form-error').should('be.visible')
    })

    it('update event should be emitted when plugin was edited', () => {
      const config = { ...baseConfigKonnect, entityId: scopedService.id, entityType: 'services' }
      interceptKonnectSchema()
      interceptKonnectScopedEntity({ entityType: config.entityType })
      interceptKonnectOperatePlugin({ method: 'GET', alias: 'getPlugin', id: plugin1.id })
      interceptKonnectValidatePlugin()
      interceptKonnectOperatePlugin({ method: 'PUT', alias: 'updatePlugin', id: plugin1.id })

      cy.mount(PluginForm, {
        global: { components: { VueFormGenerator } },
        props: {
          config: baseConfigKonnect,
          pluginType: 'cors',
          pluginId: plugin1.id,
          useCustomNamesForPlugin: true,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
        router,
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@getPluginSchema', '@getPlugin']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        // reveal advanced fields
        cy.get('.k-collapse.nested-collapse [data-testid="collapse-trigger-label"]')
          .parents('.k-collapse.nested-collapse')
          .first()
          .as('advancedFields')
        cy.get('@advancedFields').findTestId('collapse-trigger-content').click()
        cy.get('@advancedFields').findTestId('collapse-hidden-content').should('be.visible')

        cy.get('#tags').clear()
        cy.get('#tags').type('tag1,tag2')

        cy.getTestId('plugin-edit-form-submit').click()

        cy.wait(['@validatePlugin', '@updatePlugin']).then(() => {
          cy.get('@onUpdateSpy').should('have.been.calledOnce')
        })
      })
    })
  })
})
