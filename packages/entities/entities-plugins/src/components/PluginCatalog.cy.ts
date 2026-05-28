import PluginCatalog from './PluginCatalog.vue'
import {
  PluginGroupArraySortedAlphabetically,
  type KonnectPluginSelectConfig,
  type KongManagerPluginSelectConfig,
} from '../types'
import { PluginGroup } from '@kong-ui-public/entities-plugins-metadata'
import {
  konnectAvailablePlugins,
  konnectStreamingCustomPlugins,
  kmAvailablePlugins,
  kmClonedCustomPlugins,
  kmStreamingCustomPlugins,
} from '../../fixtures/mockData'
import { FEATURE_FLAGS } from '../constants'
import { createMemoryHistory, createRouter } from 'vue-router'

const baseConfigKonnect: KonnectPluginSelectConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: 'abc-123-i-love-cats',
  getCreateRoute: (plugin: string) => ({
    name: 'create-plugin',
    params: {
      control_plane_id: 'abc-123-i-love-cats',
      plugin,
    },
  }),
  createCustomRoute: { name: 'create-custom-plugin' },
  getCustomEditRoute: (plugin: string, type: 'schema' | 'streaming' | 'cloned') => ({
    name: 'edit-custom-plugin',
    params: {
      control_plane_id: 'abc-123-i-love-cats',
      plugin,
      customPluginType: type,
    },
  }),
}

