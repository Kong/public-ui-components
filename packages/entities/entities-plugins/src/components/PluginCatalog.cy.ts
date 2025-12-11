// import PluginCatalog from './PluginCatalog.vue'
// import type { KonnectPluginSelectConfig } from '../types'
// import {
//   konnectAvailablePlugins,
//   konnectStreamingCustomPlugins,
// } from '../../fixtures/mockData'
// import { createMemoryHistory, createRouter } from 'vue-router'

// const baseConfigKonnect: KonnectPluginSelectConfig = {
//   app: 'konnect',
//   apiBaseUrl: '/us/kong-api',
//   controlPlaneId: 'abc-123-i-love-cats',
//   getCreateRoute: (plugin: string) => ({
//     name: 'create-plugin',
//     params: {
//       control_plane_id: 'abc-123-i-love-cats',
//       plugin,
//     },
//   }),
//   createCustomRoute: { name: 'create-custom-plugin' },
//   getCustomEditRoute: (plugin: string, type: 'schema' | 'streaming') => ({
//     name: 'edit-custom-plugin',
//     params: {
//       control_plane_id: 'abc-123-i-love-cats',
//       plugin,
//       customPluginType: type,
//     },
//   }),
// }

// describe('<PluginCatalog />', {
//   viewportWidth: 1024,
//   viewportHeight: 576,
// }, () => {
//   let router: ReturnType<typeof createRouter>
//   const interceptKonnect = () => {
//     cy.intercept(
//       {
//         method: 'GET',
//         url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/v1/available-plugins`,
//       },
//       {
//         statusCode: 200,
//         body: konnectAvailablePlugins,
//       },
//     ).as('getAvailablePlugins')

//     cy.intercept(
//       {
//         method: 'GET',
//         url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/custom-plugins`,
//       },
//       {
//         statusCode: 200,
//         body: konnectStreamingCustomPlugins,
//       },
//     ).as('getStreamingCustomPlugins')
//   }

//   beforeEach(() => {
//     router = createRouter({
//       routes: [
//         { path: '/', name: 'list-plugin', component: { template: '<div>ListPage</div>' } },
//       ],
//       history: createMemoryHistory(),
//     })
//   })

//   it('should render plugin filter, groups and plugins', () => {
//     interceptKonnect()

//     cy.mount(PluginCatalog, {
//       props: {
//         config: baseConfigKonnect,
//         customPluginSupport: 'schema',
//       },
//       router,
//     })
//     cy.wait('@getAvailablePlugins')
//     cy.getTestId('plugin-catalog').should('exist')
//     cy.getTestId('plugin-filter').should('exist')

//     Object.keys(konnectAvailablePlugins.names).forEach((group) => {
//       cy.getTestId(`plugin-filter-item-${group}`).should('exist')
//     })

//     Object.keys(konnectAvailablePlugins.names).forEach((group) => {
//       cy.getTestId(`plugin-group-${group}`).should('exist')
//     })
//   })

//   it('should show popular plugins', () => {
//     interceptKonnect()

//     cy.mount(PluginCatalog, {
//       props: {
//         config: baseConfigKonnect,
//         highlightedPluginIds: ['basic-auth'],
//       },
//     })

//     cy.wait('@getAvailablePlugins')

//     // popular group should be visible
//     cy.getTestId('plugin-group-Popular').should('be.visible')

//     // highlighted plugins should be hidden
//     cy.getTestId('plugins-filter').type('gnok')
//     cy.get('plugin-group-Popular').should('not.exist')
//   })


//   // it('should show show-all card', () => {
//   //   interceptKonnect()

//   //   cy.mount(PluginCatalog, {
//   //     props: {
//   //       config: baseConfigKonnect,
//   //       highlightedPluginIds: ['basic-auth'],
//   //     },
//   //   })

//   //   cy.wait('@getAvailablePlugins')

//   //   // popular group should be visible
//   //   cy.getTestId('plugin-group-Popular').should('be.visible')

//   //   // highlighted plugins should be hidden
//   //   cy.getTestId('plugins-filter').type('gnok')
//   //   cy.get('@highlightedPlugins').should('not.exist')
//   // })

//   it('should allow filtering of plugins', () => {
//     interceptKonnect()

//     cy.mount(PluginCatalog, {
//       props: {
//         config: baseConfigKonnect,
//         customPluginSupport: 'schema',
//       },
//       router,
//     })
//     cy.wait('@getAvailablePlugins')
//     cy.getTestId('plugins-filter-input').type('jwt signer')
//     cy.getTestId('jwt-signer-card').should('be.visible')
//     cy.get('.plugin-catalog-card-wrapper').should('have.length', 1)
//   })

//   it('should handle error state - available plugins failed to load', () => {
//     cy.intercept(
//       {
//         method: 'GET',
//         url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/v1/available-plugins`,
//       },
//       {
//         statusCode: 500,
//         body: {},
//       },
//     ).as('getPluginsError')

//     cy.mount(PluginCatalog, {
//       props: {
//         config: baseConfigKonnect,
//         customPluginSupport: 'schema',
//       },
//       router,
//     })
//     cy.wait('@getPluginsError')
//     cy.getTestId('plugin-catalog').contains(/error|failed|unable/i).should('exist')
//   })

//   it('should handle empty state - invalid plugin id', () => {
//     interceptKonnect()

//     cy.mount(PluginCatalog, {
//       props: {
//         config: baseConfigKonnect,
//         customPluginSupport: 'schema',
//       },
//       router,
//     })
//     cy.wait('@getAvailablePlugins')
//     cy.getTestId('plugins-filter-input').type('non-existent-plugin')
//     cy.getTestId('plugin-catalog').contains(/no plugins found|empty|no results/i).should('exist')
//   })
// })
