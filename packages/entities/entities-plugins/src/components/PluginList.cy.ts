// Cypress component test spec file
import PluginList from './PluginList.vue'
import type { FetcherResponse } from '@kong-ui-public/entities-shared'
import {
  FetcherRawResponse,
  paginate,
  plugins,
  plugins100,
} from '../../fixtures/mockData'
import composables from '../composables'
import { KongManagerPluginListConfig, KonnectPluginListConfig } from '../types'
import { createMemoryHistory, createRouter, Router } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'

const viewRoute = 'view-route'
const editRoute = 'edit-route'
const createRoute = 'create-route'
const scopedViewRoute = 'scoped-view-route'
const configureDynamicOrderingRoute = 'configure-dynamic-ordering-route'

const baseConfigKonnect: KonnectPluginListConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-cat-loves-everyone',
  apiBaseUrl: '/us/kong-api/konnect-api',
  createRoute,
  getViewRoute: () => viewRoute,
  getEditRoute: () => editRoute,
  getScopedEntityViewRoute: () => scopedViewRoute,
  getConfigureDynamicOrderingRoute: () => configureDynamicOrderingRoute,
}

const baseConfigKM: KongManagerPluginListConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  isExactMatch: false,
  filterSchema: {},
  createRoute,
  getViewRoute: () => viewRoute,
  getEditRoute: () => editRoute,
  getScopedEntityViewRoute: () => scopedViewRoute,
  getConfigureDynamicOrderingRoute: () => configureDynamicOrderingRoute,
}

