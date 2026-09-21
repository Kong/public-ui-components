import schemaCors from '../../fixtures/schemas/cors'
import PluginConfigCard from './PluginConfigCard.vue'
import type { KongManagerPluginEntityConfig, KonnectPluginEntityConfig } from '../types'

const pluginId = '0132e113-3d1a-413b-8d15-e62cbe2cf106'
const pluginType = 'cors'

// One id per scope so each row's link/subtitle can be asserted independently.
const scopedIds = {
  service: 'a2b3c4d5-0000-0000-0000-000000000001',
  route: 'a2b3c4d5-0000-0000-0000-000000000002',
  consumer: 'a2b3c4d5-0000-0000-0000-000000000003',
  consumer_group: 'a2b3c4d5-0000-0000-0000-000000000004',
}

const scopedNames = {
  service: 'my-service',
  route: 'my-route',
  consumer: 'my-consumer',
  consumer_group: 'my-consumer-group',
}

const pluginRecord = {
  config: { origins: null },
  created_at: 1680888086,
  enabled: true,
  id: pluginId,
  instance_name: 'my_instance',
  name: pluginType,
  protocols: ['http', 'https'],
  updated_at: 1701713573,
  consumer: { id: scopedIds.consumer },
  consumer_group: { id: scopedIds.consumer_group },
  route: { id: scopedIds.route },
  service: { id: scopedIds.service },
}

const viewRoutes = {
  getServiceViewRoute: (id: string) => ({ name: 'view-service', params: { id } }),
  getRouteViewRoute: (id: string) => ({ name: 'view-route', params: { id } }),
  getConsumerViewRoute: (id: string) => ({ name: 'view-consumer', params: { id } }),
  getConsumerGroupViewRoute: (id: string) => ({ name: 'view-consumer_group', params: { id } }),
}

const baseConfigKonnect: KonnectPluginEntityConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: 'f0acb165-ff05-4788-aa06-6909b8d1694e',
  entityId: pluginId,
  pluginType,
  ...viewRoutes,
}

const baseConfigKM: KongManagerPluginEntityConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  entityId: pluginId,
  pluginType,
  ...viewRoutes,
}

