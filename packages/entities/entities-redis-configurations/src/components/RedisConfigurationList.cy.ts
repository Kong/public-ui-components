import type { KongManagerRedisConfigurationListConfig, KonnectRedisConfigurationListConfig } from 'src/types'
import RedisConfigurationList from './RedisConfigurationList.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { partials, links } from '../../fixtures/mockData'
import { v4 as uuidv4 } from 'uuid'

const baseConfigKM: KongManagerRedisConfigurationListConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  createRoute: { name: 'redis-configuration-create' },
  getViewRoute: (id) => ({ name: 'redis-configuration-detail', params: { id } }),
  getEditRoute: (id) => ({ name: 'redis-configuration-edit', params: { id } }),
}

const baseConfigKonnect: KonnectRedisConfigurationListConfig = {
  app: 'konnect',
  controlPlaneId: 'test-control-plane-id',
  apiBaseUrl: '/us/kong-api',
  createRoute: { name: 'redis-configuration-create' },
  getViewRoute: (id) => ({ name: 'redis-configuration-detail', params: { id } }),
  getEditRoute: (id) => ({ name: 'redis-configuration-edit', params: { id } }),
}

describe('<RedisConfigurationList />', () => {

  describe('actions', {
    viewportHeight: 700,
    viewportWidth: 700,
  }, () => {
    function interceptList({
      status = 200,
      body = partials,
    }: {
      status?: number,
      body?: any,
    } = {}) {
      cy.intercept({
        method: 'GET',
        url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials*`,
      }, {
        statusCode: status,
        body,
      }).as('getRedisConfigurations')

      cy.intercept({
        method: 'GET',
        url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/partials*`,
      }, {
        statusCode: status,
        body,
      }).as('getRedisConfigurations')
    }

    function interceptLinkedPlugins() {
      cy.intercept({
        method: 'GET',
        url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials/*/links*`,
      }, {
        statusCode: 200,
        body: links,
      }).as('getLinkedPlugins')

      cy.intercept({
        method: 'GET',
        url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/partials/*/links*`,
      }, {
        statusCode: 200,
        body: links,
      }).as('getLinkedPlugins')
    }

    beforeEach(() => {
      // Initialize a new router before each test
      createRouter({
        routes: [
          { name: 'redis-configuration-create', path: '/kong-manager/workspaces/default/redis-configurations/create', component: { template: '<div>CreatePage</div>' } },
          { name: 'redis-configuration-detail', path: '/kong-manager/workspaces/default/redis-configurations/:id', component: { template: '<div>DetailPage</div>' } },
          { name: 'redis-configuration-edit', path: '/kong-manager/workspaces/default/redis-configurations/:id/edit', component: { template: '<div>EditPage</div>' } },
        ],
        history: createWebHistory(),
      })

      // Mock data for each test in this block
      interceptList()
    })

    for (const expected of [false, true]) {
      describe(expected ? 'allowed' : 'denied', () => {
        it(`should ${expected ? 'allow' : 'deny'} to create a new RedisConfiguration`, () => {
          cy.mount(RedisConfigurationList, {
            props: {
              config: baseConfigKM,
              cacheIdentifier: uuidv4(),
              canCreate: () => expected,
            },
          })

          cy.getTestId('toolbar-add-redis-configuration').should(expected ? 'exist' : 'not.exist')
        })

        it(`should ${expected ? 'show' : 'hide'} the View Details action if CanRetrieve evaluates to ${expected}`, () => {
          cy.mount(RedisConfigurationList, {
            props: {
              config: baseConfigKonnect,
              cacheIdentifier: uuidv4(),
              canRetrieve: () => expected,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-view').should(`${!expected ? 'not.' : ''}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Edit action if canEdit evaluates to ${expected}`, () => {
          cy.mount(RedisConfigurationList, {
            props: {
              config: baseConfigKonnect,
              cacheIdentifier: uuidv4(),
              canEdit: () => expected,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-edit').should(`${expected ? '' : 'not.'}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Delete action if canDelete evaluates to ${expected}`, () => {
          cy.mount(RedisConfigurationList, {
            props: {
              config: baseConfigKonnect,
              cacheIdentifier: uuidv4(),
              canDelete: () => expected,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-delete').should(`${expected ? '' : 'not.'}exist`)
        })
      })
    }

    for (const app of ['Kong Manager', 'Konnect']) {
      describe(app, () => {
        it('should show empty state and create redis configuration cta', () => {
          interceptList({ body: [] })

          cy.mount(RedisConfigurationList, {
            props: {
              config: app === 'Kong Manager' ? baseConfigKM : baseConfigKonnect,
              cacheIdentifier: uuidv4(),
            },
          })

          cy.wait('@getRedisConfigurations')
          cy.get('.table-empty-state').should('be.visible')
          cy.get('.table-empty-state .empty-state-action .k-button').should('be.visible')
        })

        it('should hide create redis configuration cta if user can not create', () => {
          interceptList({ body: [] })

          cy.mount(RedisConfigurationList, {
            props: {
              config: app === 'Kong Manager' ? baseConfigKM : baseConfigKonnect,
              cacheIdentifier: uuidv4(),
              canCreate: () => false,
            },
          })

          cy.wait('@getRedisConfigurations')
          cy.get('.table-empty-state .empty-state-action .k-button').should('not.exist')
        })

        it('should show redis configuration items', () => {
          interceptList()
          cy.mount(RedisConfigurationList, {
            props: {
              config: app === 'Kong Manager' ? baseConfigKM : baseConfigKonnect,
              cacheIdentifier: uuidv4(),
            },
          })

          cy.wait('@getRedisConfigurations')
          partials.data.forEach((partial) => {
            cy.get(`table tr[data-testid="${partial.name}"]`).should('be.visible')
          })
        })

        it('should handle error state', () => {
          interceptList({ status: 500 })

          cy.mount(RedisConfigurationList, {
            props: {
              config: app === 'Kong Manager' ? baseConfigKM : baseConfigKonnect,
              cacheIdentifier: uuidv4(),
            },
          })

          cy.wait('@getRedisConfigurations')
          cy.get('.table-error-state').should('be.visible')
        })

        it('should show linked plugins', () => {
          interceptList()
          interceptLinkedPlugins()

          cy.mount(RedisConfigurationList, {
            props: {
              config: app === 'Kong Manager' ? baseConfigKM : baseConfigKonnect,
              cacheIdentifier: uuidv4(),
            },
          })

          cy.wait('@getRedisConfigurations')
          cy.wait(Array(partials.data.length).fill('@getLinkedPlugins'))
          cy.getTestId('linked-plugins-inline').should('be.visible')

          // open linked plugins modal
          cy.get('[data-testid="linked-plugins-inline"]:first').click()
          cy.wait('@getLinkedPlugins')

          cy.getTestId('linked-plugins-modal').find('.modal-container').should('be.visible')
        })
      })
    }
  })
})
