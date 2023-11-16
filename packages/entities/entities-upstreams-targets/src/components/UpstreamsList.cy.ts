// Cypress component test spec file
import UpstreamsList from './UpstreamsList.vue'
import type {
  KonnectUpstreamsListConfig,
  KongManagerUpstreamsListConfig,
} from '../types'
import type { FetcherRawResponse } from '../../fixtures/mockData'
import {
  paginate,
  upstreams,
  upstreams100,
} from '../../fixtures/mockData'
import type { FetcherResponse } from '@kong-ui-public/entities-shared'
import type { Router } from 'vue-router'
import { createMemoryHistory, createRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'

const viewRoute = 'view-upstream'
const editRoute = 'edit-upstream'
const createRoute = 'create-upstream'

const baseConfigKM: KongManagerUpstreamsListConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  isExactMatch: false,
  filterSchema: {},
  createRoute,
  getViewRoute: () => viewRoute,
  getEditRoute: () => editRoute,
}

const baseConfigKonnect: KonnectUpstreamsListConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-upstreams',
  apiBaseUrl: '/us/kong-api/konnect-api',
  createRoute,
  getViewRoute: () => viewRoute,
  getEditRoute: () => editRoute,
}

describe('<UpstreamsList />', () => {
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
          { path: '/', name: 'list-upstreams', component: { template: '<div>ListPage</div>' } },
          { path: `/${viewRoute}`, name: viewRoute, component: { template: '<div>DetailPage</div>' } },
        ],
        history: createMemoryHistory(),
      })

      // Mock data for each test in this block; doesn't matter if we use KM or Konnect
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/upstreams*`,
        },
        {
          statusCode: 200,
          body: upstreams,
        },
      )
    })

    it('should always show the Copy ID action', () => {
      cy.mount(UpstreamsList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.getTestId('dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-copy-id').should('be.visible')
    })

    for (const expected of [false, true]) {
      describe(`${expected ? 'allowed' : 'denied'}`, () => {
        it(`should ${expected ? 'allow' : 'prevent'} row click if canRetrieve evaluates to ${expected}`, () => {
          expect(router.currentRoute.value.fullPath).not.to.include(viewRoute)

          cy.mount(UpstreamsList, {
            props: {
              cacheIdentifier: `certificate-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => {},
              canEdit: () => {},
              canDelete: () => {},
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
          cy.mount(UpstreamsList, {
            props: {
              cacheIdentifier: `certificate-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => {},
              canEdit: () => {},
              canDelete: () => {},
              canRetrieve: () => expected,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-view').should(`${!expected ? 'not.' : ''}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Edit action if canEdit evaluates to ${expected}`, () => {
          cy.mount(UpstreamsList, {
            props: {
              cacheIdentifier: `certificate-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => {},
              canEdit: () => expected,
              canDelete: () => {},
              canRetrieve: () => {},
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-edit').should(`${expected ? '' : 'not.'}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Delete action if canDelete evaluates to ${expected}`, () => {
          cy.mount(UpstreamsList, {
            props: {
              cacheIdentifier: `certificate-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => {},
              canEdit: () => {},
              canDelete: () => expected,
              canRetrieve: () => {},
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
      mockData?: FetcherRawResponse;
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/upstreams*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getUpstreams')
    }

    const interceptKMMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/upstreams*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getUpstreamsMultiPage')
    }

    it('should show empty state and create upstream cta', () => {
      interceptKM()

      cy.mount(UpstreamsList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getUpstreams')
      cy.get('.kong-ui-entities-upstreams-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-upstream"]').should('be.visible')
    })

    it('should hide empty state and create upstream cta if user can not create', () => {
      interceptKM()

      cy.mount(UpstreamsList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getUpstreams')
      cy.get('.kong-ui-entities-upstreams-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-upstream"]').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/upstreams*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getUpstreams')

        cy.mount(UpstreamsList, {
          props: {
            cacheIdentifier: `certificate-list-${uuidv4()}`,
            config: baseConfigKM,
            canCreate: () => {},
            canEdit: () => {},
            canDelete: () => {},
            canRetrieve: () => {},
          },
        })

        cy.wait('@getUpstreams')
        cy.get('.kong-ui-entities-upstreams-list').should('be.visible')
        cy.get('.k-table-error-state').should('be.visible')
        if (message) {
          cy.get('.k-table-error-state .k-empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should show upstreams items', () => {
      interceptKM({
        mockData: upstreams,
      })

      cy.mount(UpstreamsList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getUpstreams')
      cy.get('.kong-ui-entities-upstreams-list tr[data-testid="upstream-1"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-upstreams-list tr[data-testid="upstream-2"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKMMultiPage({
        mockData: upstreams100,
      })

      cy.mount(UpstreamsList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      const l = '.kong-ui-entities-upstreams-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getUpstreamsMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="upstream-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getUpstreamsMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="upstream-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getUpstreamsMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="upstream-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-100"]`).should('exist')

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
        mockData: upstreams100,
      })

      cy.mount(UpstreamsList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-upstreams-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getUpstreamsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="upstream-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getUpstreamsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="upstream-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(UpstreamsList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getUpstreamsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="upstream-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getUpstreamsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="upstream-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '50 items per page',
      )
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
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/upstreams*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getUpstreams')
    }

    const interceptKonnectMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/upstreams*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getUpstreamsMultiPage')
    }

    it('should show empty state and create upstream cta', () => {
      interceptKonnect()

      cy.mount(UpstreamsList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getUpstreams')
      cy.get('.kong-ui-entities-upstreams-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-upstream"]').should('be.visible')
    })

    it('should hide empty state and create upstream cta if user can not create', () => {
      interceptKonnect()

      cy.mount(UpstreamsList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getUpstreams')
      cy.get('.kong-ui-entities-upstreams-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-upstream"]').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/upstreams*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getUpstreams')

        cy.mount(UpstreamsList, {
          props: {
            cacheIdentifier: `certificate-list-${uuidv4()}`,
            config: baseConfigKonnect,
            canCreate: () => {},
            canEdit: () => {},
            canDelete: () => {},
            canRetrieve: () => {},
          },
        })

        cy.wait('@getUpstreams')
        cy.get('.kong-ui-entities-upstreams-list').should('be.visible')
        cy.get('.k-table-error-state').should('be.visible')
        if (message) {
          cy.get('.k-table-error-state .k-empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should show upstreams items', () => {
      interceptKonnect({
        mockData: upstreams,
      })

      cy.mount(UpstreamsList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getUpstreams')
      cy.get('.kong-ui-entities-upstreams-list tr[data-testid="upstream-1"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-upstreams-list tr[data-testid="upstream-2"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKonnectMultiPage({
        mockData: upstreams100,
      })

      cy.mount(UpstreamsList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      const l = '.kong-ui-entities-upstreams-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getUpstreamsMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="upstream-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getUpstreamsMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="upstream-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getUpstreamsMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="upstream-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-100"]`).should('exist')

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
        mockData: upstreams100,
      })

      cy.mount(UpstreamsList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-upstreams-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getUpstreamsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="upstream-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getUpstreamsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="upstream-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(UpstreamsList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getUpstreamsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="upstream-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getUpstreamsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="upstream-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="upstream-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '50 items per page',
      )
    })
  })
})
