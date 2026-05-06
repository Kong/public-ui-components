import type { Router } from 'vue-router'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { KonnectCustomPluginFormConfig, KongManagerCustomPluginFormConfig } from '../types'
import CustomPluginForm from './CustomPluginForm.vue'

const konnectConfig: KonnectCustomPluginFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: 'test-cp-id',
  cancelRoute: { name: 'home' },
  successRoute: { name: 'home' },
  clonablePlugins: ['cors', 'acl', 'basic-auth'],
}

const kongManagerConfig: KongManagerCustomPluginFormConfig = {
  app: 'kongManager',
  apiBaseUrl: '/kong-manager',
  workspace: 'default',
  cancelRoute: { name: 'home' },
  successRoute: { name: 'home' },
}

const installedPluginResponse = {
  item: {
    lua_schema: 'return { name = "my-plugin", fields = {} }',
    name: 'my-plugin',
    created_at: 1700000000,
    updated_at: 1700000001,
  },
}

const streamedPluginResponse = {
  id: 'streamed-1',
  name: 'my-streamed-plugin',
  schema: 'return { name = "my-streamed-plugin", fields = {} }',
  handler: 'local MyHandler = {}\nfunction MyHandler:access(conf)\nend\nreturn MyHandler',
  created_at: 1700000000,
  updated_at: 1700000001,
}

const clonedPluginResponse = {
  ref: 'acl',
  name: 'my-cloned-plugin',
  priority: 0,
  tags: null,
  created_at: 1700000000,
  updated_at: 1700000001,
}

const selectClonedPlugin = (pluginName: string): void => {
  cy.getTestId('custom-plugin-clone-select').click()
  cy.getTestId(`select-item-${pluginName}`).click()
}

