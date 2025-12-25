import PluginCatalog from './PluginCatalog.vue'
import { PluginGroupArray, type KonnectPluginSelectConfig } from '../types'
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

    PluginGroupArray.forEach((group) => {
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
    cy.getTestId('plugin-filter-checkbox-Traffic Control').check()
    cy.getTestId('plugin-filter-checkbox-Security').check()
    cy.getTestId('plugin-group-Traffic Control').should('exist')
    cy.getTestId('plugin-group-Security').should('exist')
    cy.getTestId('plugin-group-Authentication').should('not.exist')

    // uncheck Traffic Control filter and Security filter
    cy.getTestId('plugin-filter-checkbox-Traffic Control').uncheck()
    cy.getTestId('plugin-filter-checkbox-Security').uncheck()
    cy.getTestId('plugin-group-Authentication').should('exist')

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
})
