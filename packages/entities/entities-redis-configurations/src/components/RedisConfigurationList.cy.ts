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

  it('should show managed redis empty state description when feature flag is enabled in Konnect', () => {
    interceptList({ app: 'Konnect', body: [] })
    interceptLinkedPlugins({ app: 'Konnect' })

    cy.mount(RedisConfigurationList, {
      props: {
        config: {
          ...baseConfigKonnect,
          isKonnectManagedRedisEnabled: true,
        },
        cacheIdentifier: uuidv4(),
      },
    })

    cy.wait('@getRedisConfigurations')
    cy.getTestId('redis-entity-empty-state').should('contain.text', 'Connect your own Redis instance or use a managed one from Konnect.')
    cy.getTestId('redis-entity-empty-state').should('contain.text', 'Redis')
    cy.getTestId('redis-entity-empty-state').should('contain.text', 'New Redis')
    cy.getTestId('entity-learn-more-button').should('not.exist')
    cy.getTestId('redis-entity-empty-state').should('not.contain.text', 'Configure a Redis Configuration')
    cy.getTestId('redis-entity-empty-state').should('not.contain.text', 'New configuration')
  })

  describe('combined list (partials + add-ons when isKonnectManagedRedisEnabled)', () => {
    const combinedListPartials = {
      data: [
        { ...partials.data[0], id: 'partial-1', name: 'self-managed-config', tags: [] },
        { ...partials.data[1], id: 'partial-2', name: 'konnect-managed-config', tags: ['managed'] },
      ],
      next: null,
    }
    const addOnsResponse = {
      data: [
        { id: 'addon-123', name: 'test cloud', config: { kind: 'managed-cache.v0', state_metadata: { cache_config_id: 'partial-2' } } },
      ],
    }

    function interceptCombinedList() {
      interceptList({ app: 'Konnect', body: combinedListPartials })
      interceptLinkedPlugins({ app: 'Konnect' })
      cy.intercept({
        method: 'GET',
        url: '**/v2/cloud-gateways/add-ons*',
      }, {
        statusCode: 200,
        body: addOnsResponse,
      }).as('getAddOns')
    }

    const getCombinedListConfig = (): KonnectRedisConfigurationListConfig => ({
      ...baseConfigKonnect,
      isKonnectManagedRedisEnabled: true,
    })

    it('should show managed add-on name over linked partial name', () => {
      interceptCombinedList()
      cy.mount(RedisConfigurationList, {
        props: {
          config: getCombinedListConfig(),
          cacheIdentifier: uuidv4(),
        },
      })

      cy.getTestId('self-managed-config').should('be.visible')
      cy.getTestId('test cloud').should('be.visible')
      cy.getTestId('konnect-managed-config').should('not.exist')
      cy.get('table').should('contain.text', 'Self-managed Redis')
      cy.get('table').should('contain.text', 'Konnect-managed Redis')
    })

    it('should hide Edit action for konnect-managed row when isKonnectManagedRedisEnabled', () => {
      interceptCombinedList()
      cy.mount(RedisConfigurationList, {
        props: {
          config: getCombinedListConfig(),
          cacheIdentifier: uuidv4(),
          canEdit: () => true,
        },
      })

      cy.getTestId('test cloud').find('[data-testid="dropdown-trigger"]').click()
      cy.getTestId('test cloud-actions-dropdown-popover').find('[data-testid="action-entity-edit"]').should('not.exist')
      cy.getTestId('test cloud-actions-dropdown-popover').find('[data-testid="action-entity-view"]').should('exist')
      cy.getTestId('test cloud-actions-dropdown-popover').find('[data-testid="action-entity-delete"]').should('exist')
    })

    it('should show Konnect-managed Redis type for placeholder rows in Type column', () => {
      const placeholderPartials = {
        data: [
          { ...partials.data[0], id: 'partial-1', name: 'self-managed-config', tags: [] },
        ],
        next: null,
      }

      const addOnsResponseWithState = {
        data: [
          {
            id: 'addon-123',
            name: 'initializing cloud',
            state: 'initializing',
            config: { kind: 'managed-cache.v0' },
          },
        ],
      }

      interceptList({ app: 'Konnect', body: placeholderPartials })
      interceptLinkedPlugins({ app: 'Konnect' })
      cy.intercept({
        method: 'GET',
        url: '**/v2/cloud-gateways/add-ons*',
      }, {
        statusCode: 200,
        body: addOnsResponseWithState,
      }).as('getAddOns')

      cy.mount(RedisConfigurationList, {
        props: {
          config: getCombinedListConfig(),
          cacheIdentifier: uuidv4(),
        },
      })

      cy.wait('@getRedisConfigurations')
      cy.wait('@getAddOns')

      cy.getTestId('initializing cloud').should('be.visible')
      cy.get('table').should('contain.text', 'Konnect-managed Redis')
    })

    it('should show Konnect-managed Redis type when add-on is ready', () => {
      const placeholderPartials = {
        data: [
          { ...partials.data[0], id: 'partial-1', name: 'self-managed-config', tags: [] },
        ],
        next: null,
      }

      const addOnsResponseReady = {
        data: [
          {
            id: 'addon-456',
            name: 'ready cloud',
            state: 'ready',
            config: { kind: 'managed-cache.v0' },
          },
        ],
      }

      interceptList({ app: 'Konnect', body: placeholderPartials })
      interceptLinkedPlugins({ app: 'Konnect' })
      cy.intercept({
        method: 'GET',
        url: '**/v2/cloud-gateways/add-ons*',
      }, {
        statusCode: 200,
        body: addOnsResponseReady,
      }).as('getAddOns')

      cy.mount(RedisConfigurationList, {
        props: {
          config: getCombinedListConfig(),
          cacheIdentifier: uuidv4(),
        },
      })

      cy.wait('@getRedisConfigurations')
      cy.wait('@getAddOns')

      cy.getTestId('ready cloud').should('be.visible')
      cy.get('table').should('contain.text', 'Konnect-managed Redis')
      cy.get('table').should('not.contain.text', '(Ready)')
    })

    it('should offer View for konnect-managed rows backed only by an add-on and no Koko partial', () => {
      const placeholderPartials = {
        data: [
          { ...partials.data[0], id: 'partial-1', name: 'self-managed-config', tags: [] },
        ],
        next: null,
      }

      const addOnsResponseTerminating = {
        data: [
          {
            id: 'addon-unlinked',
            name: 'unlinked-cache-row',
            state: 'terminating',
            config: { kind: 'managed-cache.v0', state_metadata: { cache_config_id: 'gone-partial-id' } },
            owner: { control_plane_id: baseConfigKonnect.controlPlaneId },
          },
        ],
      }

      interceptList({ app: 'Konnect', body: placeholderPartials })
      interceptLinkedPlugins({ app: 'Konnect' })
      cy.intercept({
        method: 'GET',
        url: '**/v2/cloud-gateways/add-ons*',
      }, {
        statusCode: 200,
        body: addOnsResponseTerminating,
      }).as('getAddOns')

      cy.mount(RedisConfigurationList, {
        props: {
          config: getCombinedListConfig(),
          cacheIdentifier: uuidv4(),
          canRetrieve: () => true,
        },
      })

      cy.wait('@getRedisConfigurations')
      cy.wait('@getAddOns')

      cy.getTestId('unlinked-cache-row').find('[data-testid="dropdown-trigger"]').click()
      cy.getTestId('unlinked-cache-row-actions-dropdown-popover').find('[data-testid="action-entity-view"]').should('exist')
    })

    it('should resolve managed-cache row when filtering by add-on id while Koko partial fetch 404s', () => {
      const placeholderPartials = {
        data: [
          { ...partials.data[0], id: 'partial-1', name: 'self-managed-config', tags: [] },
        ],
        next: null,
      }

      cy.intercept(
        'GET',
        '**/core-entities/partials/addon-123**',
        { statusCode: 404, body: {} },
      ).as('getPartialByAddonId')

      cy.intercept(
        'GET',
        '**/v2/cloud-gateways/add-ons/addon-123',
        {
          statusCode: 200,
          body: {
            id: 'addon-123',
            name: 'initializing cloud',
            state: 'initializing',
            config: { kind: 'managed-cache.v0' },
            owner: { control_plane_id: baseConfigKonnect.controlPlaneId },
          },
        },
      ).as('getAddOnById')

      interceptList({ app: 'Konnect', body: placeholderPartials })
      interceptLinkedPlugins({ app: 'Konnect' })
      // The list endpoint calls `/add-ons` with query params, while the single-resource call uses `/add-ons/{id}`
      // In the test, match those separately so one intercept doesn't accidentally catch the other request
      cy.intercept({
        method: 'GET',
        url: '**/v2/cloud-gateways/add-ons?*',
      }, {
        statusCode: 200,
        body: {
          data: [
            {
              id: 'addon-123',
              name: 'initializing cloud',
              state: 'initializing',
              config: { kind: 'managed-cache.v0' },
              owner: { control_plane_id: baseConfigKonnect.controlPlaneId },
            },
          ],
        },
      }).as('getAddOns')

      cy.mount(RedisConfigurationList, {
        props: {
          config: {
            ...baseConfigKonnect,
            isKonnectManagedRedisEnabled: true,
            isExactMatch: true,
          },
          cacheIdentifier: uuidv4(),
        },
      })

      cy.wait('@getRedisConfigurations')
      cy.wait('@getAddOns')
      cy.getTestId('self-managed-config').should('be.visible')
      cy.getTestId('initializing cloud').should('be.visible')

      cy.get('.kong-ui-entity-filter-input [data-testid="search-input"]').clear()
      cy.get('.kong-ui-entity-filter-input [data-testid="search-input"]').type('addon-123')

      cy.wait('@getPartialByAddonId')
      cy.wait('@getAddOnById')

      cy.getTestId('initializing cloud').should('be.visible')
      cy.get('tr [data-testid="self-managed-config"]').should('not.exist')
    })
  })
})
