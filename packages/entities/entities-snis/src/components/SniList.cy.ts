// Cypress component test spec file
import SniList from './SniList.vue'
import type { FetcherResponse } from '@kong-ui-public/entities-shared'
import {
  FetcherRawResponse,
  paginate,
  snis,
  snis100,
} from '../../fixtures/mockData'
import { KongManagerSniListConfig, KonnectSniListConfig } from '../types'
import { v4 as uuidv4 } from 'uuid'

const viewRoute = 'view-sni'
const editRoute = 'edit-sni'
const createRoute = 'create-sni'

const baseConfigKonnect: KonnectSniListConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-cats',
  apiBaseUrl: '/us/kong-api/konnect-api',
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
    cy.on('uncaught:exception', err => !err.message.includes('ResizeObserver loop limit exceeded'))
  })

  describe('actions', () => {
    beforeEach(() => {
      // Mock data for each test in this block; doesn't matter if we use KM or Konnect
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/snis*`,
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
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.getTestId('k-dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-copy-id').should('be.visible')
    })

    it('should always show the Copy Certificate ID action', () => {
      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
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
          cy.mount(SniList, {
            props: {
              cacheIdentifier: `sni-list-${uuidv4()}`,
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
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getSnis')
      cy.get('.kong-ui-entities-snis-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('.k-table-empty-state .k-empty-state-cta .k-button').should('be.visible')
    })

    it('should hide empty state and create sni cta if user can not create', () => {
      interceptKM()

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getSnis')
      cy.get('.kong-ui-entities-snis-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('.k-table-empty-state .k-empty-state-cta .k-button').should('not.exist')
    })

    it('should handle error state', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/snis*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getSnis')

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getSnis')
      cy.get('.kong-ui-entities-snis-list').should('be.visible')
      cy.get('.k-table-error-state').should('be.visible')
    })

    it('should show SNI items', () => {
      interceptKM({
        mockData: snis,
      })

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
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
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      const l = '.kong-ui-entities-snis-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getSnisMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getSnisMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="sni-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="sni-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-100"]`).should('exist')

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
        mockData: snis100,
      })

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-snis-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '50 items per page',
      )
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
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/snis*`,
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
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/snis*`,
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
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getSnis')
      cy.get('.kong-ui-entities-snis-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('.k-table-empty-state .k-empty-state-cta .k-button').should('be.visible')
    })

    it('should hide empty state and create sni cta if user can not create', () => {
      interceptKonnect()

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getSnis')
      cy.get('.kong-ui-entities-snis-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="add-route"]').should('not.exist')
    })

    it('should handle error state', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/snis*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getSnis')

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getSnis')
      cy.get('.kong-ui-entities-snis-list').should('be.visible')
      cy.get('.k-table-error-state').should('be.visible')
    })

    it('should show SNI items', () => {
      interceptKonnect({
        mockData: snis,
      })

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
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
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      const l = '.kong-ui-entities-snis-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getSnisMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getSnisMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="sni-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="sni-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-100"]`).should('exist')

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
        mockData: snis100,
      })

      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-snis-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(SniList, {
        props: {
          cacheIdentifier: `sni-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => { },
          canEdit: () => { },
          canDelete: () => { },
          canRetrieve: () => { },
        },
      })

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getSnisMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="sni-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="sni-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '50 items per page',
      )
    })
  })
})