describe('<CustomPluginForm />', () => {
  let router: Router

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'home',
          component: { template: '<div>Home</div>' },
        },
      ],
    })
  })

  describe('Konnect - Create Mode', () => {
    it('should render form with all steps visible', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
        },
        router,
      })

      // Step 1 should be visible
      cy.contains('h2', 'Custom plugin type').should('exist')

      // Plugin type radio buttons should be visible
      cy.getTestId('custom-plugin-type-installed').should('exist')
      cy.getTestId('custom-plugin-type-streamed').should('exist')
      cy.getTestId('custom-plugin-type-cloned').should('exist')

      // Submit and cancel buttons should be visible
      cy.getTestId('custom-plugin-form-submit').should('exist')
      cy.getTestId('custom-plugin-form-cancel').should('exist')

      cy.get('.kong-ui-entity-base-form').should('have.class', 'new-form-layout')
    })

    it('should show step 2 files for installed type', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
        },
        router,
      })

      // Select installed type
      cy.getTestId('custom-plugin-type-installed').click()

      // Step 2 should be visible with schema file upload
      cy.getTestId('custom-plugin-schema-upload').should('exist')

      // Step 3 should not be visible for installed type
      cy.getTestId('custom-plugin-name').should('not.exist')
    })

    it('should show step 2 and 3 for streamed type', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
        },
        router,
      })

      // Select streamed type
      cy.getTestId('custom-plugin-type-streamed').click()

      // Step 2 should show both schema and handler uploads
      cy.getTestId('custom-plugin-schema-upload').should('exist')
      cy.getTestId('custom-plugin-handler-upload').should('exist')

      // Step 3 should show name input
      cy.getTestId('custom-plugin-name').should('exist')
    })

    it('should show step 2 and 3 for cloned type', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
        },
        router,
      })

      // Select cloned type
      cy.getTestId('custom-plugin-type-cloned').click()

      // Step 2 should show plugin select
      cy.getTestId('custom-plugin-clone-select').should('exist')

      // Step 3 should show alias name and priority
      cy.getTestId('custom-plugin-alias-name').should('exist')
      cy.getTestId('custom-plugin-priority').should('exist')
    })

    it('should reset fields when switching plugin type', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
        },
        router,
      })

      // Select streamed type and enter name
      cy.getTestId('custom-plugin-type-streamed').click()
      cy.getTestId('custom-plugin-name').type('test-plugin')
      cy.getTestId('custom-plugin-name').should('have.value', 'test-plugin')

      // Switch to installed type
      cy.getTestId('custom-plugin-type-installed').click()

      // Name field should be reset
      cy.getTestId('custom-plugin-name').should('not.exist')
    })

    it('should disable submit button when required fields are empty', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
        },
        router,
      })

      // Select installed type
      cy.getTestId('custom-plugin-type-installed').click()

      // Submit should be disabled without schema file
      cy.getTestId('custom-plugin-form-submit').should('be.disabled')
    })

    it('should submit installed plugin via API', () => {
      cy.intercept(
        'POST',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/plugin-schemas`,
        {
          statusCode: 201,
          body: installedPluginResponse,
        },
      ).as('createInstalledPlugin')

      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
        },
        router,
      })

      // Select installed type
      cy.getTestId('custom-plugin-type-installed').click()

      // Upload a schema file
      cy.getTestId('custom-plugin-schema-upload').find('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('return { name = "test", fields = {} }'),
        fileName: 'schema.lua',
      }, { force: true })

      // Submit should be enabled after file upload
      cy.getTestId('custom-plugin-form-submit').should('be.enabled')
      cy.getTestId('custom-plugin-form-submit').click()

      cy.wait('@createInstalledPlugin').then((interception) => {
        expect(interception.request.body.lua_schema).to.contain('return')
      })
    })

    it('should submit streamed plugin via API', () => {
      cy.intercept(
        'POST',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/custom-plugins`,
        {
          statusCode: 201,
          body: streamedPluginResponse,
        },
      ).as('createStreamedPlugin')

      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
        },
        router,
      })

      // Select streamed type
      cy.getTestId('custom-plugin-type-streamed').click()

      // Upload schema file
      cy.getTestId('custom-plugin-schema-upload').find('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('return { name = "test", fields = {} }'),
        fileName: 'schema.lua',
      }, { force: true })

      // Upload handler file
      cy.getTestId('custom-plugin-handler-upload').find('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('local M = {}\nreturn M'),
        fileName: 'handler.lua',
      }, { force: true })

      // Enter plugin name
      cy.getTestId('custom-plugin-name').type('my-streamed')

      // Submit
      cy.getTestId('custom-plugin-form-submit').should('be.enabled')
      cy.getTestId('custom-plugin-form-submit').click()

      cy.wait('@createStreamedPlugin').then((interception) => {
        expect(interception.request.body.name).to.equal('my-streamed')
        expect(interception.request.body.schema).to.contain('return')
        expect(interception.request.body.handler).to.contain('local M')
      })
    })

    it('should submit cloned plugin via API without priority when left empty', () => {
      const aliasName = 'my-created-cloned-plugin'

      cy.intercept(
        'PUT',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/cloned-plugins/${aliasName}`,
        {
          statusCode: 201,
          body: {
            ...clonedPluginResponse,
            ref: 'acl',
            name: aliasName,
            priority: null,
          },
        },
      ).as('createClonedPlugin')

      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
        },
        router,
      })

      cy.getTestId('custom-plugin-type-cloned').click()
      selectClonedPlugin('acl')
      cy.getTestId('custom-plugin-alias-name').type(aliasName)

      cy.getTestId('custom-plugin-form-submit').should('be.enabled').click()

      cy.wait('@createClonedPlugin').then((interception) => {
        expect(interception.request.method).to.equal('PUT')
        expect(interception.request.body).to.deep.equal({
          ref: 'acl',
        })
      })
    })

    it('should submit cloned plugin via API with priority 0', () => {
      const aliasName = 'my-created-cloned-plugin-zero'

      cy.intercept(
        'PUT',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/cloned-plugins/${aliasName}`,
        {
          statusCode: 201,
          body: {
            ...clonedPluginResponse,
            name: aliasName,
            priority: 0,
          },
        },
      ).as('createClonedPluginWithPriority')

      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
        },
        router,
      })

      cy.getTestId('custom-plugin-type-cloned').click()
      selectClonedPlugin('acl')
      cy.getTestId('custom-plugin-alias-name').type(aliasName)
      cy.getTestId('custom-plugin-priority').type('0')
      cy.getTestId('custom-plugin-priority').should('have.value', '0')

      cy.getTestId('custom-plugin-form-submit').should('be.enabled').click()

      cy.wait('@createClonedPluginWithPriority').then((interception) => {
        expect(interception.request.method).to.equal('PUT')
        expect(interception.request.body).to.deep.equal({
          ref: 'acl',
          priority: 0,
        })
      })
    })
  })

  describe('Konnect - Edit Mode', () => {
    it('should hide step 1 when in edit mode', () => {
      // Intercept installed plugin fetch
      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/plugin-schemas/my-plugin`,
        {
          statusCode: 200,
          body: installedPluginResponse,
        },
      ).as('getInstalledPlugin')

      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
          pluginName: 'my-plugin',
        },
        router,
      })

      cy.wait('@getInstalledPlugin')

      // Step 1 should not be visible
      cy.contains('h2', 'Custom plugin type').should('not.exist')

      // Plugin type radios should not be visible
      cy.getTestId('custom-plugin-type-installed').should('not.exist')
      cy.getTestId('custom-plugin-type-streamed').should('not.exist')
      cy.getTestId('custom-plugin-type-cloned').should('not.exist')
    })

    it('should load installed plugin data for editing', () => {
      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/plugin-schemas/my-plugin`,
        {
          statusCode: 200,
          body: installedPluginResponse,
        },
      ).as('getInstalledPlugin')

      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
          pluginName: 'my-plugin',
        },
        router,
      })

      cy.wait('@getInstalledPlugin')

      // Schema upload should be visible with edit placeholder
      cy.getTestId('custom-plugin-schema-upload').should('exist')

      // File upload should not be required in edit mode
      cy.getTestId('custom-plugin-form-submit').should('be.enabled')
    })

    it('should update installed plugin via API', () => {
      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/plugin-schemas/my-plugin`,
        {
          statusCode: 200,
          body: installedPluginResponse,
        },
      ).as('getInstalledPlugin')

      cy.intercept(
        'PUT',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/plugin-schemas/my-plugin`,
        {
          statusCode: 200,
          body: installedPluginResponse,
        },
      ).as('updateInstalledPlugin')

      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
          pluginName: 'my-plugin',
        },
        router,
      })

      cy.wait('@getInstalledPlugin')

      // Submit without re-uploading (uses existing schema)
      cy.getTestId('custom-plugin-form-submit').click()

      cy.wait('@updateInstalledPlugin').then((interception) => {
        expect(interception.request.body.lua_schema).to.contain('return')
      })
    })

    it('should load streamed plugin data when installed fails', () => {
      // Installed returns 404
      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/plugin-schemas/my-streamed`,
        { statusCode: 404, body: { message: 'not found' } },
      ).as('getInstalledPlugin')

      // Streamed returns data
      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/custom-plugins/my-streamed`,
        { statusCode: 200, body: streamedPluginResponse },
      ).as('getStreamedPlugin')

      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
          pluginName: 'my-streamed',
        },
        router,
      })

      cy.wait('@getInstalledPlugin')
      cy.wait('@getStreamedPlugin')

      // Should show streamed plugin fields
      cy.getTestId('custom-plugin-name').should('exist')
      cy.getTestId('custom-plugin-name').should('have.value', streamedPluginResponse.name)
    })

    it('should load cloned plugin data when installed and streamed fail', () => {
      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/plugin-schemas/my-cloned-plugin`,
        { statusCode: 404, body: { message: 'not found' } },
      ).as('getInstalledPlugin')

      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/custom-plugins/my-cloned-plugin`,
        { statusCode: 404, body: { message: 'not found' } },
      ).as('getStreamedPlugin')

      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/cloned-plugins/my-cloned-plugin`,
        { statusCode: 200, body: clonedPluginResponse },
      ).as('getClonedPlugin')

      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
          pluginName: 'my-cloned-plugin',
        },
        router,
      })

      cy.wait('@getInstalledPlugin')
      cy.wait('@getStreamedPlugin')
      cy.wait('@getClonedPlugin')

      cy.getTestId('custom-plugin-alias-name').should('have.value', clonedPluginResponse.name)
      cy.getTestId('custom-plugin-priority').should('have.value', '0')
    })

    it('should update cloned plugin via API and preserve priority 0', () => {
      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/plugin-schemas/my-cloned-plugin`,
        { statusCode: 404, body: { message: 'not found' } },
      ).as('getInstalledPlugin')

      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/custom-plugins/my-cloned-plugin`,
        { statusCode: 404, body: { message: 'not found' } },
      ).as('getStreamedPlugin')

      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/cloned-plugins/my-cloned-plugin`,
        { statusCode: 200, body: clonedPluginResponse },
      ).as('getClonedPlugin')

      cy.intercept(
        'PATCH',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/cloned-plugins/my-cloned-plugin`,
        {
          statusCode: 200,
          body: clonedPluginResponse,
        },
      ).as('updateClonedPlugin')

      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
          pluginName: 'my-cloned-plugin',
        },
        router,
      })

      cy.wait('@getInstalledPlugin')
      cy.wait('@getStreamedPlugin')
      cy.wait('@getClonedPlugin')

      cy.getTestId('custom-plugin-form-submit').should('be.enabled').click()

      cy.wait('@updateClonedPlugin').then((interception) => {
        expect(interception.request.body).to.deep.equal({
          ref: clonedPluginResponse.ref,
          priority: 0,
          name: clonedPluginResponse.name,
        })
      })
    })

    it('should show error state when plugin not found', () => {
      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/plugin-schemas/not-found`,
        { statusCode: 404, body: { message: 'not found' } },
      ).as('getInstalledPlugin')

      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/custom-plugins/not-found`,
        { statusCode: 404, body: { message: 'not found' } },
      ).as('getStreamedPlugin')

      cy.intercept(
        'GET',
        `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/cloned-plugins/not-found`,
        { statusCode: 404, body: { message: 'not found' } },
      ).as('getClonedPlugin')

      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
          pluginName: 'not-found',
        },
        router,
      })

      cy.wait('@getInstalledPlugin')
      cy.wait('@getStreamedPlugin')
      cy.wait('@getClonedPlugin')

      // Should show error state
      cy.getTestId('custom-plugin-form-fetch-error').should('exist')

      // Form actions should not be visible
      cy.getTestId('custom-plugin-form-submit').should('not.exist')
    })
  })

  describe('unsupportedTypes', () => {
    it('should hide type selection UI when only one supported type remains', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
          unsupportedTypes: ['installed', 'cloned'],
        },
        router,
      })

      // Type selection UI should be hidden when only streamed remains
      cy.getTestId('custom-plugin-type-installed').should('not.exist')
      cy.getTestId('custom-plugin-type-streamed').should('not.exist')
      cy.getTestId('custom-plugin-type-cloned').should('not.exist')
      cy.getTestId('compare-deployment-options').should('not.exist')

      // Streamed fields should still be shown as the default path
      cy.getTestId('custom-plugin-schema-upload').should('exist')
      cy.getTestId('custom-plugin-handler-upload').should('exist')
    })

    it('should show error state when all types are unsupported', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
          unsupportedTypes: ['installed', 'streamed', 'cloned'],
        },
        router,
      })

      // Error state should be visible
      cy.getTestId('custom-plugin-form-unsupported-types-error').should('exist')

      // Form actions should not be visible
      cy.getTestId('custom-plugin-form-submit').should('not.exist')
    })

    it('should default to first supported type', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
          unsupportedTypes: ['installed'],
        },
        router,
      })

      // Streamed should be selected by default (first remaining)
      cy.getTestId('custom-plugin-type-streamed').should('exist')
      // Streamed step 2 fields should show
      cy.getTestId('custom-plugin-schema-upload').should('exist')
      cy.getTestId('custom-plugin-handler-upload').should('exist')
    })
  })

  describe('Kong Manager', () => {
    it('should render form with streamed type when installed is unsupported', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: kongManagerConfig,
          unsupportedTypes: ['installed'],
        },
        router,
      })

      // Only streamed and cloned should be visible
      cy.getTestId('custom-plugin-type-installed').should('not.exist')
      cy.getTestId('custom-plugin-type-streamed').should('exist')
      cy.getTestId('custom-plugin-type-cloned').should('exist')
    })

    it('should submit streamed plugin via Kong Manager API', () => {
      cy.intercept(
        'POST',
        `${kongManagerConfig.apiBaseUrl}/${kongManagerConfig.workspace}/custom-plugins`,
        {
          statusCode: 201,
          body: streamedPluginResponse,
        },
      ).as('createStreamedPlugin')

      cy.mount(CustomPluginForm, {
        props: {
          config: kongManagerConfig,
          unsupportedTypes: ['installed'],
        },
        router,
      })

      // Select streamed type (should be default)
      cy.getTestId('custom-plugin-type-streamed').click()

      // Upload files
      cy.getTestId('custom-plugin-schema-upload').find('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('return { name = "test", fields = {} }'),
        fileName: 'schema.lua',
      }, { force: true })

      cy.getTestId('custom-plugin-handler-upload').find('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('local M = {}\nreturn M'),
        fileName: 'handler.lua',
      }, { force: true })

      cy.getTestId('custom-plugin-name').type('km-streamed')

      cy.getTestId('custom-plugin-form-submit').click()

      cy.wait('@createStreamedPlugin').then((interception) => {
        expect(interception.request.body.name).to.equal('km-streamed')
      })
    })
  })

  describe('Compare Table', () => {
    it('should toggle compare deployment options collapse', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
        },
        router,
      })

      // Compare table should be collapsed by default
      cy.getTestId('compare-deployment-options')
        .findTestId('collapse-hidden-content')
        .should('not.be.visible')

      // Click to expand
      cy.getTestId('compare-deployment-options')
        .findTestId('collapse-trigger-content')
        .click()

      // Table should now be visible
      cy.getTestId('compare-deployment-options')
        .findTestId('collapse-hidden-content')
        .should('be.visible')
    })

    it('should only show columns for supported types', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
          unsupportedTypes: ['cloned'],
        },
        router,
      })

      // Expand compare table
      cy.getTestId('compare-deployment-options')
        .findTestId('collapse-trigger-content')
        .click()

      // Table should not have cloned column header
      cy.getTestId('compare-deployment-options')
        .findTestId('collapse-hidden-content')
        .should('be.visible')
        .find('table thead th')
        .should('have.length', 3) // empty header + installed + streamed
    })
  })

  describe('Cancel Action', () => {
    it('should navigate to cancel route when cancel is clicked', () => {
      cy.mount(CustomPluginForm, {
        props: {
          config: konnectConfig,
        },
        router,
      })

      cy.getTestId('custom-plugin-form-cancel').click()

      // Should navigate to home route
      cy.wrap(null).should(() => {
        expect(router.currentRoute.value.fullPath).to.equal('/')
      })
    })
  })
})