describe('<PluginConfigCard />', () => {
  describe('Konnect', () => {
    const konnectBase = `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities`

    const interceptSchema = (): void => {
      cy.intercept(
        { method: 'GET', url: `${konnectBase}/schemas/plugins/${pluginType}` },
        { statusCode: 200, body: schemaCors },
      ).as('getPluginSchema')
    }

    const interceptPlugin = (): void => {
      cy.intercept(
        { method: 'GET', url: `${konnectBase}/plugins/${pluginId}*` },
        { statusCode: 200, body: pluginRecord },
      ).as('getPlugin')
    }

    /** Each scoped entity's own lookup, so a missing name can be simulated per scope. */
    const interceptScopedEntities = (overrides: Record<string, any> = {}): void => {
      cy.intercept(
        { method: 'GET', url: `${konnectBase}/services/${scopedIds.service}` },
        { statusCode: 200, body: { id: scopedIds.service, name: scopedNames.service, ...overrides.service } },
      ).as('getService')
      cy.intercept(
        { method: 'GET', url: `${konnectBase}/routes/${scopedIds.route}` },
        { statusCode: 200, body: { id: scopedIds.route, name: scopedNames.route, ...overrides.route } },
      ).as('getRoute')
      cy.intercept(
        { method: 'GET', url: `${konnectBase}/consumers/${scopedIds.consumer}` },
        { statusCode: 200, body: { id: scopedIds.consumer, username: scopedNames.consumer, ...overrides.consumer } },
      ).as('getConsumer')
      cy.intercept(
        { method: 'GET', url: `${konnectBase}/consumer_groups/${scopedIds.consumer_group}` },
        { statusCode: 200, body: { id: scopedIds.consumer_group, name: scopedNames.consumer_group, ...overrides.consumer_group } },
      ).as('getConsumerGroup')
    }

    const mountCard = (showScopeName: boolean, props: Record<string, any> = {}) => {
      return cy.mount(PluginConfigCard, {
        props: {
          config: { ...baseConfigKonnect, showScopeName },
          showNameAsLink: true,
          ...props,
        },
      })
    }

    describe('with config.showScopeName enabled', () => {
      it('labels the scope rows without the "ID" suffix', () => {
        interceptSchema()
        interceptPlugin()
        interceptScopedEntities()

        mountCard(true)
        cy.wait(['@getPluginSchema', '@getPlugin'])

        cy.getTestId('service-label').should('contain.text', 'Service')
        cy.getTestId('service-label').should('not.contain.text', 'Service ID')
        cy.getTestId('route-label').should('contain.text', 'Route')
        cy.getTestId('route-label').should('not.contain.text', 'Route ID')
        cy.getTestId('consumer-label').should('contain.text', 'Consumer')
        cy.getTestId('consumer-label').should('not.contain.text', 'Consumer ID')
        cy.getTestId('consumer_group-label').should('contain.text', 'Consumer group')
        cy.getTestId('consumer_group-label').should('not.contain.text', 'Consumer group ID')
      })

      it('renders the resolved name as a link with the id as its subtitle', () => {
        interceptSchema()
        interceptPlugin()
        interceptScopedEntities()

        mountCard(true)
        cy.wait(['@getPluginSchema', '@getPlugin'])
        cy.wait(['@getService', '@getRoute', '@getConsumer', '@getConsumerGroup'])

        // The consumer's display name comes from `username`, not `name`.
        for (const scope of ['service', 'route', 'consumer', 'consumer_group'] as const) {
          cy.getTestId(`${scope}-property-value`).within(() => {
            cy.get('.navigation-link').should('contain.text', scopedNames[scope])
            cy.get('.navigation-subtitle').should('have.text', scopedIds[scope])
            // The pre-flag emit-only button is replaced by a real link.
            cy.get('.navigation-button').should('not.exist')
          })
        }
      })

      it('falls back to the bare id when the lookup returns no name', () => {
        interceptSchema()
        interceptPlugin()
        interceptScopedEntities({ service: { name: null } })

        mountCard(true)
        cy.wait(['@getPluginSchema', '@getPlugin', '@getService'])

        cy.getTestId('service-property-value').within(() => {
          cy.get('.navigation-link').should('contain.text', scopedIds.service)
          // No name resolved means no id to repeat underneath.
          cy.get('.navigation-subtitle').should('not.exist')
        })
      })

      it('skips the name lookups when showNameAsLink is off', () => {
        interceptSchema()
        interceptPlugin()
        interceptScopedEntities()

        mountCard(true, { showNameAsLink: false })
        cy.wait(['@getPluginSchema', '@getPlugin'])

        cy.getTestId('service-copy-uuid').should('be.visible')
        cy.get('@getService.all').should('have.length', 0)
      })
    })

    describe('with config.showScopeName disabled', () => {
      it('labels the scope rows with the "ID" suffix', () => {
        interceptSchema()
        interceptPlugin()
        interceptScopedEntities()

        mountCard(false)
        cy.wait(['@getPluginSchema', '@getPlugin'])

        cy.getTestId('service-label').should('contain.text', 'Service ID')
        cy.getTestId('route-label').should('contain.text', 'Route ID')
        cy.getTestId('consumer-label').should('contain.text', 'Consumer ID')
        cy.getTestId('consumer_group-label').should('contain.text', 'Consumer group ID')
      })

      it('renders the bare id as an emit-only button, with no subtitle', () => {
        interceptSchema()
        interceptPlugin()
        interceptScopedEntities()

        mountCard(false)
        cy.wait(['@getPluginSchema', '@getPlugin'])

        for (const scope of ['service', 'route', 'consumer', 'consumer_group'] as const) {
          cy.getTestId(`${scope}-property-value`).within(() => {
            cy.get('.navigation-button').should('contain.text', scopedIds[scope])
            cy.get('.navigation-link').should('not.exist')
            cy.get('.navigation-subtitle').should('not.exist')
          })
        }
      })

      it('emits navigation-click instead of navigating', () => {
        interceptSchema()
        interceptPlugin()
        interceptScopedEntities()

        mountCard(false, { 'onNavigation-click': cy.spy().as('onNavigationClick') })
        cy.wait(['@getPluginSchema', '@getPlugin'])

        cy.getTestId('service-property-value').find('.navigation-button').click()

        cy.get('@onNavigationClick').should('have.been.calledWith', scopedIds.service, 'service')
      })

      it('never looks up the scoped entity names', () => {
        interceptSchema()
        interceptPlugin()
        interceptScopedEntities()

        mountCard(false)
        cy.wait(['@getPluginSchema', '@getPlugin'])

        // Give any stray request a chance to fire before asserting none did.
        cy.getTestId('service-property-value').find('.navigation-button').should('be.visible')

        cy.get('@getService.all').should('have.length', 0)
        cy.get('@getRoute.all').should('have.length', 0)
        cy.get('@getConsumer.all').should('have.length', 0)
        cy.get('@getConsumerGroup.all').should('have.length', 0)
      })
    })

    // Hosts resolve their flag service asynchronously, so the value can land after mount.
    // Living on the config prop (rather than an injection read once in setup) is what makes
    // this work at all — see the caveat asserted at the end.
    it('re-renders when the host flips showScopeName after mount', () => {
      interceptSchema()
      interceptPlugin()
      interceptScopedEntities()

      mountCard(false).then(({ wrapper }) => wrapper).as('vueWrapper')
      cy.wait(['@getPluginSchema', '@getPlugin'])

      cy.getTestId('service-label').should('contain.text', 'Service ID')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.setProps({
        config: { ...baseConfigKonnect, showScopeName: true },
      }))

      cy.getTestId('service-label').should('contain.text', 'Service')
      cy.getTestId('service-label').should('not.contain.text', 'Service ID')
      cy.getTestId('service-property-value').find('.navigation-link').should('exist')

      // Documented caveat: the name lookups fire on fetch:success, which already happened, so
      // the link shows the id until the card refetches. Pass a resolved flag to avoid this.
      cy.getTestId('service-property-value').find('.navigation-link').should('contain.text', scopedIds.service)
      cy.get('@getService.all').should('have.length', 0)
    })
  })

  describe('Kong Manager', () => {
    const kmBase = `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}`

    const interceptAll = (): void => {
      cy.intercept(
        { method: 'GET', url: `${kmBase}/schemas/plugins/${pluginType}` },
        { statusCode: 200, body: schemaCors },
      ).as('getPluginSchema')
      cy.intercept(
        { method: 'GET', url: `${kmBase}/plugins/${pluginId}*` },
        { statusCode: 200, body: pluginRecord },
      ).as('getPlugin')
      cy.intercept(
        { method: 'GET', url: `${kmBase}/services/${scopedIds.service}` },
        { statusCode: 200, body: { id: scopedIds.service, name: scopedNames.service } },
      ).as('getService')
    }

    it('resolves the scope name when the flag is enabled', () => {
      interceptAll()

      cy.mount(PluginConfigCard, {
        props: { config: { ...baseConfigKM, showScopeName: true }, showNameAsLink: true },
      })

      cy.wait(['@getPluginSchema', '@getPlugin', '@getService'])

      cy.getTestId('service-property-value').within(() => {
        cy.get('.navigation-link').should('contain.text', scopedNames.service)
        cy.get('.navigation-subtitle').should('have.text', scopedIds.service)
      })
    })

    it('falls back to the id when the flag is disabled', () => {
      interceptAll()

      cy.mount(PluginConfigCard, {
        props: { config: { ...baseConfigKM, showScopeName: false }, showNameAsLink: true },
      })

      cy.wait(['@getPluginSchema', '@getPlugin'])

      cy.getTestId('service-label').should('contain.text', 'Service ID')
      cy.getTestId('service-property-value').within(() => {
        cy.get('.navigation-button').should('contain.text', scopedIds.service)
        cy.get('.navigation-subtitle').should('not.exist')
      })
      cy.get('@getService.all').should('have.length', 0)
    })
  })

  it('defaults to the pre-flag view when showScopeName is omitted', () => {
    const konnectBase = `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities`

    cy.intercept(
      { method: 'GET', url: `${konnectBase}/schemas/plugins/${pluginType}` },
      { statusCode: 200, body: schemaCors },
    ).as('getPluginSchema')
    cy.intercept(
      { method: 'GET', url: `${konnectBase}/plugins/${pluginId}*` },
      { statusCode: 200, body: pluginRecord },
    ).as('getPlugin')
    cy.intercept(
      { method: 'GET', url: `${konnectBase}/services/${scopedIds.service}` },
      { statusCode: 200, body: { id: scopedIds.service, name: scopedNames.service } },
    ).as('getService')

    cy.mount(PluginConfigCard, {
      props: { config: baseConfigKonnect, showNameAsLink: true },
    })

    cy.wait(['@getPluginSchema', '@getPlugin'])

    cy.getTestId('service-label').should('contain.text', 'Service ID')
    cy.getTestId('service-property-value').find('.navigation-button').should('contain.text', scopedIds.service)
    cy.get('@getService.all').should('have.length', 0)
  })
})
