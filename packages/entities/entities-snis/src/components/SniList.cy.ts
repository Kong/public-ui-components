// Cypress component test spec file
import SniList from './SniList.vue'
import type { FetcherResponse } from '@kong-ui-public/entities-shared'
import type { FetcherRawResponse } from '../../fixtures/mockData'
import {
  paginate,
  snis,
  snis100,
} from '../../fixtures/mockData'
import type { KongManagerSniListConfig, KonnectSniListConfig } from '../types'
import { v4 as uuidv4 } from 'uuid'

const viewRoute = 'view-sni'
const editRoute = 'edit-sni'
const createRoute = 'create-sni'

const baseConfigKonnect: KonnectSniListConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-cats',
  apiBaseUrl: '/us/kong-api',
  createRoute,
  getViewRoute: () => viewRoute,
  getEditRoute: () => editRoute,
}

const baseConfigKM: KongManagerSniListConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  isExactMatch: false,
  filterSchema: {},
  createRoute,
  getViewRoute: () => viewRoute,
  getEditRoute: () => editRoute,
}

describe('<SniList />', () => {
  beforeEach(() => {
    const resizeObserverErrors = [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ]
    cy.on('uncaught:exception', err => !resizeObserverErrors.some(roe => err.message.includes(roe)))
  })

  describe('actions', () => {
    beforeEach(() => {
      // Mock data for each test in this block; doesn't matter if we use KM or Konnect
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/snis*`,
        },
        {
          statusCode: 200,
          body: snis,
        },
      )
    })

    it('should always show the Copy ID action', () => {
      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
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

    it('should always show the Copy Certificate ID action', () => {
      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.getTestId('copy-certificate-uuid').should('be.visible')
    })

    for (const expected of [false, true]) {
      describe(`${expected ? 'allowed' : 'denied'}`, () => {
        it(`should ${expected ? '' : 'not'} include the Edit action if canEdit evaluates to ${expected}`, () => {
          cy.mount(SniList, {
            props: {
              cacheIdentifier: `sni-list-${uuidv4()}`,
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

        it(`should ${expected ? '' : 'not'} include the Delete action if canDelete evaluates to ${expected}`, () => {
          cy.mount(SniList, {
            props: {
              cacheIdentifier: `sni-list-${uuidv4()}`,
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
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/snis*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getSnis')
    }

    const interceptKMMultiPage = (params?: {
      mockData?: FetcherRawResponse[]
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/snis*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getSnisMultiPage')
    }

    it('should show empty state and create sni cta', () => {
      interceptKM()

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => true,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getSnis')
      cy.get('.kong-ui-entities-snis-list').should('be.visible')
      cy.get('.table-empty-state').should('be.visible')
      cy.get('.table-empty-state .empty-state-action .k-button').should('be.visible')
    })

    it('should hide empty state and create sni cta if user can not create', () => {
      interceptKM()

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getSnis')
      cy.get('.kong-ui-entities-snis-list').should('be.visible')
      cy.get('.table-empty-state').should('be.visible')
      cy.get('.table-empty-state .empty-state-action .k-button').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/snis*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getSnis')

        cy.mount(SniList, {
          props: {
            cacheIdentifier: `sni-list-${uuidv4()}`,
            config: baseConfigKM,
            canCreate: () => false,
            canEdit: () => false,
            canDelete: () => false,
            canRetrieve: () => false,
          },
        })

        cy.wait('@getSnis')
        cy.get('.kong-ui-entities-snis-list').should('be.visible')
        cy.get('.table-error-state').should('be.visible')
        if (message) {
          cy.get('.table-error-state .empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should show SNI items', () => {
      interceptKM({
        mockData: snis,
      })

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getSnis')
      cy.get(`.kong-ui-entities-snis-list tr[data-testid="${snis.data[0].name}"]`).should('exist')
      cy.get(`.kong-ui-entities-snis-list tr[data-testid="${snis.data[1].name}"]`).should('exist')
    })

    it('should allow switching between pages', () => {
      interceptKMMultiPage({
        mockData: snis100,
      })

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      const l = '.kong-ui-entities-snis-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getSnisMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getSnisMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="sni-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'not.have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="sni-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-100"]`).should('exist')

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
      const cacheIdentifier = `sni-list-${uuidv4()}`

      interceptKMMultiPage({
        mockData: snis100,
      })

      cy.mount(SniList, {
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

      const l = '.kong-ui-entities-snis-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('30 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).last().click()

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then(wrapper => wrapper.unmount())
      cy.mount(SniList, {
        props: {
          cacheIdentifier,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('15 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).last().click()

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-50"]`).should('exist')

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
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/snis*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getSnis')
    }

    const interceptKonnectMultiPage = (params?: {
      mockData?: FetcherRawResponse[]
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/snis*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getSnisMultiPage')
    }

    it('should show empty state and create sni cta', () => {
      interceptKonnect()

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => true,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getSnis')
      cy.get('.kong-ui-entities-snis-list').should('be.visible')
      cy.getTestId('snis-entity-empty-state').should('be.visible')
      cy.getTestId('entity-create-button').should('be.visible')
    })

    it('should hide empty state and create sni cta if user can not create', () => {
      interceptKonnect()

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getSnis')
      cy.get('.kong-ui-entities-snis-list').should('be.visible')
      cy.getTestId('snis-entity-empty-state').should('be.visible')
      cy.getTestId('entity-create-button').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/snis*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getSnis')

        cy.mount(SniList, {
          props: {
            cacheIdentifier: `sni-list-${uuidv4()}`,
            config: baseConfigKonnect,
            canCreate: () => false,
            canEdit: () => false,
            canDelete: () => false,
            canRetrieve: () => false,
          },
        })

        cy.wait('@getSnis')
        cy.get('.kong-ui-entities-snis-list').should('be.visible')
        cy.get('.table-error-state').should('be.visible')
        if (message) {
          cy.get('.table-error-state .empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should show SNI items', () => {
      interceptKonnect({
        mockData: snis,
      })

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getSnis')
      cy.get(`.kong-ui-entities-snis-list tr[data-testid="${snis.data[0].name}"]`).should('exist')
      cy.get(`.kong-ui-entities-snis-list tr[data-testid="${snis.data[1].name}"]`).should('exist')
    })

    it('should allow switching between pages', () => {
      interceptKonnectMultiPage({
        mockData: snis100,
      })

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      const l = '.kong-ui-entities-snis-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getSnisMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getSnisMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="sni-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'not.have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="sni-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-100"]`).should('exist')

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
      const cacheIdentifier = `sni-list-${uuidv4()}`

      interceptKonnectMultiPage({
        mockData: snis100,
      })

      cy.mount(SniList, {
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

      const l = '.kong-ui-entities-snis-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('30 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).last().click()

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then(wrapper => wrapper.unmount())
      cy.mount(SniList, {
        props: {
          cacheIdentifier,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('15 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).last().click()

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('50 items per page')
    })

    it('should refetch after deleting an SNI', () => {
      const interceptKonnectRefetch = (params: {
        expectedOffset: number
      }) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/snis*`,
          },
          (req) => {
            const size = req.query.size ? Number(req.query.size) : 30
            const offset = req.query.offset ? Number(req.query.offset) : 0

            expect(offset).to.equal(params.expectedOffset)

            req.reply({
              statusCode: 200,
              body: paginate(snis100, size, offset),
            })
          },
        ).as('getSnisRefetch')
      }

      const interceptKonnectDelete = () => {
        cy.intercept(
          {
            method: 'DELETE',
            url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/snis/*`,
          },
          {
            statusCode: 200,
            body: {},
          },
        ).as('deleteSni')
      }

      interceptKonnectDelete()
      interceptKonnectRefetch({
        expectedOffset: 0, // initial offset should be 0
      })

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => true,
          canRetrieve: () => false,
        },
      })

      const l = '.kong-ui-entities-snis-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getSnisRefetch')
      cy.get(`${l} tbody tr[data-testid="sni-20"] td[data-testid="actions"] button[data-testid="row-actions-dropdown-trigger"]`).click()
      cy.get('[data-testid="sni-20-actions-dropdown-popover"] [data-testid="action-entity-delete"]').click()
      interceptKonnectRefetch({
        expectedOffset: 0, // after deletion, refetch should be triggered with offset 0
      })
      cy.get('.kong-ui-entity-delete-modal [data-testid="modal-action-button"]').click()
      cy.wait('@deleteSni')
      cy.wait('@getSnisRefetch')

      interceptKonnectRefetch({
        expectedOffset: 30, // on the 2nd page, refetch should be triggered with offset 30
      })
      cy.get(`${l} ${p} [data-testid="next-button"]`).click() // next page
      cy.wait('@getSnisRefetch')

      cy.get(`${l} tbody tr[data-testid="sni-50"] td[data-testid="actions"] button[data-testid="row-actions-dropdown-trigger"]`).click()
      cy.get('[data-testid="sni-50-actions-dropdown-popover"] [data-testid="action-entity-delete"]').click()
      interceptKonnectRefetch({
        expectedOffset: 30, // after deletion, refetch should be triggered with offset 30
      })
      cy.get('.kong-ui-entity-delete-modal [data-testid="modal-action-button"]').click()
      cy.wait('@deleteSni')
      cy.wait('@getSnisRefetch')

      interceptKonnectRefetch({
        expectedOffset: 60, // on the 3rd page, refetch should be triggered with offset 60
      })
      cy.get(`${l} ${p} [data-testid="next-button"]`).click() // next page
      cy.wait('@getSnisRefetch')

      interceptKonnectRefetch({
        expectedOffset: 90, // on the last page, refetch should be triggered with offset 90
      })
      cy.get(`${l} ${p} [data-testid="next-button"]`).click() // next page
      cy.wait('@getSnisRefetch')

      cy.get(`${l} tbody tr[data-testid="sni-99"] td[data-testid="actions"] button[data-testid="row-actions-dropdown-trigger"]`).click()
      cy.get('[data-testid="sni-99-actions-dropdown-popover"] [data-testid="action-entity-delete"]').click()
      interceptKonnectRefetch({
        expectedOffset: 90, // after deletion, refetch should be triggered with offset 90
      })
      cy.get('.kong-ui-entity-delete-modal [data-testid="modal-action-button"]').click()
      cy.wait('@deleteSni')
      cy.wait('@getSnisRefetch')
    })
  })
})
