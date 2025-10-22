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

  function interceptList({
    app = 'Kong Manager',
    status = 200,
    body = partials,
  }: {
    app?: string
    status?: number
    body?: any
  } = {}) {
    if (app === 'Kong Manager') {
      cy.intercept({
        method: 'GET',
        url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials*`,
      }, {
        statusCode: status,
        body,
      }).as('getRedisConfigurations')
    } else {
      cy.intercept({
        method: 'GET',
        url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/partials*`,
      }, {
        statusCode: status,
        body,
      }).as('getRedisConfigurations')
    }
  }

  function interceptLinkedPlugins({
    app = 'Kong Manager',
  }: {
    app?: string
  } = {}) {
    if (app === 'Kong Manager') {
      cy.intercept({
        method: 'GET',
        url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials/*/links*`,
      }, {
        statusCode: 200,
        body: links,
      }).as('getLinkedPlugins')
    } else {
      cy.intercept({
        method: 'GET',
        url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/partials/*/links*`,
      }, {
        statusCode: 200,
        body: links,
      }).as('getLinkedPlugins')
    }
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
  })

  describe('actions', {
    viewportHeight: 700,
    viewportWidth: 700,
  }, () => {
    for (const expected of [false, true]) {
      describe(expected ? 'allowed' : 'denied', () => {
        it(`should ${expected ? 'allow' : 'deny'} to create a new RedisConfiguration`, () => {
          interceptList()
          interceptLinkedPlugins()

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
          interceptList()
          interceptLinkedPlugins()

          cy.mount(RedisConfigurationList, {
            props: {
              config: baseConfigKM,
              cacheIdentifier: uuidv4(),
              canRetrieve: () => expected,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-view').should(`${!expected ? 'not.' : ''}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Edit action if canEdit evaluates to ${expected}`, () => {
          interceptList()
          interceptLinkedPlugins()

          cy.mount(RedisConfigurationList, {
            props: {
              config: baseConfigKM,
              cacheIdentifier: uuidv4(),
              canEdit: () => expected,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-edit').should(`${expected ? '' : 'not.'}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Delete action if canDelete evaluates to ${expected}`, () => {
          interceptList()
          interceptLinkedPlugins()

          cy.mount(RedisConfigurationList, {
            props: {
              config: baseConfigKM,
              cacheIdentifier: uuidv4(),
              canDelete: () => expected,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-delete').should(`${expected ? '' : 'not.'}exist`)
        })
      })
    }
  })

  for (const app of ['Kong Manager', 'Konnect']) {
    describe(app, () => {
      it('should show empty state and create redis configuration cta', () => {
        interceptList({ app, body: [] })
        interceptLinkedPlugins({ app })

        cy.mount(RedisConfigurationList, {
          props: {
            config: app === 'Kong Manager' ? baseConfigKM : baseConfigKonnect,
            cacheIdentifier: uuidv4(),
          },
        })

        cy.wait('@getRedisConfigurations')
        cy.getTestId('redis-entity-empty-state').should('be.visible')
        cy.get('.empty-state-action > button.primary').should('be.visible')
      })

      it('should hide create redis configuration cta if user can not create', () => {
        interceptList({ app, body: [] })
        interceptLinkedPlugins({ app })

        cy.mount(RedisConfigurationList, {
          props: {
            config: app === 'Kong Manager' ? baseConfigKM : baseConfigKonnect,
            cacheIdentifier: uuidv4(),
            canCreate: () => false,
          },
        })

        cy.wait('@getRedisConfigurations')
        cy.get('.empty-state-action > button.primary').should('not.exist')
      })

      it('should show redis configuration items', () => {
        interceptList({ app })
        interceptLinkedPlugins({ app })

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
        interceptList({ app, status: 500 })
        interceptLinkedPlugins({ app })

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
        interceptList({ app })
        interceptLinkedPlugins({ app })

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
        cy.get('[data-testid="linked-plugins-inline"]:first').scrollIntoView()
        cy.get('[data-testid="linked-plugins-inline"]:first').click()
        cy.wait('@getLinkedPlugins')

        cy.getTestId('linked-plugins-modal').find('.modal-container').should('be.visible')
      })

      it('should stop deleting if user are deleting a partial with linked plugins', () => {
        interceptList({ app })
        interceptLinkedPlugins({ app })

        cy.mount(RedisConfigurationList, {
          props: {
            config: app === 'Kong Manager' ? baseConfigKM : baseConfigKonnect,
            cacheIdentifier: uuidv4(),
          },
        })

        cy.wait('@getRedisConfigurations')

        cy.get('[data-testid="redis-config-1"]')
          .find('[data-testid="actions-dropdown"]')
          .click()

        cy.get('[data-testid="redis-config-1-actions-dropdown-popover"]')
          .find('[data-testid="action-entity-delete"]')
          .click()

        cy.wait('@getLinkedPlugins')
        cy.getTestId('remove-links-modal').find('.modal-container').should('be.visible')
      })
    })
  }
})
