// Cypress component test spec file
import { PluginGroupArray, type KongManagerPluginFormConfig, type KonnectPluginFormConfig } from '../types'
import {
  kmAvailablePlugins,
  kmLimitedAvailablePlugins,
  konnectAvailablePlugins,
  konnectLimitedAvailablePlugins,
  firstShownPlugin,
  customPluginsNames,
} from '../../fixtures/mockData'
import PluginSelect from './PluginSelect.vue'

const baseConfigKonnect: KonnectPluginFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api',
  controlPlaneId: 'abc-123-i-love-cats',
  // force the scope
  // entityType: 'services',
  // entityId: '6f1ef200-d3d4-4979-9376-726f2216d90c',
  getCreateRoute: (plugin: string) => ({
    name: 'create-plugin',
    params: {
      control_plane_id: 'abc-123-i-love-cats',
      plugin,
    },
  }),
  // custom plugins
  createCustomRoute: { name: 'create-custom-plugin' },
  getCustomEditRoute: (plugin: string) => ({
    name: 'edit-custom-plugin',
    params: {
      control_plane_id: 'abc-123-i-love-cats',
      plugin,
    },
  }),
}

const baseConfigKM:KongManagerPluginFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  // force the scope
  // entityType: 'consumers',
  // entityId: '123-abc-i-lover-cats',
  getCreateRoute: (plugin: string) => ({
    name: 'create-plugin',
    params: {
      plugin,
    },
  }),
}

