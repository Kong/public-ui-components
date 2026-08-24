// Cypress component test spec file
import type { FetcherResponse } from '@kong-ui-public/entities-shared'
import type { Router } from 'vue-router'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { KongManagerGatewayServiceListConfig, KonnectGatewayServiceListConfig } from '../types'
import type { FetcherRawResponse } from '../../fixtures/mockData'
import {
  paginate,
  gatewayService1,
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
      cy.get(l).should('not.exist')
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

    it('should show create gateway service cta with a dropdown menu when canImportSpecs is true', () => {
      interceptKonnect()

      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => true,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
          canImportSpecs: true,
          'onClick:import': cy.stub().as('importSpec'),
        },
      })

      cy.wait('@getGatewayServices')
      cy.get('.kong-ui-entities-gateway-services-list').should('be.visible')
      cy.getTestId('gateway-services-entity-empty-state').should('be.visible')
      cy.getTestId('entity-create-button').should('not.exist')
      cy.getTestId('entity-create-dropdown').should('be.visible').click()
      cy.getTestId('entity-import-dropdown-item').should('be.visible').click()
      cy.get('@importSpec').should('have.been.called')
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
      cy.get(l).should('not.exist')
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

  describe('delete flow (Konnect)', () => {
    const serviceId = gatewayService1.id
    const serviceName = gatewayService1.name
    const servicesUrl = `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/services`
    const modal = '.kong-ui-entity-delete-modal'

    beforeEach(() => {
      cy.intercept(
        {
          method: 'GET',
          url: `${servicesUrl}*`,
        },
        {
          statusCode: 200,
          body: gatewayServices,
        },
      )
    })

    const interceptRelatedEntities = (routes: any[], plugins: any[]) => {
      cy.intercept(
        { method: 'GET', url: `${servicesUrl}/${serviceId}/routes*` },
        { statusCode: 200, body: { data: routes } },
      ).as('getRoutes')
      cy.intercept(
        { method: 'GET', url: `${servicesUrl}/${serviceId}/plugins*` },
        { statusCode: 200, body: { data: plugins } },
      ).as('getPlugins')
    }

    const openDeleteModal = () => {
      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => true,
          canRetrieve: () => false,
          enableForceDeleteConfirmation: true,
        },
      })

      cy.getTestId('row-actions-dropdown-trigger').eq(0).click()
      cy.get(`[data-testid="${serviceName}-actions-dropdown-popover"] [data-testid="action-entity-delete"]`).click()

      cy.wait(['@getRoutes', '@getPlugins'])
    }

    it('keeps the existing behavior when the service has no routes or plugins', () => {
      interceptRelatedEntities([], [])
      cy.intercept(
        { method: 'DELETE', url: `${servicesUrl}/${serviceId}*` },
        { statusCode: 204 },
      ).as('deleteService')

      openDeleteModal()

      cy.get(`${modal} .message`).should('contain.text', `Are you sure you want to delete this service ${serviceName}?`)
      cy.get(`${modal} .extra`).should('not.exist')
      cy.getTestId('gateway-service-delete-force-checkbox').should('not.exist')

      cy.getTestId('confirmation-input').type(serviceName)
      cy.get(`${modal} [data-testid="modal-action-button"]`).should('not.be.disabled').click()

      cy.wait('@deleteService').its('request.url').should('not.include', 'force')
    })

    it('shows a force-delete checkbox and only sends force=true once it is checked, when the service has routes', () => {
      interceptRelatedEntities([{ id: 'route-1' }, { id: 'route-2' }], [{ id: 'plugin-1' }])
      cy.intercept(
        { method: 'DELETE', url: `${servicesUrl}/${serviceId}*` },
        { statusCode: 204 },
      ).as('deleteService')

      openDeleteModal()

      cy.get(`${modal} .extra`).should('contain.text', 'Force delete')
        .and('contain.text', 'All routes must be deleted before this gateway service can be deleted. To delete the service and all its routes and plugins at once, select Force delete.')
        .and('contain.text', 'Check this box to force deletion of all routes and plugins on linked service.')
      cy.getTestId('gateway-service-delete-force-checkbox').should('exist')

      cy.getTestId('confirmation-input').type(serviceName)
      // The delete button is never disabled by the checkbox — the user can still attempt to delete without it
      cy.get(`${modal} [data-testid="modal-action-button"]`).should('not.be.disabled')

      cy.getTestId('gateway-service-delete-force-checkbox').click()
      cy.get(`${modal} [data-testid="modal-action-button"]`).click()

      cy.wait('@deleteService').its('request.url').should('include', 'force=true')
    })

    it('shows the backend error when deleting a service with routes without checking force delete', () => {
      interceptRelatedEntities([{ id: 'route-1' }], [])
      cy.intercept(
        { method: 'DELETE', url: `${servicesUrl}/${serviceId}*` },
        { statusCode: 400, body: { message: 'Service has routes attached' } },
      ).as('deleteServiceError')

      openDeleteModal()

      cy.getTestId('confirmation-input').type(serviceName)
      cy.get(`${modal} [data-testid="modal-action-button"]`).should('not.be.disabled').click()

      cy.wait('@deleteServiceError').its('request.url').should('not.include', 'force')
      cy.get(`${modal} .kong-ui-entity-delete-error`).should('contain.text', 'Service has routes attached')
    })

    it('shows the plugin count without a checkbox and deletes without force when the service only has plugins', () => {
      interceptRelatedEntities([], [{ id: 'plugin-1' }])
      cy.intercept(
        { method: 'DELETE', url: `${servicesUrl}/${serviceId}*` },
        { statusCode: 204 },
      ).as('deleteService')

      openDeleteModal()

      cy.get(`${modal} .extra`).should('contain.text', '1 associated plugin will be deleted')
      cy.getTestId('gateway-service-delete-force-checkbox').should('not.exist')

      cy.getTestId('confirmation-input').type(serviceName)
      cy.get(`${modal} [data-testid="modal-action-button"]`).should('not.be.disabled').click()

      cy.wait('@deleteService').its('request.url').should('not.include', 'force')
    })

    it('prefers a server-provided total over the fetched page length', () => {
      // The routes page happens to come back empty, but the server-reported total says otherwise
      cy.intercept(
        { method: 'GET', url: `${servicesUrl}/${serviceId}/routes*` },
        { statusCode: 200, body: { data: [], total: 5 } },
      ).as('getRoutes')
      cy.intercept(
        { method: 'GET', url: `${servicesUrl}/${serviceId}/plugins*` },
        { statusCode: 200, body: { data: [] } },
      ).as('getPlugins')

      openDeleteModal()

      cy.getTestId('gateway-service-delete-force-checkbox').should('exist')
    })

    it('fails closed and requires force delete when the related-entities check errors out', () => {
      cy.intercept(
        { method: 'GET', url: `${servicesUrl}/${serviceId}/routes*` },
        { statusCode: 500, body: {} },
      ).as('getRoutes')
      cy.intercept(
        { method: 'GET', url: `${servicesUrl}/${serviceId}/plugins*` },
        { statusCode: 200, body: { data: [] } },
      ).as('getPlugins')
      cy.intercept(
        { method: 'DELETE', url: `${servicesUrl}/${serviceId}*` },
        { statusCode: 204 },
      ).as('deleteService')

      openDeleteModal()

      cy.get(`${modal} .extra`).should('be.visible')
      cy.getTestId('gateway-service-delete-force-checkbox').should('exist')

      cy.getTestId('confirmation-input').type(serviceName)
      cy.getTestId('gateway-service-delete-force-checkbox').click()
      cy.get(`${modal} [data-testid="modal-action-button"]`).click()

      cy.wait('@deleteService').its('request.url').should('include', 'force=true')
    })

    it('skips the related-entities check and deletes normally when the feature flag is disabled', () => {
      cy.intercept(
        { method: 'GET', url: `${servicesUrl}/${serviceId}/routes*` },
        { statusCode: 200, body: { data: [{ id: 'route-1' }] } },
      ).as('getRoutes')
      cy.intercept(
        { method: 'GET', url: `${servicesUrl}/${serviceId}/plugins*` },
        { statusCode: 200, body: { data: [{ id: 'plugin-1' }] } },
      ).as('getPlugins')
      cy.intercept(
        { method: 'DELETE', url: `${servicesUrl}/${serviceId}*` },
        { statusCode: 204 },
      ).as('deleteService')

      // enableForceDeleteConfirmation defaults to false
      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => true,
          canRetrieve: () => false,
        },
      })

      cy.getTestId('row-actions-dropdown-trigger').eq(0).click()
      cy.get(`[data-testid="${serviceName}-actions-dropdown-popover"] [data-testid="action-entity-delete"]`).click()

      cy.get('@getRoutes.all').should('have.length', 0)
      cy.get('@getPlugins.all').should('have.length', 0)
      cy.get(`${modal} .extra`).should('not.exist')
      cy.getTestId('gateway-service-delete-force-checkbox').should('not.exist')

      cy.getTestId('confirmation-input').type(serviceName)
      cy.get(`${modal} [data-testid="modal-action-button"]`).should('not.be.disabled').click()

      cy.wait('@deleteService').its('request.url').should('not.include', 'force')
    })

    it('does not show the generic cascade warning', () => {
      interceptRelatedEntities([], [])

      openDeleteModal()

      cy.get(`${modal} .description`).should('not.exist')
    })
  })

  describe('delete flow (Kong Manager)', () => {
    const serviceName = gatewayService1.name
    const modal = '.kong-ui-entity-delete-modal'

    it('shows the generic cascade warning', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/services*`,
        },
        {
          statusCode: 200,
          body: gatewayServices,
        },
      )

      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => true,
          canRetrieve: () => false,
        },
      })

      cy.getTestId('row-actions-dropdown-trigger').eq(0).click()
      cy.get(`[data-testid="${serviceName}-actions-dropdown-popover"] [data-testid="action-entity-delete"]`).click()

      cy.get(`${modal} .description`).should(
        'contain.text',
        'Deleting this gateway service will also remove any associated plugins. This action cannot be reversed.',
      )
      cy.getTestId('gateway-service-delete-force-checkbox').should('not.exist')
    })
  })

  describe('Konnect - workspace URL building', () => {
    it('uses workspace-scoped URL when fetching with workspace', () => {
      const configWithWorkspace = { ...baseConfigKonnect, workspace: 'default' }
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/default/services*`,
        },
        { statusCode: 200, body: { data: [], total: 0 } },
      ).as('getWithWorkspace')

      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: configWithWorkspace,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getWithWorkspace')
      cy.get('.kong-ui-entities-gateway-services-list').should('be.visible')
    })

    it('uses workspace-scoped search URL when filtering with workspace', () => {
      const configWithWorkspace = { ...baseConfigKonnect, workspace: 'default' }
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/default/services*`,
        },
        (req) => {
          if (!req.url.includes('/services/search')) {
            req.reply({ statusCode: 200, body: gatewayServices })
          }
        },
      ).as('getWithWorkspace')

      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/default/services/search*`,
        },
        { statusCode: 200, body: { data: [], total: 0 } },
      ).as('searchWithWorkspace')

      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: configWithWorkspace,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getWithWorkspace')
      cy.get('.kong-ui-entity-filter-input input').type('gateway-service-1')
      cy.wait('@searchWithWorkspace').its('request.url').should('include', '/services/search')
    })

    it('uses non-default workspace name in fetch URL', () => {
      const configWithWorkspace = { ...baseConfigKonnect, workspace: 'my-workspace' }
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/my-workspace/services*`,
        },
        { statusCode: 200, body: { data: [], total: 0 } },
      ).as('getWithMyWorkspace')

      cy.mount(GatewayServiceList, {
        props: {
          cacheIdentifier: `gateway-service-list-${uuidv4()}`,
          config: configWithWorkspace,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getWithMyWorkspace')
      cy.get('.kong-ui-entities-gateway-services-list').should('be.visible')
    })

    it('omits workspace segment when workspace is not provided', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/services*`,
        },
        { statusCode: 200, body: { data: [], total: 0 } },
      ).as('getNoWorkspace')

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

      cy.wait('@getNoWorkspace')
      cy.get('.kong-ui-entities-gateway-services-list').should('be.visible')
    })
  })
})
