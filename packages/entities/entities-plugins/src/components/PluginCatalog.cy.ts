import PluginCatalog from './PluginCatalog.vue'
import { PluginGroupArraySortedAlphabetically, type KonnectPluginSelectConfig } from '../types'
import { PluginGroup } from '@kong-ui-public/entities-plugins-metadata'
import {
  konnectAvailablePlugins,
  konnectStreamingCustomPlugins,
} from '../../fixtures/mockData'
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
  getCustomEditRoute: (plugin: string, type: 'schema' | 'streaming') => ({
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
        url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/custom-plugins`,
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
})
