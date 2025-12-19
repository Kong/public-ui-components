// Cypress component test spec file
import type { FetcherResponse } from '@kong-ui-public/entities-shared'
import { v4 as uuidv4 } from 'uuid'
import type { Router } from 'vue-router'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { FetcherRawResponse } from '../../fixtures/mockData'
import {
  paginate,
  route,
  routes,
  routesTraditional100,
  routesTraditionalExpressionsMixed,
} from '../../fixtures/mockData'
import type { KongManagerRouteListConfig, KonnectRouteListConfig } from '../types'
import RouteList from './RouteList.vue'

const viewRoute = 'view-route'
const editRoute = 'edit-route'
const createRoute = 'create-route'
const debugRoute = 'debug-route'

const baseConfigKonnect: KonnectRouteListConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-cats',
  apiBaseUrl: '/us/kong-api',
  createRoute,
  getViewRoute: () => viewRoute,
  getEditRoute: () => editRoute,
  getDebugRoute: () => debugRoute,
}

const baseConfigKM: KongManagerRouteListConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  isExactMatch: false,
  filterSchema: {},
  createRoute,
  getViewRoute: () => viewRoute,
  getEditRoute: () => editRoute,
}

describe('<RouteList />', () => {
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
          { path: '/', name: 'list-route', component: { template: '<div>ListPage</div>' } },
          { path: `/${viewRoute}`, name: viewRoute, component: { template: '<div>DetailPage</div>' } },
        ],
        history: createMemoryHistory(),
      })

      // Mock data for each test in this block; doesn't matter if we use KM or Konnect
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/routes*`,
        },
        {
          statusCode: 200,
          body: routes,
        },
      )
    })

    it('should always show the Copy ID action', () => {
      cy.mount(RouteList, {
        props: {
          cacheIdentifier: `route-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.getTestId('row-actions-dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-copy-id').should('be.visible')
    })

    for (const expected of [false, true]) {
      describe(`${expected ? 'allowed' : 'denied'}`, () => {
        it(`should ${expected ? 'allow' : 'prevent'} row click if canRetrieve evaluates to ${expected}`, () => {
          expect(router.currentRoute.value.fullPath).not.to.include(viewRoute)

          cy.mount(RouteList, {
            props: {
              cacheIdentifier: `route-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => false,
              canEdit: () => false,
              canDelete: () => false,
              canRetrieve: () => expected,
            },
            router,
          })

          // eslint-disable-next-line cypress/unsafe-to-chain-command
          cy.get('table tbody td').eq(0).click().then(() => {
            if (expected) {
              expect(router.currentRoute.value.fullPath).to.include(viewRoute)
            } else {
              expect(router.currentRoute.value.fullPath).not.to.include(viewRoute)
            }
          })
        })

        it(`should ${expected ? 'show' : 'hide'} the View Details action if canRetrieve evaluates to ${expected}`, () => {
          cy.mount(RouteList, {
            props: {
              cacheIdentifier: `route-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => false,
              canEdit: () => false,
              canDelete: () => false,
              canRetrieve: () => expected,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-view').should(`${!expected ? 'not.' : ''}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Edit action if canEdit evaluates to ${expected}`, () => {
          cy.mount(RouteList, {
            props: {
              cacheIdentifier: `route-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => false,
              canEdit: () => expected,
              canDelete: () => false,
              canDebug: () => false,
              canRetrieve: () => false,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-edit').should(`${expected ? '' : 'not.'}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Debug action if canDebug evaluates to ${expected}`, () => {
          cy.mount(RouteList, {
            props: {
              cacheIdentifier: `route-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => false,
              canEdit: () => false,
              canDelete: () => false,
              canDebug: () => expected,
              canRetrieve: () => false,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-debug').should(`${expected ? '' : 'not.'}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Delete action if canDelete evaluates to ${expected}`, () => {
          cy.mount(RouteList, {
            props: {
              cacheIdentifier: `route-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => false,
              canEdit: () => false,
              canDelete: () => expected,
              canRetrieve: () => false,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-delete').should(`${expected ? '' : 'not.'}exist`)
        })
      })
    }
  })

  describe('the Expression column', () => {
    beforeEach(() => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/routes*`,
        },
        {
          statusCode: 200,
          body: routesTraditionalExpressionsMixed,
        },
      )
    })

    it('should not show the expressions column if hasExpressionsColumn is unset', () => {
      cy.mount(RouteList, {
        props: {
          cacheIdentifier: `route-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.get('table thead th').contains('Expression').should('not.exist')

      cy.get('tbody tr[data-testid="route-trad"]').should('exist').as('routeTrad')
      for (const path of route.paths) {
        cy.get('@routeTrad').findTestId('paths').should('contain.text', path)
      }

      cy.get('tbody tr[data-testid="route-expr"]').should('exist').as('routeExpr')
      cy.get('@routeExpr').findTestId('paths').should('have.text', '-')
    })

    it('should not show the expressions column if hasExpressionsColumn is unset/false', () => {
      cy.mount(RouteList, {
        props: {
          cacheIdentifier: `route-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
          hasExpressionColumn: false,
        },
      })

      cy.get('table thead th').contains('Expression').should('not.exist')

      cy.get('tbody tr[data-testid="route-trad"]').should('exist').as('routeTrad')
      for (const path of route.paths) {
        cy.get('@routeTrad').findTestId('paths').should('contain.text', path)
      }

      cy.get('tbody tr[data-testid="route-expr"]').should('exist').as('routeExpr')
      cy.get('@routeExpr').findTestId('paths').should('have.text', '-')
    })

    it('should show the expressions column if hasExpressionsColumn is true', () => {
      cy.mount(RouteList, {
        props: {
          cacheIdentifier: `route-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
          hasExpressionColumn: true,
        },
      })

      cy.get('table thead th').contains('Expression').should('exist')

      cy.get('tbody tr[data-testid="route-trad"]').should('exist').as('routeTrad')
      for (const path of route.paths) {
        cy.get('@routeTrad').findTestId('paths').should('contain.text', path)
      }
      cy.get('@routeTrad').findTestId('expression').should('have.text', '-')

      cy.get('tbody tr[data-testid="route-expr"]').should('exist').as('routeExpr')
      cy.get('@routeExpr').findTestId('paths').should('have.text', '-')
      cy.get('@routeExpr').findTestId('expression').should('have.text', 'http.path == "/kong"')
    })
  })

  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: FetcherRawResponse
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/routes*`,
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
      mockData?: FetcherRawResponse[]
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/routes*`,
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

    it('should show empty state and create route cta', () => {
      interceptKM()

      cy.mount(RouteList, {
        props: {
          cacheIdentifier: `route-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => true,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-routes-list').should('be.visible')
      cy.get('.table-empty-state').should('be.visible')
      cy.get('.table-empty-state .empty-state-action .k-button').should('be.visible')
    })

    it('should hide empty state and create route cta if user can not create', () => {
      interceptKM()

      cy.mount(RouteList, {
        props: {
          cacheIdentifier: `route-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-routes-list').should('be.visible')
      cy.get('.table-empty-state').should('be.visible')
      cy.get('.table-empty-state .empty-state-action .k-button').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/routes*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getRoutes')

        cy.mount(RouteList, {
          props: {
            cacheIdentifier: `route-list-${uuidv4()}`,
            config: baseConfigKM,
            canCreate: () => false,
            canEdit: () => false,
            canDelete: () => false,
            canRetrieve: () => false,
          },
        })

        cy.wait('@getRoutes')
        cy.get('.kong-ui-entities-routes-list').should('be.visible')
        cy.get('.table-error-state').should('be.visible')
        if (message) {
          cy.get('.table-error-state .empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should show route items', () => {
      interceptKM({
        mockData: routes,
      })

      cy.mount(RouteList, {
        props: {
          cacheIdentifier: `route-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-routes-list tr[data-testid="route-1"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-routes-list tr[data-testid="route-2"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKMMultiPage({
        mockData: routesTraditional100,
      })

      cy.mount(RouteList, {
        props: {
          cacheIdentifier: `route-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      const l = '.kong-ui-entities-routes-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getRoutesMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="route-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getRoutesMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="route-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'not.have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="route-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-100"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'not.have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`).should(
        'have.attr',
        'disabled',
      )
    })

    it('should allow picking different page sizes and persist the preference', () => {
      const cacheIdentifier = `route-list-${uuidv4()}`

      interceptKMMultiPage({
        mockData: routesTraditional100,
      })

      cy.mount(RouteList, {
        props: {
          cacheIdentifier,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-routes-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="route-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('30 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).last().click()

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="route-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then(wrapper => wrapper.unmount())
      cy.mount(RouteList, {
        props: {
          cacheIdentifier,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="route-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('15 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).last().click()

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="route-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('50 items per page')
    })
  })

  describe('Konnect', () => {
    const interceptKonnect = (params?: {
      mockData?: FetcherResponse
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/routes*`,
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
      mockData?: FetcherRawResponse[]
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/routes*`,
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

    it('should show empty state and create route cta', () => {
      interceptKonnect()

      cy.mount(RouteList, {
        props: {
          cacheIdentifier: `route-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => true,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-routes-list').should('be.visible')
      cy.getTestId('routes-entity-empty-state').should('be.visible')
      cy.getTestId('entity-create-button').should('be.visible')
    })

    it('should hide empty state and create route cta if user can not create', () => {
      interceptKonnect()

      cy.mount(RouteList, {
        props: {
          cacheIdentifier: `route-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-routes-list').should('be.visible')
      cy.getTestId('routes-entity-empty-state').should('be.visible')
      cy.getTestId('entity-create-button').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/routes*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getRoutes')

        cy.mount(RouteList, {
          props: {
            cacheIdentifier: `route-list-${uuidv4()}`,
            config: baseConfigKonnect,
            canCreate: () => false,
            canEdit: () => false,
            canDelete: () => false,
            canRetrieve: () => false,
          },
        })

        cy.wait('@getRoutes')
        cy.get('.kong-ui-entities-routes-list').should('be.visible')
        cy.get('.table-error-state').should('be.visible')
        if (message) {
          cy.get('.table-error-state .empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should show route items', () => {
      interceptKonnect({
        mockData: routes,
      })

      cy.mount(RouteList, {
        props: {
          cacheIdentifier: `route-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getRoutes')
      cy.get('.kong-ui-entities-routes-list tr[data-testid="route-1"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-routes-list tr[data-testid="route-2"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKonnectMultiPage({
        mockData: routesTraditional100,
      })

      cy.mount(RouteList, {
        props: {
          cacheIdentifier: `route-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      const l = '.kong-ui-entities-routes-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getRoutesMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="route-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getRoutesMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="route-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'not.have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="route-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-100"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'not.have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`).should(
        'have.attr',
        'disabled',
      )
    })

    it('should allow picking different page sizes and persist the preference', () => {
      const cacheIdentifier = `route-list-${uuidv4()}`

      interceptKonnectMultiPage({
        mockData: routesTraditional100,
      })

      cy.mount(RouteList, {
        props: {
          cacheIdentifier,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-routes-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="route-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('30 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).last().click()

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="route-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then(wrapper => wrapper.unmount())
      cy.mount(RouteList, {
        props: {
          cacheIdentifier,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="route-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('15 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).last().click()

      cy.wait('@getRoutesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="route-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="route-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('50 items per page')
    })
  })
})
