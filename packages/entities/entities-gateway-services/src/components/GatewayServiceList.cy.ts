// Cypress component test spec file
import type { FetcherResponse } from '@kong-ui-public/entities-shared'
import type { Router } from 'vue-router'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { KongManagerGatewayServiceListConfig, KonnectGatewayServiceListConfig } from '../types'
import type { FetcherRawResponse } from '../../fixtures/mockData'
import {
  paginate,
  gatewayServices,
  gatewayServices100,
} from '../../fixtures/mockData'
import GatewayServiceList from './GatewayServiceList.vue'
import { v4 as uuidv4 } from 'uuid'

describe('<GatewayServiceList />', () => {
  const viewRoute = 'view-gateway-service'
  const editRoute = 'edit-gateway-service'
  const createRoute = 'create-gateway-service'
  const debugRoute = 'debug-gateway-service'

  const baseConfigKM: KongManagerGatewayServiceListConfig = {
    app: 'kongManager',
    workspace: 'default',
    apiBaseUrl: '/kong-manager',
    isExactMatch: false,
    filterSchema: {},
    createRoute,
    getViewRoute: () => viewRoute,
    getEditRoute: () => editRoute,
    getDebugRoute: () => debugRoute,
  }

  const baseConfigKonnect: KonnectGatewayServiceListConfig = {
    app: 'konnect',
    controlPlaneId: '1234-abcd-ilove-cats',
    apiBaseUrl: '/us/kong-api',
    createRoute,
    getViewRoute: () => viewRoute,
    getEditRoute: () => editRoute,
    getDebugRoute: () => debugRoute,
  }

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
          { path: '/', name: 'list-gateway-services', component: { template: '<div>ListPage</div>' } },
          { path: `/${viewRoute}`, name: viewRoute, component: { template: '<div>DetailPage</div>' } },
        ],
        history: createMemoryHistory(),
      })

      // Mock data for each test in this block; doesn't matter if we use KM or Konnect
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/services*`,
        },
        {
          statusCode: 200,
          body: gatewayServices,
        },
      )
    })

    it('should always show the Copy ID action', () => {
      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
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

          cy.mount(GatewayServiceList, {
            props: {
              cacheIdentifier: `gateway-service-list-${uuidv4()}`,
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

        it(`should ${expected ? 'allow' : 'prevent'} status toggle if canEdit evaluates to ${expected}`, () => {
          cy.mount(GatewayServiceList, {
            props: {
              cacheIdentifier: `gateway-service-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => false,
              canEdit: () => expected,
              canDelete: () => false,
              canDebug: () => false,
              canRetrieve: () => false,
            },
            router,
          })

          cy.get('table tbody td .k-input-switch input').eq(0).should(`${expected ? 'not.' : ''}be.disabled`)
        })

        it(`should ${expected ? 'show' : 'hide'} the View Details action if canRetrieve evaluates to ${expected}`, () => {
          cy.mount(GatewayServiceList, {
            props: {
              cacheIdentifier: `gateway-service-list-${uuidv4()}`,
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
          cy.mount(GatewayServiceList, {
            props: {
              cacheIdentifier: `gateway-service-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => false,
              canEdit: () => expected,
              canDelete: () => false,
              canRetrieve: () => false,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-edit').should(`${expected ? '' : 'not.'}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Debug action if canDebug evaluates to ${expected}`, () => {
          cy.mount(GatewayServiceList, {
            props: {
              cacheIdentifier: `gateway-service-list-${uuidv4()}`,
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
          cy.mount(GatewayServiceList, {
            props: {
              cacheIdentifier: `gateway-service-list-${uuidv4()}`,
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

  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: FetcherRawResponse
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/services*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getGatewayServices')
    }

    const interceptKMMultiPage = (params?: {
      mockData?: FetcherRawResponse[]
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/services*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getGatewayServicesMultiPage')
    }

    it('should show empty state and create gateway service cta', () => {
      interceptKM()

      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => true,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getGatewayServices')
      cy.get('.kong-ui-entities-gateway-services-list').should('be.visible')
      cy.get('.table-empty-state').should('be.visible')
      cy.get('.table-empty-state .empty-state-action .k-button').should('be.visible')
    })

    it('should hide empty state and create gateway service cta if user can not create', () => {
      interceptKM()

      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getGatewayServices')
      cy.get('.kong-ui-entities-gateway-services-list').should('be.visible')
      cy.get('.table-empty-state').should('be.visible')
      cy.get('.table-empty-state .empty-state-action .k-button').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/services*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getGatewayServices')

        cy.mount(GatewayServiceList, {
          props: {
            cacheIdentifier: `gateway-service-list-${uuidv4()}`,
            config: baseConfigKM,
            canCreate: () => false,
            canEdit: () => false,
            canDelete: () => false,
            canRetrieve: () => false,
          },
        })

        cy.wait('@getGatewayServices')
        cy.get('.kong-ui-entities-gateway-services-list').should('be.visible')
        cy.get('.table-error-state').should('be.visible')
        if (message) {
          cy.get('.table-error-state .empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should show gateway service items', () => {
      interceptKM({
        mockData: gatewayServices,
      })

      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getGatewayServices')
      cy.get('.kong-ui-entities-gateway-services-list tr[data-testid="gateway-service-1"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-gateway-services-list tr[data-testid="gateway-service-2"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKMMultiPage({
        mockData: gatewayServices100,
      })

      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      const l = '.kong-ui-entities-gateway-services-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getGatewayServicesMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="gateway-service-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getGatewayServicesMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="gateway-service-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'not.have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getGatewayServicesMultiPage')

      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="gateway-service-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-100"]`).should('exist')

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
      const cacheIdentifier = `gateway-service-list-${uuidv4()}`

      interceptKMMultiPage({
        mockData: gatewayServices100,
      })

      cy.mount(GatewayServiceList, {
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

      const l = '.kong-ui-entities-gateway-services-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getGatewayServicesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="gateway-service-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('30 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).last().click()

      cy.wait('@getGatewayServicesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="gateway-service-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then(wrapper => wrapper.unmount())
      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getGatewayServicesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="gateway-service-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('15 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).last().click()

      cy.wait('@getGatewayServicesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="gateway-service-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-50"]`).should('exist')

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
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/services*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getGatewayServices')
    }

    const interceptKonnectMultiPage = (params?: {
      mockData?: FetcherRawResponse[]
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/services*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getGatewayServicesMultiPage')
    }

    it('should show empty state and create gateway service cta', () => {
      interceptKonnect()

      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => true,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getGatewayServices')
      cy.get('.kong-ui-entities-gateway-services-list').should('be.visible')
      cy.getTestId('gateway-services-entity-empty-state').should('be.visible')
      cy.getTestId('entity-create-button').should('be.visible')
    })

    it('should hide empty state and create gateway service cta if user can not create', () => {
      interceptKonnect()

      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getGatewayServices')
      cy.get('.kong-ui-entities-gateway-services-list').should('be.visible')
      cy.getTestId('gateway-services-entity-empty-state').should('be.visible')
      cy.getTestId('entity-create-button').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/services*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getGatewayServices')

        cy.mount(GatewayServiceList, {
          props: {
            cacheIdentifier: `gateway-service-list-${uuidv4()}`,
            config: baseConfigKonnect,
            canCreate: () => false,
            canEdit: () => false,
            canDelete: () => false,
            canRetrieve: () => false,
          },
        })

        cy.wait('@getGatewayServices')
        cy.get('.kong-ui-entities-gateway-services-list').should('be.visible')
        cy.get('.table-error-state').should('be.visible')
        if (message) {
          cy.get('.table-error-state .empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should show gateway service items', () => {
      interceptKonnect({
        mockData: gatewayServices,
      })

      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getGatewayServices')
      cy.get('.kong-ui-entities-gateway-services-list tr[data-testid="gateway-service-1"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-gateway-services-list tr[data-testid="gateway-service-2"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKonnectMultiPage({
        mockData: gatewayServices100,
      })

      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      const l = '.kong-ui-entities-gateway-services-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getGatewayServicesMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="gateway-service-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getGatewayServicesMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="gateway-service-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'not.have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getGatewayServicesMultiPage')

      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="gateway-service-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-100"]`).should('exist')

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
      const cacheIdentifier = `gateway-service-list-${uuidv4()}`

      interceptKonnectMultiPage({
        mockData: gatewayServices100,
      })
      cy.mount(GatewayServiceList, {
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

      const l = '.kong-ui-entities-gateway-services-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getGatewayServicesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="gateway-service-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('30 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).last().click()

      cy.wait('@getGatewayServicesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="gateway-service-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then(wrapper => wrapper.unmount())
      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getGatewayServicesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="gateway-service-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('15 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).last().click()

      cy.wait('@getGatewayServicesMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="gateway-service-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="gateway-service-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('50 items per page')
    })
  })
})
