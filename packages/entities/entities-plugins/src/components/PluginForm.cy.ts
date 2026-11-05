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
import schemaCors from '../../fixtures/schemas/cors'
import schemaMocking from '../../fixtures/schemas/mocking'
import schemaOidc from '../../fixtures/schemas/oidc'
import schemaRateLimiting from '../../fixtures/schemas/rate-limiting'
import PluginForm from './PluginForm.vue'
import { PLUGIN_METADATA } from '../definitions/metadata'
import basicAuthCredentialSchema from '../definitions/schemas/credentials/mockedBasicAuthSchema.json'
import jwtCredentialSchema from '../definitions/schemas/credentials/mockedJwtSchema.json'
import keyAuthCredentialSchema from '../definitions/schemas/credentials/mockedKeyAuthSchema.json'
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
        return `@getEntity-${entityType}` as const
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

      // free-form layout
      cy.get('.kong-ui-entities-plugin-form-container').should('have.class', 'new-form-layout')
      cy.getTestId('form-section-plugin-scope').should('be.visible')
      cy.getTestId('form-section-plugin-config').should('be.visible')
      cy.getTestId('form-section-general-info').should('be.visible')

      // scope fields
      cy.get('.k-radio').should('have.length', 2)
      cy.get('.scope-detail').should('not.be.visible')
      cy.get('.k-radio').eq(1).click()
      cy.get('.scope-detail').should('be.visible')
      cy.getTestId('ff-service').should('be.visible')
      cy.getTestId('ff-route').should('be.visible')

      // general fields
      cy.getTestId('ff-enabled').should('exist')
      cy.getTestId('ff-instance_name').should('be.visible')
      cy.getTestId('ff-tags').should('be.visible')

      // plugin config fields
      cy.getTestId('ff-config.credentials').should('exist')
      cy.getTestId('ff-config.private_network').should('exist')
      cy.getTestId('ff-array-config.origins').should('exist')
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

      // free-form layout
      cy.get('.kong-ui-entities-plugin-form-container').should('have.class', 'new-form-layout')
      cy.getTestId('form-section-plugin-scope').should('be.visible')
      cy.getTestId('form-section-plugin-config').should('be.visible')
      cy.getTestId('form-section-general-info').should('be.visible')

      // general fields
      cy.getTestId('ff-enabled').should('exist')
      cy.getTestId('ff-protocols').should('exist')

      // plugin config fields
      cy.getTestId('ff-config.api_specification').should('exist')
      cy.getTestId('ff-config.include_base_path').should('exist')
      cy.getTestId('ff-config.random_status_code').should('exist')
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

      cy.get('.kong-ui-entities-plugin-form-container').should('have.class', 'new-form-layout')
      cy.getTestId('ff-array-config.discovery_uris').should('exist')
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

        cy.get('.k-radio').eq(0).find('input').should('be.disabled')
        cy.get('.k-radio').eq(1).find('input').should('be.checked').and('be.disabled')
        cy.get('.k-radio').eq(1).find('input').should('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').find('input').should('be.visible').and('be.disabled')
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

        cy.get('.k-radio').eq(1).find('input').should('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').find('input').should('be.visible').and('be.disabled')
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
      cy.getTestId('form-section-plugin-scope').should('not.exist')
      cy.getTestId('ff-enabled').should('not.exist')
      cy.getTestId('ff-instance_name').should('not.exist')
      cy.getTestId('ff-protocols').should('not.exist')

      // form fields
      cy.getTestId('ff-group').should('be.visible')
      cy.getTestId('ff-tags').should('be.visible')
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

        cy.get('.k-radio').eq(1).find('input').should('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').find('input').should('be.visible')
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
        },
        router,
      })

      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.wait('@getPluginSchema')

      cy.getTestId('ff-group').type('kai_group')
      cy.getTestId('ff-tags').type('tag1,tag2')

      cy.getTestId('plugin-create-form-submit').click()
      cy.wait('@createPlugin').its('request.body').should('deep.equal', {
        group: 'kai_group',
        tags: ['tag1', 'tag2'],
        consumer: { id: scopedConsumer.item.id },
      })
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
        cy.getTestId('plugin-edit-form-submit').should('be.visible')
        cy.getTestId('plugin-edit-form-cancel').should('be.visible')

        // scope
        cy.get('.k-radio').eq(1).find('input').should('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').find('input').should('be.visible')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')

        // global fields
        cy.getTestId('ff-enabled').find('input[type="checkbox"]').should('be.checked')
        cy.getTestId('ff-instance_name').should('have.value', plugin1.instance_name)
        cy.getTestId('ff-tags').should('have.value', plugin1.tags.join(', '))

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
      interceptKMOperatePlugin({ method: 'GET', alias: 'getPlugin', credential: true, entityId: scopedConsumer.item.id, id: aclCredential1.id, mockData: aclCredential1 })
      interceptKMOperatePlugin({ method: 'PATCH', alias: 'updatePlugin', credential: true, entityId: scopedConsumer.item.id, id: aclCredential1.id, mockData: aclCredential1 })
      const pluginType = 'acl'

      cy.mount(PluginForm, {
        props: {
          config,
          credential: true,
          pluginType,
          pluginId: aclCredential1.id,
        },
        router,
      })

      cy.wait(['@getPluginSchema', '@getPlugin']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.getTestId('ff-group').should('have.value', aclCredential1.group)
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')

        cy.getTestId('ff-group').type('-edited')
        cy.getTestId('plugin-edit-form-submit').should('be.enabled')

        cy.getTestId('plugin-edit-form-submit').click()
        cy.wait('@updatePlugin').its('request.body').should('deep.equal', {
          group: `${aclCredential1.group}-edited`,
          consumer: { id: scopedConsumer.item.id },
        })
      })
    })

    describe('credentials', () => {
      const credentialConfig: KongManagerPluginFormConfig = {
        ...baseConfigKM,
        entityId: scopedConsumer.item.id,
        entityType: 'consumers',
      }
      const credentialUrl = (endpoint: string, id?: string): string =>
        `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/consumers/${scopedConsumer.item.id}/${endpoint}${id ? `/${id}` : ''}`

      it('should blank the password and only enable save after changes when editing basic-auth credential', () => {
        const credential = {
          id: 'basic-auth-credential-id',
          consumer: { id: scopedConsumer.item.id },
          created_at: 1700516447,
          username: 'kai',
          password: 'hashed-password',
          tags: ['tag1'],
        }
        interceptKMSchema({ credential: true, mockData: basicAuthCredentialSchema })
        cy.intercept('GET', credentialUrl('basic-auth', credential.id), { statusCode: 200, body: credential }).as('getCredential')
        cy.intercept('PATCH', credentialUrl('basic-auth', credential.id), { statusCode: 200, body: credential }).as('updateCredential')

        cy.mount(PluginForm, {
          props: {
            config: credentialConfig,
            credential: true,
            pluginType: 'basic-auth',
            pluginId: credential.id,
          },
          router,
        })

        cy.wait(['@getPluginSchema', '@getCredential'])

        cy.getTestId('ff-username').should('have.value', 'kai')
        // FTI-6248: the hashed password returned by the backend must not be shown or sent back
        cy.getTestId('ff-password').should('have.value', '')
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')

        cy.getTestId('ff-password').type('new-password')
        cy.getTestId('plugin-edit-form-submit').should('be.enabled').click()

        cy.wait('@updateCredential').its('request.body').should('deep.equal', {
          username: 'kai',
          password: 'new-password',
          tags: ['tag1'],
          consumer: { id: scopedConsumer.item.id },
        })
      })

      it('should not send the blank password when editing other basic-auth credential fields', () => {
        const credential = {
          id: 'basic-auth-credential-id',
          consumer: { id: scopedConsumer.item.id },
          created_at: 1700516447,
          username: 'kai',
          password: 'hashed-password',
          tags: ['tag1'],
        }
        interceptKMSchema({ credential: true, mockData: basicAuthCredentialSchema })
        cy.intercept('GET', credentialUrl('basic-auth', credential.id), { statusCode: 200, body: credential }).as('getCredential')
        cy.intercept('PATCH', credentialUrl('basic-auth', credential.id), { statusCode: 200, body: credential }).as('updateCredential')

        cy.mount(PluginForm, {
          props: {
            config: credentialConfig,
            credential: true,
            pluginType: 'basic-auth',
            pluginId: credential.id,
          },
          router,
        })

        cy.wait(['@getPluginSchema', '@getCredential'])

        cy.getTestId('ff-username').type('-edited')
        cy.getTestId('plugin-edit-form-submit').should('be.enabled').click()

        cy.wait('@updateCredential').its('request.body').should('deep.equal', {
          username: 'kai-edited',
          tags: ['tag1'],
          consumer: { id: scopedConsumer.item.id },
        })
      })

      it('should keep the stored RSA public key when editing a JWT credential with a symmetric algorithm', () => {
        const credential = {
          id: 'jwt-credential-id',
          consumer: { id: scopedConsumer.item.id },
          created_at: 1700516447,
          key: 'jwt-key',
          algorithm: 'HS256',
          secret: 'jwt-secret',
          rsa_public_key: '-----BEGIN PUBLIC KEY-----',
          tags: ['tag1'],
        }
        interceptKMSchema({ credential: true, mockData: jwtCredentialSchema })
        cy.intercept('GET', credentialUrl('jwt', credential.id), { statusCode: 200, body: credential }).as('getCredential')
        cy.intercept('PATCH', credentialUrl('jwt', credential.id), { statusCode: 200, body: credential }).as('updateCredential')

        cy.mount(PluginForm, {
          props: {
            config: credentialConfig,
            credential: true,
            pluginType: 'jwt',
            pluginId: credential.id,
          },
          router,
        })

        cy.wait(['@getPluginSchema', '@getCredential'])

        cy.getTestId('ff-rsa_public_key').should('not.be.visible')
        cy.getTestId('ff-tags').clear()
        cy.getTestId('ff-tags').type('tag2')
        cy.getTestId('plugin-edit-form-submit').should('be.enabled').click()

        cy.wait('@updateCredential').its('request.body').should((body) => {
          expect(body).to.not.have.property('rsa_public_key')
          expect(body.tags).to.deep.equal(['tag2'])
        })
      })

      it('should only show the RSA public key for asymmetric JWT algorithms', () => {
        cy.viewport(800, 1200)
        interceptKMSchema({ credential: true, mockData: jwtCredentialSchema })
        cy.intercept('POST', credentialUrl('jwt'), { statusCode: 200, body: { id: 'jwt-credential-id' } }).as('createCredential')

        cy.mount(PluginForm, {
          props: {
            config: credentialConfig,
            credential: true,
            pluginType: 'jwt',
          },
          router,
        })

        cy.wait('@getPluginSchema')

        // `HS256` is the default algorithm
        cy.getTestId('ff-rsa_public_key').should('not.be.visible')

        cy.getTestId('ff-algorithm').click()
        cy.getTestId('select-item-RS256').scrollIntoView()
        cy.getTestId('select-item-RS256').click()
        cy.getTestId('ff-rsa_public_key').should('be.visible')
        cy.getTestId('ff-rsa_public_key').type('-----BEGIN PUBLIC KEY-----', { delay: 0 })

        cy.getTestId('plugin-create-form-submit').click()
        cy.wait('@createCredential').its('request.body').should('deep.include', {
          algorithm: 'RS256',
          rsa_public_key: '-----BEGIN PUBLIC KEY-----',
        })

        cy.getTestId('ff-algorithm').click()
        cy.getTestId('select-item-HS384').scrollIntoView()
        cy.getTestId('select-item-HS384').click()
        cy.getTestId('ff-rsa_public_key').should('not.be.visible')
      })

      it('should submit key-auth credential with `ttl: 0` when ttl is cleared', () => {
        interceptKMSchema({ credential: true, mockData: keyAuthCredentialSchema })
        cy.intercept('POST', credentialUrl('key-auth'), { statusCode: 200, body: { id: 'key-auth-credential-id' } }).as('createCredential')

        cy.mount(PluginForm, {
          props: {
            config: credentialConfig,
            credential: true,
            pluginType: 'key-auth',
          },
          router,
        })

        cy.wait('@getPluginSchema')

        cy.getTestId('ff-ttl').type('10')
        cy.getTestId('ff-ttl').clear()

        cy.getTestId('plugin-create-form-submit').click()
        cy.wait('@createCredential').its('request.body').should('deep.include', { ttl: 0 })
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
        cy.getTestId('plugin-edit-form-cancel').should('be.visible')
        cy.getTestId('plugin-edit-form-submit').should('be.visible')
        cy.getTestId('plugin-edit-form-cancel').should('be.enabled')

        // disables save when form has no changes
        cy.getTestId('ff-instance_name').should('have.value', plugin1.instance_name)
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')

        // enables save when form has changes
        cy.getTestId('ff-instance_name').type('-edited')
        cy.getTestId('plugin-edit-form-submit').should('be.enabled')

        // disables save again when the change is reverted
        cy.getTestId('ff-instance_name').clear()
        cy.getTestId('ff-instance_name').type(plugin1.instance_name)
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')
      })
    })

    it('should keep save enabled for changes made while saving - edit', () => {
      const config: KongManagerPluginFormConfig = { ...baseConfigKM, entityId: scopedService.id, entityType: 'services' }
      interceptKMSchema()
      interceptKMOperatePlugin({
        method: 'GET',
        alias: 'getPlugin',
        id: plugin1.id,
        entityId: scopedService.id,
        entityType: 'services',
      })
      cy.intercept(
        {
          method: 'PATCH',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/services/${scopedService.id}/plugins/${plugin1.id}`,
        },
        {
          statusCode: 200,
          body: plugin1,
          delay: 500,
        },
      ).as('updatePlugin')
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
        cy.getTestId('ff-instance_name').type('-saved')
        cy.getTestId('plugin-edit-form-submit').click()

        // change the form while the request is pending
        cy.getTestId('ff-instance_name').type('-unsaved')

        cy.wait('@updatePlugin').its('request.body.instance_name').should('equal', `${plugin1.instance_name}-saved`)
        cy.getTestId('plugin-edit-form-submit').should('be.enabled')
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
          cy.getTestId('view-general-info-additional-settings').should(assertion)
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
        return `@getEntity-${entityType}` as const
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

      // free-form layout
      cy.get('.kong-ui-entities-plugin-form-container').should('have.class', 'new-form-layout')
      cy.getTestId('form-section-plugin-scope').should('be.visible')
      cy.getTestId('form-section-plugin-config').should('be.visible')
      cy.getTestId('form-section-general-info').should('be.visible')

      // scope fields
      cy.get('.k-radio').should('have.length', 2)
      cy.get('.scope-detail').should('not.be.visible')
      cy.get('.k-radio').eq(1).click()
      cy.get('.scope-detail').should('be.visible')
      cy.getTestId('ff-service').should('be.visible')
      cy.getTestId('ff-route').should('be.visible')

      // general fields
      cy.getTestId('ff-enabled').should('exist')
      cy.getTestId('ff-instance_name').should('be.visible')
      cy.getTestId('ff-tags').should('be.visible')

      // plugin config fields
      cy.getTestId('ff-config.credentials').should('exist')
      cy.getTestId('ff-config.private_network').should('exist')
      cy.getTestId('ff-array-config.origins').should('exist')
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

      // free-form layout
      cy.get('.kong-ui-entities-plugin-form-container').should('have.class', 'new-form-layout')
      cy.getTestId('form-section-plugin-scope').should('be.visible')
      cy.getTestId('form-section-plugin-config').should('be.visible')
      cy.getTestId('form-section-general-info').should('be.visible')

      // general fields
      cy.getTestId('ff-enabled').should('exist')
      cy.getTestId('ff-protocols').should('exist')

      // plugin config fields
      cy.getTestId('ff-config.api_specification').should('exist')
      cy.getTestId('ff-config.include_base_path').should('exist')
      cy.getTestId('ff-config.random_status_code').should('exist')
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

      cy.get('.kong-ui-entities-plugin-form-container').should('have.class', 'new-form-layout')
      cy.getTestId('ff-array-config.discovery_uris').should('exist')
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

        cy.get('.k-radio').eq(0).find('input').should('be.disabled')
        cy.get('.k-radio').eq(1).find('input').should('be.checked').and('be.disabled')
        cy.get('.k-radio').eq(1).find('input').should('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').find('input').should('be.visible').and('be.disabled')
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

        cy.get('.k-radio').eq(1).find('input').should('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').find('input').should('be.visible').and('be.disabled')
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
        },
        router,
      })

      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      // button state
      cy.getTestId('plugin-create-form-submit').should('be.visible')
      cy.getTestId('plugin-create-form-submit').should('be.enabled')
      cy.getTestId('plugin-create-form-cancel').should('be.visible')

      // scope & global fields
      cy.getTestId('form-section-plugin-scope').should('not.exist')
      cy.getTestId('ff-enabled').should('not.exist')
      cy.getTestId('ff-instance_name').should('not.exist')
      cy.getTestId('ff-protocols').should('not.exist')

      // form fields
      cy.getTestId('ff-group').should('be.visible')
      cy.getTestId('ff-tags').should('be.visible')
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

        cy.get('.k-radio').eq(1).find('input').should('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').find('input').should('be.visible')
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
        },
        router,
      })

      cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

      cy.getTestId('ff-group').type('kai_group')
      cy.getTestId('ff-tags').type('tag1,tag2')

      cy.getTestId('plugin-create-form-submit').click()
      cy.wait('@createPlugin').its('request.body').should('deep.equal', {
        group: 'kai_group',
        tags: ['tag1', 'tag2'],
        consumer: { id: scopedConsumer.item.id },
      })
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
        cy.getTestId('plugin-edit-form-submit').should('be.visible')
        cy.getTestId('plugin-edit-form-cancel').should('be.visible')

        // scope
        cy.get('.k-radio').eq(1).find('input').should('be.checked')
        cy.get('.scope-detail').should('be.visible')
        cy.getTestId('ff-service').find('input').should('be.visible')
        cy.getTestId(`select-item-${scopedService.id}`).find('.selected').should('exist')

        // global fields
        cy.getTestId('ff-enabled').find('input[type="checkbox"]').should('be.checked')
        cy.getTestId('ff-instance_name').should('have.value', plugin1.instance_name)
        cy.getTestId('ff-tags').should('have.value', plugin1.tags.join(', '))

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
      interceptKonnectOperatePlugin({ method: 'GET', alias: 'getPlugin', credential: true, entityId: scopedConsumer.item.id, id: aclCredential1.id, mockData: aclCredential1 })
      interceptKonnectOperatePlugin({ method: 'PUT', alias: 'updatePlugin', credential: true, entityId: scopedConsumer.item.id, id: aclCredential1.id, mockData: aclCredential1 })

      cy.mount(PluginForm, {
        props: {
          config,
          credential: true,
          pluginType,
          pluginId: aclCredential1.id,
        },
        router,
      })

      cy.wait(['@getPlugin']).then(() => {
        cy.get('.kong-ui-entities-plugin-form-container').should('be.visible')

        cy.getTestId('ff-group').should('have.value', aclCredential1.group)
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')

        cy.getTestId('ff-group').type('-edited')
        cy.getTestId('plugin-edit-form-submit').should('be.enabled')

        cy.getTestId('plugin-edit-form-submit').click()
        cy.wait('@updatePlugin').its('request.body').should('deep.equal', {
          group: `${aclCredential1.group}-edited`,
          consumer: { id: scopedConsumer.item.id },
        })
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
        cy.getTestId('plugin-edit-form-cancel').should('be.visible')
        cy.getTestId('plugin-edit-form-submit').should('be.visible')
        cy.getTestId('plugin-edit-form-cancel').should('be.enabled')

        // disables save when form has no changes
        cy.getTestId('ff-instance_name').should('have.value', plugin1.instance_name)
        cy.getTestId('plugin-edit-form-submit').should('be.disabled')

        // enables save when form has changes
        cy.getTestId('ff-instance_name').type('-edited')
        cy.getTestId('plugin-edit-form-submit').should('be.enabled')

        // disables save again when the change is reverted
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

  describe('Form engine', () => {
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

    it('should render free-form for a plugin with a free-form config, without any opt-in', () => {
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
      cy.get('.kong-ui-entities-plugin-form-container').should('have.class', 'new-form-layout')
      cy.get('[data-testid^="ff-"]').should('exist')
      cy.get('.vue-form-generator').should('not.exist')
    })

    it('should render free-form for a custom plugin without a free-form config', () => {
      const pluginType = 'my-custom-plugin'
      interceptKonnectSchema({ mockData: customPluginSchema })

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginType,
        },
        router,
      })

      cy.wait('@getPluginSchema')
      cy.get('.kong-ui-entities-plugin-form-container').should('have.class', 'new-form-layout')
      cy.get('[data-testid^="ff-"]').should('exist')
      cy.get('.vue-form-generator').should('not.exist')
    })

    describe('Cloned plugins', () => {
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
          params.status
            ? { statusCode: params.status, body: { message: 'Error' } }
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

      it('renders free-form for a non-cloned custom plugin', () => {
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
        cy.get('[data-testid^="ff-"]').should('exist')
      })

      it('still renders the form when the cloned plugin lookup fails', () => {
        // A bundled plugin missing from PLUGIN_METADATA is treated as custom, and the backend
        // rejects bundled names on the cloned-plugins endpoint with a 400.
        const pluginType = 'my-custom-plugin'
        interceptKonnectSchema({ mockData: customPluginSchema })
        interceptClonedPlugin({ pluginName: pluginType, status: 400 })

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
        cy.getTestId('plugin-form-schema-error').should('not.exist')
        cy.get('[data-testid^="ff-"]').should('exist')
      })

      ;[
        { pluginType: 'rate-limiting-clone', source: 'rate-limiting', schema: schemaRateLimiting },
        { pluginType: 'cors-clone', source: 'cors', schema: schemaCors },
        { pluginType: 'oidc-clone', source: 'openid-connect', schema: schemaOidc },
      ].forEach(({ pluginType, source, schema }) => {
        it(`renders free-form for a cloned plugin of ${source}`, () => {
          interceptKonnectSchema({ mockData: schema })
          interceptClonedPlugin({ pluginName: pluginType, ref: source })

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
          cy.get('.kong-ui-entities-plugin-form-container').should('have.class', 'new-form-layout')
          cy.get('[data-testid^="ff-"]').should('exist')
          cy.get('.vue-form-generator').should('not.exist')
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
          cy.getTestId('view-general-info-additional-settings').should(assertion)
        })
      })
    })
  })
})