describe('<PluginList />', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', err => !err.message.includes('ResizeObserver loop limit exceeded'))
  })

  describe('actions', () => {
    // Create a new router instance for each test
    let router: Router

    beforeEach(() => {
      // Initialize a new router before each test
      router = createRouter({
        routes: [
          { path: '/', name: 'list-plugin', component: { template: '<div>ListPage</div>' } },
          { path: `/${viewRoute}`, name: viewRoute, component: { template: '<div>DetailPage</div>' } },
          { path: `/${scopedViewRoute}`, name: scopedViewRoute, component: { template: '<div>DetailPage</div>' } },
        ],
        history: createMemoryHistory(),
      })

      // Mock data for each test in this block; doesn't matter if we use KM or Konnect
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/plugins*`,
        },
        {
          statusCode: 200,
          body: plugins,
        },
      )
    })

    it('should always show the Copy ID action', () => {
      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
          canToggle: () => { },
        },
      })

      cy.getTestId('k-dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-copy-id').should('be.visible')
    })

    it('should render correct "Name" cell', () => {
      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
          canToggle: () => { },
        },
      })

      cy.getTestId('basic-auth').find('img').should('be.visible').and($img => {
        expect($img[0].src).to.match(/basic-auth/)
        expect($img[0].naturalWidth).to.be.greaterThan(0)
      })

      cy.getTestId('acl').find('img').should('be.visible').and($img => {
        expect($img[0].src).to.match(/acl/)
        expect($img[0].naturalWidth).to.be.greaterThan(0)
      })

      cy.getTestId('basic-auth').find('[data-testid="name"] .info-name')
        .should('contain.text', 'instance-1')

      cy.getTestId('basic-auth').find('[data-testid="name"] .info-type')
        .should('contain.text', 'Basic Authentication')

      cy.getTestId('acl').find('[data-testid="name"] .info-name')
        .should('contain.text', 'ACL')

      cy.getTestId('acl').find('[data-testid="name"] .info-type')
        .should('not.exist')
    })

    it('should render correct "Applied To" badge', () => {
      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
          canToggle: () => { },
        },
      })

      cy.getTestId('basic-auth').find('[data-testid="appliedTo"] .k-badge')
        .should('not.contain.text', 'Global')
        .should('contain.text', 'Route')
        .should('contain.text', 'Consumer')
        .should('have.lengthOf', 2)

      cy.getTestId('acl').find('[data-testid="appliedTo"] .k-badge')
        .should('have.lengthOf', 1)
        .should('contain.text', 'Global')
    })

    it('should render correct enable state', () => {
      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
          canToggle: () => { },
        },
      })

      cy.getTestId('basic-auth').find('[data-testid="enabled"]').should('contain.text', 'Disabled')
      cy.getTestId('acl').find('[data-testid="enabled"]').should('contain.text', 'Enabled')
    })

    it('should render "Dynamic" / "Static" ordering badge', () => {
      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
          canToggle: () => { },
        },
      })

      cy.getTestId('basic-auth').find('[data-testid="ordering"]')
        .should('contain.text', 'Dynamic')
        .find('.k-badge-warning').should('exist')

      cy.getTestId('acl').find('[data-testid="ordering"]')
        .should('contain.text', 'Static')
        .find('.k-badge-default').should('exist')
    })

    it('should render tooltip when toogle is disabled and "getToggleDisabledTooltip" provided', () => {
      const kTooltipText = 'Some good reason...'
      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: { ...baseConfigKonnect, getToggleDisabledTooltip: () => kTooltipText },
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
          canToggle: () => false,
        },
      })

      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.getTestId('basic-auth').find('[data-testid="enabled"]')
        .trigger('mouseenter').find('.k-tooltip')
        .should('be.visible')
        .should('contain.text', kTooltipText)
    })

    for (const expected of [false, true]) {
      describe(`${expected ? 'allowed' : 'denied'}`, () => {
        it(`should ${expected ? 'allow' : 'prevent'} row click if canRetrieve evaluates to ${expected}`, () => {
          expect(router.currentRoute.value.fullPath).not.to.include(viewRoute)

          cy.mount(PluginList, {
            props: {
              cacheIdentifier: `plugin-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => { },
              canEdit: () => { },
              canDelete: () => { },
              canRetrieve: () => expected,
            },
            router,
          })

          // eslint-disable-next-line cypress/unsafe-to-chain-command
          cy.get('table tbody td').eq(0).click().then(() => {
            console.info(router.currentRoute.value.fullPath)
            if (expected) {
              expect(router.currentRoute.value.fullPath).to.include(viewRoute)
            } else {
              expect(router.currentRoute.value.fullPath).not.to.include(viewRoute)
            }
          })
        })

        it(`should ${expected ? 'show' : 'hide'} the View Details action if canRetrieve evaluates to ${expected}`, () => {
          cy.mount(PluginList, {
            props: {
              cacheIdentifier: `plugin-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => { },
              canEdit: () => { },
              canDelete: () => { },
              canRetrieve: () => expected,
            },
          })

          cy.getTestId('k-dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-view').should(`${!expected ? 'not.' : ''}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Edit action if canEdit evaluates to ${expected}`, () => {
          cy.mount(PluginList, {
            props: {
              cacheIdentifier: `plugin-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => { },
              canEdit: () => expected,
              canDelete: () => { },
              canRetrieve: () => { },
            },
          })

          cy.getTestId('k-dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-edit').should(`${expected ? '' : 'not.'}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Delete action if canDelete evaluates to ${expected}`, () => {
          cy.mount(PluginList, {
            props: {
              cacheIdentifier: `plugin-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => { },
              canEdit: () => { },
              canDelete: () => expected,
              canRetrieve: () => { },
            },
          })

          cy.getTestId('k-dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-delete').should(`${expected ? '' : 'not.'}exist`)
        })

        it(`should ${expected ? '' : ' not'} include "Configure Dynamic Ordering" if canConfigureDynamicOrdering evaluates to ${expected}`, () => {
          cy.mount(PluginList, {
            props: {
              cacheIdentifier: `plugin-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => { },
              canEdit: () => expected,
              canDelete: () => { },
              canRetrieve: () => expected,
              canConfigureDynamicOrdering: () => expected,
            },
          })

          cy.getTestId('k-dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-config-dyn-order').should(`${!expected ? 'not.' : ''}exist`)
        })

        it(`should ${expected ? 'allow' : 'prevent'} "Applied To" badge click if canRetrieveScopedEntity evaluates to ${expected}`, () => {
          expect(router.currentRoute.value.fullPath).not.to.include(scopedViewRoute)

          cy.mount(PluginList, {
            props: {
              cacheIdentifier: `plugin-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => { },
              canEdit: () => expected,
              canDelete: () => { },
              canRetrieve: () => expected,
              canRetrieveScopedEntity: () => expected,
              canConfigureDynamicOrdering: () => { },
            },
            router,
          })

          // eslint-disable-next-line cypress/unsafe-to-chain-command
          cy.get('table tbody td .k-badge').eq(0).click().then(() => {
            if (expected) {
              expect(router.currentRoute.value.fullPath).to.include(scopedViewRoute)
            } else {
              expect(router.currentRoute.value.fullPath).not.to.include(scopedViewRoute)
            }
          })
        })

        it(`should ${expected ? 'allow user' : 'prevent user from'} click the status toggler if canToggle evaluates to ${expected}`, () => {
          cy.mount(PluginList, {
            props: {
              cacheIdentifier: `plugin-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => { },
              canEdit: () => expected,
              canDelete: () => { },
              canRetrieve: () => { },
              canRetrieveScopedEntity: () => { },
              canConfigureDynamicOrdering: () => { },
              canToggle: () => expected,
            },
          })

          const { getDisplayName } = composables.usePluginMetaData()

          // eslint-disable-next-line cypress/unsafe-to-chain-command
          cy.get('[data-testid="basic-auth"] .k-switch').eq(0).click().then(() => {
            if (expected) {
              cy.get('.k-modal')
                .should('exist')
                .should('contain.text', 'Enable plugin')
                .should('contain.text', getDisplayName('basic-auth'))
                .should('contain.text', 'Yes, enable')
              cy.get('.k-modal-dialog .k-prompt-cancel').click()
            } else {
              cy.get('.k-modal').should('not.exist')
            }
          })

          // eslint-disable-next-line cypress/unsafe-to-chain-command
          cy.get('[data-testid="acl"] .k-switch').eq(0).click().then(() => {
            if (expected) {
              cy.get('.k-modal')
                .should('exist')
                .should('contain.text', 'Disable plugin')
                .should('contain.text', getDisplayName('acl'))
                .should('contain.text', 'Yes, disable')
            } else {
              cy.get('.k-modal').should('not.exist')
            }
          })
        })
      })
    }
  })

  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: FetcherRawResponse;
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/plugins*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getRoutes')
    }

    const interceptKMMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/plugins*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getRoutesMultiPage')
    }

    it('should show empty state and create plugin cta', () => {
      interceptKM()

      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => true,
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-plugins-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-plugin"]').should('be.visible')
    })

    it('should hide empty state and create plugin cta if user can not create', () => {
      interceptKM()

      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-plugins-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-plugin"]').should('not.exist')
    })

    it('should handle error state', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/plugins*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getRoutes')

      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-plugins-list').should('be.visible')
      cy.get('.k-table-error-state').should('be.visible')
    })

    it('should show plugin items', () => {
      interceptKM({
        mockData: plugins,
      })

      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-plugins-list tr[data-testid="basic-auth"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-plugins-list tr[data-testid="acl"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKMMultiPage({
        mockData: plugins100,
      })

      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      const l = '.kong-ui-entities-plugins-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getRoutesMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="plugin-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getRoutesMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="plugin-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="plugin-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-100"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`).should(
        'have.class',
        'disabled',
      )
    })

    it('should allow picking different page sizes and persist the preference', () => {
      interceptKMMultiPage({
        mockData: plugins100,
      })

      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-plugins-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="plugin-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="plugin-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="plugin-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="plugin-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '50 items per page',
      )
    })

    it('should hide `order` column and dropdown item when not supported', () => {
      interceptKM({
        mockData: plugins,
      })

      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: {
            ...baseConfigKM,
            gatewayInfo: {
              edition: 'enterprise',
              version: '2.8.0.0',
            },
          },
          canCreate: () => false,
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getRoutes')
      cy.getTestId('basic-auth').getTestId('name').should('exist')
      cy.getTestId('basic-auth').getTestId('ordering').should('not.exist')
      cy.getTestId('k-dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-config-dyn-order').should('not.exist')
    })
  })

  describe('Konnect', () => {
    const interceptKonnect = (params?: {
      mockData?: FetcherResponse;
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/plugins*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getRoutes')
    }

    const interceptKonnectMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/plugins*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getRoutesMultiPage')
    }

    it('should show empty state and create plugin cta', () => {
      interceptKonnect()

      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => true,
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-plugins-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-plugin"]').should('be.visible')
    })

    it('should hide empty state and create plugin cta if user can not create', () => {
      interceptKonnect()

      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-plugins-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-plugin"]').should('not.exist')
    })

    it('should handle error state', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/plugins*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getRoutes')

      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-plugins-list').should('be.visible')
      cy.get('.k-table-error-state').should('be.visible')
    })

    it('should show plugin items', () => {
      interceptKonnect({
        mockData: plugins,
      })

      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-plugins-list tr[data-testid="basic-auth"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-plugins-list tr[data-testid="acl"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKonnectMultiPage({
        mockData: plugins100,
      })

      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      const l = '.kong-ui-entities-plugins-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getRoutesMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="plugin-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getRoutesMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="plugin-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="plugin-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-100"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`).should(
        'have.class',
        'disabled',
      )
    })

    it('should allow picking different page sizes and persist the preference', () => {
      interceptKonnectMultiPage({
        mockData: plugins100,
      })

      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-plugins-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="plugin-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="plugin-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(PluginList, {
        props: {
          cacheIdentifier: `plugin-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="plugin-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="plugin-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="plugin-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '50 items per page',
      )
    })
  })
})
