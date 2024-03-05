// Cypress component test spec file
import CACertificateList from './CACertificateList.vue'
import type { KonnectCertificateListConfig, KongManagerCertificateListConfig } from '../types'
import type { FetcherRawResponse } from '../../fixtures/mockData'
import {
  paginate,
  caCertificate,
  caCertificate100,
} from '../../fixtures/mockData'
import type { FetcherResponse } from '@kong-ui-public/entities-shared'
import type { Router } from 'vue-router'
import { createMemoryHistory, createRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'

const viewRoute = 'view-ca-certificate'
const editRoute = 'edit-ca-certificate'
const createRoute = 'create-ca-certificate'

const baseConfigKM: KongManagerCertificateListConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  isExactMatch: true,
  filterSchema: {},
  createRoute,
  getViewRoute: () => viewRoute,
  getEditRoute: () => editRoute,
}

const baseConfigKonnect: KonnectCertificateListConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ca-certificate',
  apiBaseUrl: '/us/kong-api/konnect-api',
  createRoute,
  getViewRoute: () => viewRoute,
  getEditRoute: () => editRoute,
}

describe('<CACertificateList />', () => {
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
          { path: '/', name: 'list-ca-certificate', component: { template: '<div>ListPage</div>' } },
          { path: `/${viewRoute}`, name: viewRoute, component: { template: '<div>DetailPage</div>' } },
        ],
        history: createMemoryHistory(),
      })

      // Mock data for each test in this block; doesn't matter if we use KM or Konnect
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/ca_certificates*`,
        },
        {
          statusCode: 200,
          body: caCertificate,
        },
      )
    })

    it('should always show the Copy ID action', () => {
      cy.mount(CACertificateList, {
        props: {
          cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
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

          cy.mount(CACertificateList, {
            props: {
              cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
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
          cy.mount(CACertificateList, {
            props: {
              cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
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
          cy.mount(CACertificateList, {
            props: {
              cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
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
          cy.mount(CACertificateList, {
            props: {
              cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
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
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/ca_certificates*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getCaCertificate')
    }

    const interceptKMMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/ca_certificates*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getCaCertificateMultiPage')
    }

    it('should show empty state and create ca certificate cta', () => {
      interceptKM()

      cy.mount(CACertificateList, {
        props: {
          cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCaCertificate')
      cy.get('.kong-ui-entities-ca-certificates-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('.k-table-empty-state .empty-state-action .k-button').should('be.visible')
    })

    it('should hide empty state and create ca certificate cta if user can not create', () => {
      interceptKM()

      cy.mount(CACertificateList, {
        props: {
          cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCaCertificate')
      cy.get('.kong-ui-entities-ca-certificates-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('.k-table-empty-state .empty-state-action .k-button').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/ca_certificates*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getCaCertificate')

        cy.mount(CACertificateList, {
          props: {
            cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
            config: baseConfigKM,
            canCreate: () => {},
            canEdit: () => {},
            canDelete: () => {},
            canRetrieve: () => {},
          },
        })

        cy.wait('@getCaCertificate')
        cy.get('.kong-ui-entities-ca-certificates-list').should('be.visible')
        cy.get('.k-table-error-state').should('be.visible')
        if (message) {
          cy.get('.k-table-error-state .empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should allow switching between pages', () => {
      interceptKMMultiPage({
        mockData: caCertificate100,
      })

      cy.mount(CACertificateList, {
        props: {
          cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      const l = '.kong-ui-entities-ca-certificates-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getCaCertificateMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getCaCertificateMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'not.have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getCaCertificateMultiPage')

      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-100"]`).should('exist')

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
      interceptKMMultiPage({
        mockData: caCertificate100,
      })

      cy.mount(CACertificateList, {
        props: {
          cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-ca-certificates-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getCaCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('30 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).last().click()

      cy.wait('@getCaCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(CACertificateList, {
        props: {
          cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCaCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('15 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).last().click()

      cy.wait('@getCaCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('50 items per page')
    })

    it('should show ca certificate items', () => {
      interceptKM({
        mockData: caCertificate,
      })

      cy.mount(CACertificateList, {
        props: {
          cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCaCertificate')
      cy.get('.kong-ui-entities-ca-certificates-list tr[data-testid="ca-certificate-1"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-ca-certificates-list tr[data-testid="ca-certificate-2"]').should(
        'exist',
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
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/ca_certificates*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getCaCertificate')
    }

    const interceptKonnectMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/ca_certificates*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getCaCertificateMultiPage')
    }

    it('should show empty state and create ca certificate cta', () => {
      interceptKonnect()

      cy.mount(CACertificateList, {
        props: {
          cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCaCertificate')
      cy.get('.kong-ui-entities-ca-certificates-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('.k-table-empty-state .empty-state-action .k-button').should('be.visible')
    })

    it('should hide empty state and create ca certificate cta if user can not create', () => {
      interceptKonnect()

      cy.mount(CACertificateList, {
        props: {
          cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCaCertificate')
      cy.get('.kong-ui-entities-ca-certificates-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('.k-table-empty-state .empty-state-action .k-button').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/ca_certificates*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getCaCertificate')

        cy.mount(CACertificateList, {
          props: {
            cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
            config: baseConfigKonnect,
            canCreate: () => {},
            canEdit: () => {},
            canDelete: () => {},
            canRetrieve: () => {},
          },
        })

        cy.wait('@getCaCertificate')
        cy.get('.kong-ui-entities-ca-certificates-list').should('be.visible')
        cy.get('.k-table-error-state').should('be.visible')
        if (message) {
          cy.get('.k-table-error-state .empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should allow switching between pages', () => {
      interceptKonnectMultiPage({
        mockData: caCertificate100,
      })

      cy.mount(CACertificateList, {
        props: {
          cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      const l = '.kong-ui-entities-ca-certificates-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getCaCertificateMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getCaCertificateMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'not.have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getCaCertificateMultiPage')

      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-100"]`).should('exist')

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
      interceptKonnectMultiPage({
        mockData: caCertificate100,
      })

      cy.mount(CACertificateList, {
        props: {
          cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-ca-certificates-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getCaCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('30 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).last().click()

      cy.wait('@getCaCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(CACertificateList, {
        props: {
          cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCaCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('15 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).last().click()

      cy.wait('@getCaCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="ca-certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="ca-certificate-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('50 items per page')
    })

    it('should show certificate items', () => {
      interceptKonnect({
        mockData: caCertificate,
      })

      cy.mount(CACertificateList, {
        props: {
          cacheIdentifier: `ca-certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCaCertificate')
      cy.get('.kong-ui-entities-ca-certificates-list tr[data-testid="ca-certificate-1"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-ca-certificates-list tr[data-testid="ca-certificate-2"]').should(
        'exist',
      )
    })
  })
})
