// Cypress component test spec file
import CertificateList from './CertificateList.vue'
import type { KonnectCertificateListConfig, KongManagerCertificateListConfig } from '../types'
import type { FetcherRawResponse } from '../../fixtures/mockData'
import {
  paginate,
  certificate,
  certificate100,
  certificateVaultRef,
} from '../../fixtures/mockData'
import type { FetcherResponse } from '@kong-ui-public/entities-shared'
import type { Router } from 'vue-router'
import { createMemoryHistory, createRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
const viewRoute = 'view-certificate'
const editRoute = 'edit-certificate'
const createRoute = 'create-certificate'

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
  controlPlaneId: '1234-abcd-certificate',
  apiBaseUrl: '/us/kong-api/konnect-api',
  createRoute,
  getViewRoute: () => viewRoute,
  getEditRoute: () => editRoute,
}

describe('<CertificateList />', () => {
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
          { path: '/', name: 'list-certificate', component: { template: '<div>ListPage</div>' } },
          { path: `/${viewRoute}`, name: viewRoute, component: { template: '<div>DetailPage</div>' } },
        ],
        history: createMemoryHistory(),
      })

      // Mock data for each test in this block; doesn't matter if we use KM or Konnect
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/control_planes/${baseConfigKonnect.controlPlaneId}/certificates*`,
        },
        {
          statusCode: 200,
          body: certificate,
        },
      )
    })

    it('should always show the Copy ID action', () => {
      cy.mount(CertificateList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.getTestId('k-dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-copy-id').should('be.visible')
    })

    for (const expected of [false, true]) {
      describe(`${expected ? 'allowed' : 'denied'}`, () => {
        it(`should ${expected ? 'allow' : 'prevent'} row click if canRetrieve evaluates to ${expected}`, () => {
          expect(router.currentRoute.value.fullPath).not.to.include(viewRoute)

          cy.mount(CertificateList, {
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
          cy.mount(CertificateList, {
            props: {
              cacheIdentifier: `certificate-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => {},
              canEdit: () => {},
              canDelete: () => {},
              canRetrieve: () => expected,
            },
          })

          cy.getTestId('k-dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-view').should(`${!expected ? 'not.' : ''}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Edit action if canEdit evaluates to ${expected}`, () => {
          cy.mount(CertificateList, {
            props: {
              cacheIdentifier: `certificate-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => {},
              canEdit: () => expected,
              canDelete: () => {},
              canRetrieve: () => {},
            },
          })

          cy.getTestId('k-dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-edit').should(`${expected ? '' : 'not.'}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Add to SNI action if canCreateSni evaluates to ${expected}`, () => {
          cy.mount(CertificateList, {
            props: {
              cacheIdentifier: `certificate-list-${uuidv4()}`,
              config: {
                ...baseConfigKonnect,
                getCreateSniRoute: () => {},
              },
              canCreate: () => {},
              canEdit: () => {},
              canCreateSni: () => expected,
              canDelete: () => {},
              canRetrieve: () => {},
            },
          })

          cy.getTestId('k-dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-add-sni').should(`${expected ? '' : 'not.'}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Delete action if canDelete evaluates to ${expected}`, () => {
          cy.mount(CertificateList, {
            props: {
              cacheIdentifier: `certificate-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => {},
              canEdit: () => {},
              canDelete: () => expected,
              canRetrieve: () => {},
            },
          })

          cy.getTestId('k-dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-delete').should(`${expected ? '' : 'not.'}exist`)
        })
      })
    }

    it('should not include the Add to SNI action if config.getCreateSniRoute is undefined', () => {
      cy.mount(CertificateList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: {
            ...baseConfigKonnect,
            getCreateSniRoute: undefined,
          },
          canCreate: () => {},
          canEdit: () => {},
          canCreateSni: () => true,
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.getTestId('k-dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-add-sni').should('not.exist')
    })
  })

  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: FetcherRawResponse;
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/certificates*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getCertificate')
    }

    const interceptKMMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/certificates*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getCertificateMultiPage')
    }

    it('should show empty state and create certificate cta', () => {
      interceptKM()

      cy.mount(CertificateList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('.k-table-empty-state .k-empty-state-cta .k-button').should('be.visible')
    })

    it('should hide empty state and create certificate cta if user can not create', () => {
      interceptKM()

      cy.mount(CertificateList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-certificate"]').should('not.exist')
    })

    it('should handle error state', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/certificates*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getCertificate')

      cy.mount(CertificateList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-list').should('be.visible')
      cy.get('.k-table-error-state').should('be.visible')
    })

    it('should allow switching between pages', () => {
      interceptKMMultiPage({
        mockData: certificate100,
      })

      cy.mount(CertificateList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      const l = '.kong-ui-entities-certificates-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getCertificateMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getCertificateMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="certificate-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getCertificateMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="certificate-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-100"]`).should('exist')

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
        mockData: certificate100,
      })

      cy.mount(CertificateList, {
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

      const l = '.kong-ui-entities-certificates-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(CertificateList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '50 items per page',
      )
    })

    it('should show certificate items', () => {
      interceptKM({
        mockData: certificate,
      })

      cy.mount(CertificateList, {
        cacheIdentifier: `certificate-list-${uuidv4()}`,
        props: {
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-list tr[data-testid="certificate-1"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-certificates-list tr[data-testid="certificate-2"]').should(
        'exist',
      )

      const rowWithVaultRef = '.kong-ui-entities-certificates-list tr[data-testid="certificate-3"]'

      cy.get(rowWithVaultRef).should('exist')
      cy.get(rowWithVaultRef).find('[data-testid="subject"] div[role="button"]').should('contain.text', '-')
      cy.get(rowWithVaultRef).find('[data-testid="expiry"]').should('have.text', '-')
      cy.get(rowWithVaultRef).find('[data-testid="san"]').should('have.text', '-')
      cy.get(rowWithVaultRef).find('[data-testid="cert"]').should('contain.text', certificateVaultRef)
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
          url: `${baseConfigKonnect.apiBaseUrl}/api/control_planes/${baseConfigKonnect.controlPlaneId}/certificates*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getCertificate')
    }

    const interceptKonnectMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/control_planes/${baseConfigKonnect.controlPlaneId}/certificates*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getCertificateMultiPage')
    }

    it('should show empty state and create certificate cta', () => {
      interceptKonnect()

      cy.mount(CertificateList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('.k-table-empty-state .k-empty-state-cta .k-button').should('be.visible')
    })

    it('should hide empty state and create certificate cta if user can not create', () => {
      interceptKonnect()

      cy.mount(CertificateList, {
        props: {
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-certificate"]').should('not.exist')
    })

    it('should handle error state', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/control_planes/${baseConfigKonnect.controlPlaneId}/certificates*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getCertificate')

      cy.mount(CertificateList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-list').should('be.visible')
      cy.get('.k-table-error-state').should('be.visible')
    })

    it('should allow switching between pages', () => {
      interceptKonnectMultiPage({
        mockData: certificate100,
      })

      cy.mount(CertificateList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      const l = '.kong-ui-entities-certificates-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getCertificateMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getCertificateMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="certificate-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getCertificateMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="certificate-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-100"]`).should('exist')

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
        mockData: certificate100,
      })

      cy.mount(CertificateList, {
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

      const l = '.kong-ui-entities-certificates-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(CertificateList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getCertificateMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="certificate-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="certificate-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '50 items per page',
      )
    })

    it('should show certificate items', () => {
      interceptKonnect({
        mockData: certificate,
      })

      cy.mount(CertificateList, {
        props: {
          cacheIdentifier: `certificate-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-list tr[data-testid="certificate-1"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-certificates-list tr[data-testid="certificate-2"]').should(
        'exist',
      )

      const rowWithVaultRef = '.kong-ui-entities-certificates-list tr[data-testid="certificate-3"]'

      cy.get(rowWithVaultRef).should('exist')
      cy.get(rowWithVaultRef).find('[data-testid="subject"] div[role="button"]').should('contain.text', '-')
      cy.get(rowWithVaultRef).find('[data-testid="expiry"]').should('have.text', '-')
      cy.get(rowWithVaultRef).find('[data-testid="san"]').should('have.text', '-')
      cy.get(rowWithVaultRef).find('[data-testid="cert"]').should('contain.text', certificateVaultRef)
    })
  })
})