describe('<PluginCatalog />', {
  viewportWidth: 1024,
  viewportHeight: 576,
}, () => {
  let router: ReturnType<typeof createRouter>
  const interceptKonnect = () => {
    cy.intercept(
      {
        method: 'GET',
        url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/v1/available-plugins`,
      },
      {
        statusCode: 200,
        body: konnectAvailablePlugins,
      },
    ).as('getAvailablePlugins')

    cy.intercept(
      {
        method: 'GET',
        // Match regardless of pagination query (e.g. `?size=1000`) appended by `fetchAllPages`.
        pathname: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/custom-plugins`,
      },
      {
        statusCode: 200,
        body: konnectStreamingCustomPlugins,
      },
    ).as('getStreamingCustomPlugins')
  }

  beforeEach(() => {
    router = createRouter({
      routes: [
        { path: '/', name: 'list-plugin', component: { template: '<div>ListPage</div>' } },
        { path: '/create-plugin', name: 'create-plugin', component: { template: '<div>CreatePlugin</div>' } },
        { path: '/create-custom-plugin', name: 'create-custom-plugin', component: { template: '<div>CreateCustomPlugin</div>' } },
        { path: '/edit-custom-plugin', name: 'edit-custom-plugin', component: { template: '<div>EditCustomPlugin</div>' } },
      ],
      history: createMemoryHistory(),
    })
  })

  it('should render plugin filter, groups and plugins', () => {
    interceptKonnect()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKonnect,
        customPluginSupport: 'schema',
      },
      router,
    })
    cy.wait('@getAvailablePlugins')
    cy.getTestId('plugin-catalog').should('exist')
    cy.getTestId('plugin-filter').should('exist')

    PluginGroupArraySortedAlphabetically.forEach((group) => {
      cy.getTestId(`plugin-filter-item-${group}`).should('exist')
    })
  })

  it('should show featured plugins', () => {
    interceptKonnect()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKonnect,
        highlightedPluginIds: ['basic-auth'],
      },
    })

    cy.wait('@getAvailablePlugins')

    // featured group should be visible
    cy.getTestId('plugin-group-Featured').should('be.visible')
  })


  it('should render show-all card correctly', () => {
    interceptKonnect()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKonnect,
        highlightedPluginIds: ['basic-auth'],
      },
    })

    cy.wait('@getAvailablePlugins')

    cy.getTestId('plugin-group-Authentication')
      .should('exist')
      .within(() => {
        cy.contains(/show all/i)
          .should('exist')
          .click()
        cy.contains(/show all/i).should('not.exist')
      })
  })

  it('should allow filtering of plugins', () => {
    interceptKonnect()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKonnect,
        customPluginSupport: 'schema',
      },
      router,
    })
    cy.wait('@getAvailablePlugins')
    // check Traffic Control filter and Security filter
    cy.getTestId(`plugin-filter-checkbox-${PluginGroup.TRAFFIC_CONTROL}`).check()
    cy.getTestId(`plugin-filter-checkbox-${PluginGroup.SECURITY}`).check()
    cy.getTestId(`plugin-group-${PluginGroup.TRAFFIC_CONTROL}`).should('exist')
    cy.getTestId(`plugin-group-${PluginGroup.SECURITY}`).should('exist')
    cy.getTestId(`plugin-group-${PluginGroup.AUTHENTICATION}`).should('not.exist')

    // uncheck Traffic Control filter and Security filter
    cy.getTestId(`plugin-filter-checkbox-${PluginGroup.TRAFFIC_CONTROL}`).uncheck()
    cy.getTestId(`plugin-filter-checkbox-${PluginGroup.SECURITY}`).uncheck()
    cy.getTestId(`plugin-group-${PluginGroup.AUTHENTICATION}`).should('exist')

    // type in search box
    cy.getTestId('plugins-filter-input').type('jwt')
    cy.getTestId('jwt-card').should('be.visible')
    cy.getTestId('plugin-catalog-card-wrapper').should('have.length', 2)

    // no search results in AI group
    cy.getTestId('plugin-filter-checkbox-AI').check()
    cy.getTestId('plugin-catalog-card-wrapper').should('have.length', 0)
    cy.getTestId('plugins-empty-state').contains(/No results/i).should('exist')

  })

  it('should handle error state - available plugins failed to load', () => {
    cy.intercept(
      {
        method: 'GET',
        url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/v1/available-plugins`,
      },
      {
        statusCode: 500,
        body: {},
      },
    ).as('getPluginsError')

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKonnect,
        customPluginSupport: 'schema',
      },
      router,
    })
    cy.wait('@getPluginsError')
    cy.getTestId('kui-icon-wrapper-warning-icon')
      .should('exist')
  })

  it('should handle empty state - invalid plugin id', () => {
    interceptKonnect()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKonnect,
        customPluginSupport: 'schema',
      },
      router,
    })
    cy.wait('@getAvailablePlugins')
    cy.getTestId('plugins-filter-input').type('non-existent-plugin')
    cy.getTestId('plugin-catalog').contains(/no plugins found|empty|no results/i).should('exist')
  })

  it('should render disabled plugin card', () => {
    interceptKonnect()
    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKonnect,
        disabledPlugins: { 'acl': 'ACL is not supported for this entity type' },
      },
      router,
    })

    cy.wait('@getAvailablePlugins')
    cy.getTestId('acl-card').should('have.class', 'disabled')
  })

  it('should show only scope-matching featured plugins when entityType is consumers', () => {
    interceptKonnect()

    cy.mount(PluginCatalog, {
      props: {
        config: {
          ...baseConfigKonnect,
          entityType: 'consumers',
          entityId: 'consumer-123',
        },
        // mix of consumer-scoped and non-consumer-scoped plugins
        highlightedPluginIds: ['datakit', 'key-auth', 'openid-connect', 'cors', 'rate-limiting-advanced', 'request-transformer'],
      },
      router,
    })

    cy.wait('@getAvailablePlugins')

    // Featured group should exist with in-scope plugins
    cy.getTestId('plugin-group-Featured').should('be.visible')
    cy.getTestId('rate-limiting-advanced-card').should('exist')
    cy.getTestId('request-transformer-card').should('exist')
    // out-of-scope plugins should not appear in Featured
    cy.getTestId('plugin-group-Featured').within(() => {
      cy.getTestId('key-auth-card').should('not.exist')
    })
  })

  it('should exclude featured group entirely when all highlighted plugins are out of scope', () => {
    interceptKonnect()

    cy.mount(PluginCatalog, {
      props: {
        config: {
          ...baseConfigKonnect,
          entityType: 'consumers',
          entityId: 'consumer-123',
        },
        // none of these have CONSUMER scope
        highlightedPluginIds: ['key-auth', 'openid-connect', 'cors'],
      },
      router,
    })

    cy.wait('@getAvailablePlugins')

    cy.getTestId('plugin-group-Featured').should('not.exist')
  })

  it('should clear selected filters when clear selection clicked', () => {
    interceptKonnect()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKonnect,
        customPluginSupport: 'schema',
      },
      router,
    })

    cy.wait('@getAvailablePlugins')

    // button disabled when nothing selected
    cy.getTestId('clear-filter-selection').should('be.disabled')

    // select a group filter
    cy.getTestId(`plugin-filter-checkbox-${PluginGroup.TRAFFIC_CONTROL}`).check()

    // clear selection should now be enabled and clear the checkbox
    cy.getTestId('clear-filter-selection').should('not.be.disabled').click()
    cy.getTestId(`plugin-filter-checkbox-${PluginGroup.TRAFFIC_CONTROL}`).should('not.be.checked')
    cy.getTestId('clear-filter-selection').should('be.disabled')
  })

  it('should hide the featured filter and group when showFeaturedGroup is false', () => {
    interceptKonnect()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKonnect,
        highlightedPluginIds: ['basic-auth'],
        showFeaturedGroup: false,
      },
      router,
    })

    cy.wait('@getAvailablePlugins')

    // featured filter sidebar item should not exist
    cy.getTestId('plugin-filter-item-Featured').should('not.exist')
    // featured group in results should not exist
    cy.getTestId('plugin-group-Featured').should('not.exist')
  })

  it('should render streaming custom plugins in the Custom Plugins group', () => {
    interceptKonnect()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKonnect,
        customPluginSupport: 'streaming',
      },
      router,
    })

    cy.wait('@getAvailablePlugins')
    cy.wait('@getStreamingCustomPlugins')

    cy.getTestId('plugin-group-Custom Plugins').should('exist')
    cy.getTestId('plugin-1-card').should('exist')
    cy.getTestId('plugin-2-card').should('exist')
  })
})

describe('<PluginCatalog /> Kong Manager', {
  viewportWidth: 1024,
  viewportHeight: 576,
}, () => {
  const baseConfigKongManager: KongManagerPluginSelectConfig = {
    app: 'kongManager',
    workspace: 'default',
    apiBaseUrl: '/kong-manager',
    getCreateRoute: (plugin: string) => ({
      name: 'create-plugin',
      params: { plugin },
    }),
    createCustomRoute: { name: 'create-custom-plugin' },
    getCustomEditRoute: (plugin: string, type: 'schema' | 'streaming' | 'cloned') => ({
      name: 'edit-custom-plugin',
      params: { plugin, customPluginType: type },
    }),
  }

  let router: ReturnType<typeof createRouter>

  const interceptKMAvailablePlugins = (mockData = kmAvailablePlugins) => {
    cy.intercept(
      {
        method: 'GET',
        url: `${baseConfigKongManager.apiBaseUrl}/${baseConfigKongManager.workspace}/kong`,
      },
      { statusCode: 200, body: mockData },
    ).as('getKMAvailablePlugins')
  }

  const interceptKMClonedPlugins = (options?: { statusCode?: number, mockData?: object }) => {
    cy.intercept(
      {
        method: 'GET',
        pathname: `${baseConfigKongManager.apiBaseUrl}/${baseConfigKongManager.workspace}/cloned-plugins`,
      },
      { statusCode: options?.statusCode ?? 200, body: options?.mockData ?? kmClonedCustomPlugins },
    ).as('getKMClonedPlugins')
  }

  const interceptKMStreamingPlugins = (mockData = kmStreamingCustomPlugins) => {
    cy.intercept(
      {
        method: 'GET',
        pathname: `${baseConfigKongManager.apiBaseUrl}/${baseConfigKongManager.workspace}/custom-plugins`,
      },
      { statusCode: 200, body: mockData },
    ).as('getKMStreamingPlugins')
  }

  beforeEach(() => {
    router = createRouter({
      routes: [
        { path: '/', name: 'list-plugin', component: { template: '<div>ListPage</div>' } },
        { path: '/create-plugin', name: 'create-plugin', component: { template: '<div>CreatePlugin</div>' } },
        { path: '/create-custom-plugin', name: 'create-custom-plugin', component: { template: '<div>CreateCustomPlugin</div>' } },
        { path: '/edit-custom-plugin', name: 'edit-custom-plugin', component: { template: '<div>EditCustomPlugin</div>' } },
      ],
      history: createMemoryHistory(),
    })
  })

  it('should render plugin groups from Kong Manager API', () => {
    interceptKMAvailablePlugins()

    cy.mount(PluginCatalog, {
      props: { config: baseConfigKongManager },
      router,
    })

    cy.wait('@getKMAvailablePlugins')
    cy.getTestId('plugin-catalog').should('exist')
    cy.getTestId(`plugin-group-${PluginGroup.AUTHENTICATION}`).should('exist')
  })

  it('should render cloned custom plugins with cloned-from badge', () => {
    interceptKMAvailablePlugins()
    interceptKMClonedPlugins()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKongManager,
        customPluginSupport: ['cloned', 'schema'],
      },
      global: {
        provide: {
          [FEATURE_FLAGS.KM_2485_CLONED_PLUGINS]: true,
        },
      },
      router,
    })

    cy.wait('@getKMAvailablePlugins')
    cy.wait('@getKMClonedPlugins')

    cy.getTestId('plugin-group-Custom Plugins').should('exist')
    cy.getTestId('km-cloned-plugin-card').should('exist')
    cy.getTestId('km-cloned-plugin-card').find('.cloned-from-badge').should('exist')
  })

  it('should render streaming custom plugins in the Custom Plugins group', () => {
    interceptKMAvailablePlugins()
    interceptKMStreamingPlugins()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKongManager,
        customPluginSupport: 'streaming',
      },
      router,
    })

    cy.wait('@getKMAvailablePlugins')
    cy.wait('@getKMStreamingPlugins')

    cy.getTestId('plugin-group-Custom Plugins').should('exist')
    cy.getTestId('km-streaming-plugin-card').should('exist')
  })

  it('should show overflow actions menu on cloned plugin card', () => {
    interceptKMAvailablePlugins()
    interceptKMClonedPlugins()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKongManager,
        customPluginSupport: ['cloned', 'schema'],
        canUpdateClonedPlugin: true,
        canDeleteClonedPlugin: true,
      },
      global: {
        provide: {
          [FEATURE_FLAGS.KM_2485_CLONED_PLUGINS]: true,
        },
      },
      router,
    })

    cy.wait('@getKMAvailablePlugins')
    cy.wait('@getKMClonedPlugins')

    cy.getTestId('km-cloned-plugin-card')
      .within(() => {
        cy.getTestId('overflow-actions-button').should('be.visible').click()
      })
    cy.getTestId('edit-plugin-schema').should('be.visible')
    cy.getTestId('delete-plugin-schema').should('be.visible')
  })

  it('should open delete modal when Delete is clicked on a cloned plugin card', () => {
    interceptKMAvailablePlugins()
    interceptKMClonedPlugins()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKongManager,
        customPluginSupport: ['cloned', 'schema'],
        canDeleteClonedPlugin: true,
      },
      global: {
        provide: {
          [FEATURE_FLAGS.KM_2485_CLONED_PLUGINS]: true,
        },
      },
      router,
    })

    cy.wait('@getKMAvailablePlugins')
    cy.wait('@getKMClonedPlugins')

    cy.getTestId('km-cloned-plugin-card')
      .within(() => {
        cy.getTestId('overflow-actions-button').click()
      })
    cy.getTestId('delete-plugin-schema').click()
    cy.getTestId('delete-custom-plugin-schema-modal').should('exist')
  })

  it('should not render cloned plugin edit action for KM schema-type plugins', () => {
    // schema-type custom plugins in KM are server-installed — not editable/deletable
    interceptKMAvailablePlugins()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKongManager,
        // schema support only, no cloned
        customPluginSupport: 'schema',
        availableOnServer: false,
      },
      global: {
        provide: {
          [FEATURE_FLAGS.KM_2485_CLONED_PLUGINS]: true,
        },
      },
      router,
    })

    cy.wait('@getKMAvailablePlugins')

    // If a schema plugin exists in the custom group, it should NOT have an overflow menu
    // (schema plugins in KM are server-installed, not manageable)
    cy.getTestId('plugin-group-Custom Plugins').should('not.exist')
  })

  it('should filter out ignoredPlugins from Kong Manager plugin list', () => {
    interceptKMAvailablePlugins()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKongManager,
        ignoredPlugins: ['acl'],
      },
      router,
    })

    cy.wait('@getKMAvailablePlugins')

    cy.getTestId('acl-card').should('not.exist')
    // other plugins should still be present
    cy.getTestId('basic-auth-card').should('exist')
  })

  it('should show warning alert when cloned plugins API fails', () => {
    interceptKMAvailablePlugins()
    interceptKMClonedPlugins({ statusCode: 500, mockData: { message: 'Internal Server Error' } })

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKongManager,
        customPluginSupport: ['cloned', 'schema'],
      },
      global: {
        provide: {
          [FEATURE_FLAGS.KM_2485_CLONED_PLUGINS]: true,
        },
      },
      router,
    })

    cy.wait('@getKMAvailablePlugins')
    cy.wait('@getKMClonedPlugins')

    // warning alert should be shown; other Kong plugins still render
    cy.get('.custom-plugins-warning').should('exist')
    cy.getTestId(`plugin-group-${PluginGroup.AUTHENTICATION}`).should('exist')
  })

  it('should not show overflow actions when canUpdateClonedPlugin and canDeleteClonedPlugin are false', () => {
    interceptKMAvailablePlugins()
    interceptKMClonedPlugins()

    cy.mount(PluginCatalog, {
      props: {
        config: baseConfigKongManager,
        customPluginSupport: ['cloned', 'schema'],
        canUpdateClonedPlugin: false,
        canDeleteClonedPlugin: false,
      },
      global: {
        provide: {
          [FEATURE_FLAGS.KM_2485_CLONED_PLUGINS]: true,
        },
      },
      router,
    })

    cy.wait('@getKMAvailablePlugins')
    cy.wait('@getKMClonedPlugins')

    cy.getTestId('km-cloned-plugin-card').should('exist')
    cy.getTestId('km-cloned-plugin-card')
      .within(() => {
        cy.getTestId('overflow-actions-button').should('not.exist')
      })
  })
})