describe('<PluginSelect />', () => {
  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/kong`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? kmAvailablePlugins,
        },
      ).as(params?.alias ?? 'getAvailablePlugins')
    }

    it('should show the select page', () => {
      interceptKM()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')
      cy.get('.plugins-filter-input-container').should('be.visible')
      cy.get('.plugin-select-grid').should('be.visible')
      cy.getTestId(`${firstShownPlugin}-card`).should('be.visible')

      // plugin group collapses show
      for (const pluginGroup in PluginGroupArray.slice(-1)) {
        cy.get(`${pluginGroup}-collapse`).should('be.visible')
      }
      // renders all plugins
      for (const pluginName in kmAvailablePlugins.plugins.available_on_server) {
        cy.getTestId(`${pluginName}-card`).should('exist')
      }
    })

    it('should allow customizing the pluginsPerRow', () => {
      const pluginsPerRow = 3

      interceptKM()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKM,
          pluginsPerRow,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')
      cy.get('.k-collapse-visible-content .plugin-card').should('have.length', pluginsPerRow)
    })

    it('should correctly render disabled plugins', () => {
      const disabledPlugins = { 'basic-auth': 'This plugin is disabled' }

      interceptKM()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKM,
          disabledPlugins,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')

      for (const key in disabledPlugins) {
        cy.get(`.plugin-card.disabled [data-testid="${key}-card"]`).should('be.visible')
      }
    })

    it('should correctly hide ignored plugins', () => {
      const ignoredPlugins = ['basic-auth']

      interceptKM()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKM,
          ignoredPlugins,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')

      ignoredPlugins.forEach((pluginName) => {
        cy.getTestId(`${pluginName}-card`).should('not.exist')
      })
    })

    it('should correctly render available plugins when isAvailableOnly is true', () => {
      interceptKM({
        mockData: kmLimitedAvailablePlugins,
      })

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKM,
          showAvailableOnly: true,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')

      // renders all plugins
      for (const pluginName in kmLimitedAvailablePlugins.plugins.available_on_server) {
        cy.getTestId(`${pluginName}-card`).should('exist')
      }

      // does not render a plugin when not available
      cy.getTestId(`${firstShownPlugin}-card`).should('not.exist')
    })

    it('should allow filtering of plugins', () => {
      interceptKM()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')

      // search
      cy.getTestId('plugins-filter').should('be.visible')
      cy.getTestId('plugins-filter').type(firstShownPlugin)

      cy.getTestId(`${firstShownPlugin}-card`).should('be.visible')
      cy.get('.plugin-card').should('have.length', 1)
    })

    it('should handle error state - available plugins failed to load', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/kong`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getAvailablePlugins')

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')

      cy.getTestId('plugins-fetch-error').should('be.visible')
    })

    it('should handle empty state - invalid plugin name', () => {
      interceptKM()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')

      // search
      cy.getTestId('plugins-filter').should('be.visible')
      cy.getTestId('plugins-filter').type('xxxxx')

      cy.getTestId('plugins-empty-state').should('be.visible')
    })

    it('click event should be emitted when Plugin was clicked and noRouteChange is true', () => {
      interceptKM()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKM,
          onPluginClicked: cy.spy().as('onPluginClickedSpy'),
          noRouteChange: true,
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getAvailablePlugins')

      cy.getTestId(`${firstShownPlugin}-card`).should('be.visible')
      cy.getTestId(`${firstShownPlugin}-card`).click()
      /* cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(PluginSelect)
        .vm.$emit('submit'))
 */
      cy.wait('@pluginClicked')

      cy.get('onPluginClickedSpy').should('have.been.calledOnce')
    })
  })

  describe('Konnect', () => {
    const interceptKonnect = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/v1/available-plugins`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? konnectAvailablePlugins,
        },
      ).as(params?.alias ?? 'getAvailablePlugins')
    }

    describe('actions', () => {
      it('should correctly render custom plugin actions', () => {
        interceptKonnect()

        cy.mount(PluginSelect, {
          props: {
            config: baseConfigKonnect,
            canEditCustom: () => { },
            canDeleteCustom: () => { },
          },
        })

        cy.wait('@getAvailablePlugins')

        // custom plugins
        cy.getTestId('custom-tab').should('be.visible')
        cy.getTestId('custom-tab').click()
        cy.get('.custom-plugins-grid').should('be.visible')

        cy.getTestId('overflow-actions-button').eq(0).click()
        cy.getTestId('edit-plugin-schema').should('be.visible')
        cy.getTestId('delete-plugin-schema').should('be.visible')
        // negative test for create
        cy.getTestId('custom-plugin-create-card').should('not.exist')
      })

      it('should render create card if user has create rights', () => {
        interceptKonnect()

        cy.mount(PluginSelect, {
          props: {
            config: baseConfigKonnect,
            canCreateCustom: () => { },
          },
        })

        cy.wait('@getAvailablePlugins')

        // custom plugins
        cy.getTestId('custom-tab').should('be.visible')
        cy.getTestId('custom-tab').click()
        cy.get('.custom-plugins-grid').should('be.visible')

        cy.getTestId('custom-plugin-create-card').should('be.visible')
        // negative test for edit and delete
        cy.getTestId('custom-plugin-actions').should('not.exist')
      })
    })

    it('should show the select page tabs', () => {
      interceptKonnect()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')
      cy.get('.plugins-filter-input-container').should('be.visible')

      // kong plugins
      cy.getTestId('kong-tab').should('be.visible')
      cy.get('.plugin-select-grid').should('be.visible')
      // kong visible / custom not
      cy.getTestId(`${firstShownPlugin}-card`).should('be.visible')
      cy.getTestId(`${customPluginsNames[0]}-card`).should('not.be.visible')

      // plugin group collapses show
      for (const pluginGroup in PluginGroupArray.slice(-1)) {
        cy.get(`${pluginGroup}-collapse`).should('be.visible')
      }

      // custom plugins
      cy.getTestId('custom-tab').should('be.visible')
      cy.getTestId('custom-tab').click()
      cy.get('.custom-plugins-grid').should('be.visible')
      // kong hidden / custom not
      cy.getTestId(`${firstShownPlugin}-card`).should('not.be.visible')
      cy.getTestId(`${customPluginsNames[0]}-card`).should('be.visible')

      // renders all plugins (kong + custom)
      for (const pluginName in konnectAvailablePlugins.names) {
        cy.getTestId(`${pluginName}-card`).should('exist')
      }
    })

    it('should allow customizing the pluginsPerRow', () => {
      const pluginsPerRow = 3

      interceptKonnect()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKonnect,
          pluginsPerRow,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')
      cy.get('.k-collapse-visible-content .plugin-card').should('have.length', pluginsPerRow)
    })

    it('should correctly render disabled plugins', () => {
      const disabledPlugins = { 'basic-auth': 'This plugin is disabled' }

      interceptKonnect()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKonnect,
          disabledPlugins,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')

      for (const key in disabledPlugins) {
        cy.get(`.plugin-card.disabled [data-testid="${key}-card"]`).should('be.visible')
      }
    })

    it('should correctly render ignored plugins', () => {
      const ignoredPlugins = ['basic-auth']

      interceptKonnect()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKonnect,
          ignoredPlugins,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')

      ignoredPlugins.forEach((pluginName) => {
        cy.getTestId(`${pluginName}-card`).should('not.exist')
      })
    })

    it('should correctly render available plugins when isAvailableOnly is true', () => {
      interceptKonnect({
        mockData: konnectLimitedAvailablePlugins,
      })

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKonnect,
          showAvailableOnly: true,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')

      // renders all plugins
      konnectLimitedAvailablePlugins.names.forEach((pluginName: string) => {
        cy.getTestId(`${pluginName}-card`).should('exist')
      })

      // does not render a plugin when not available
      cy.getTestId(`${firstShownPlugin}-card`).should('not.exist')
    })

    it('should allow filtering of plugins', () => {
      interceptKonnect()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')

      // search
      cy.getTestId('plugins-filter').should('be.visible')
      cy.getTestId('plugins-filter').type(firstShownPlugin)

      cy.getTestId(`${firstShownPlugin}-card`).should('be.visible')
      cy.get('.plugin-card').should('have.length', 1)
    })

    it('should handle error state - available plugins failed to load', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/v1/available-plugins`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getAvailablePlugins')

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.wait('@getAvailablePlugins')
      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')

      cy.getTestId('plugins-fetch-error').should('be.visible')
    })

    it('should handle empty state - invalid plugin name', () => {
      interceptKonnect()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.wait('@getAvailablePlugins')

      cy.get('.kong-ui-entities-plugin-select-form').should('be.visible')
      cy.get('.kong-ui-entities-plugin-select-form .plugins-results-container').should('be.visible')

      // search
      cy.getTestId('plugins-filter').should('be.visible')
      cy.getTestId('plugins-filter').type('xxxxx')

      cy.getTestId('plugins-empty-state').should('be.visible')
    })

    it('click event should be emitted when Plugin was clicked and noRouteChange is true', () => {
      interceptKonnect()

      cy.mount(PluginSelect, {
        props: {
          config: baseConfigKonnect,
          onPluginClicked: cy.spy().as('onPluginClickedSpy'),
          noRouteChange: true,
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getAvailablePlugins')

      cy.getTestId(`${firstShownPlugin}-card`).should('be.visible')
      cy.getTestId(`${firstShownPlugin}-card`).click()

      /* cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit')) */

      cy.wait('@pluginClicked')

      cy.get('onPluginClickedSpy').should('have.been.calledOnce')
    })
  })
})
