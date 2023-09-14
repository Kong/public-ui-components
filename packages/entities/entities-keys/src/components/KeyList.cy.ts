// Cypress component test spec file
import KeyList from './KeyList.vue'
import type { FetcherResponse } from '@kong-ui-public/entities-shared'
import type { FetcherRawResponse } from '../../fixtures/mockData'
import {
  paginate,
  keys,
  keys100,
} from '../../fixtures/mockData'
import type { KongManagerKeyListConfig, KonnectKeyListConfig } from '../types'
import type { Router } from 'vue-router'
import { createMemoryHistory, createRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'

const viewRoute = 'view-key'
const editRoute = 'edit-key'
const createRoute = 'create-key'

const baseConfigKonnect: KonnectKeyListConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-cats',
  apiBaseUrl: '/us/kong-api/konnect-api',
  createRoute,
  getViewRoute: () => viewRoute,
  getEditRoute: () => editRoute,
}

const baseConfigKM: KongManagerKeyListConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  isExactMatch: false,
  filterSchema: {},
  createRoute,
  getViewRoute: () => viewRoute,
  getEditRoute: () => editRoute,
}

describe('<KeyList />', () => {
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
          { path: '/', name: 'list-key', component: { template: '<div>ListPage</div>' } },
          { path: `/${viewRoute}`, name: viewRoute, component: { template: '<div>DetailPage</div>' } },
        ],
        history: createMemoryHistory(),
      })

      // Mock data for each test in this block; doesn't matter if we use KM or Konnect
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/control_planes/${baseConfigKonnect.controlPlaneId}/keys*`,
        },
        {
          statusCode: 200,
          body: keys,
        },
      )
    })

    it('should always show the Copy ID action', () => {
      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
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

          cy.mount(KeyList, {
            props: {
              cacheIdentifier: `key-list-${uuidv4()}`,
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
          cy.mount(KeyList, {
            props: {
              cacheIdentifier: `key-list-${uuidv4()}`,
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
          cy.mount(KeyList, {
            props: {
              cacheIdentifier: `key-list-${uuidv4()}`,
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

        it(`should ${expected ? '' : 'not'} include the Delete action if canDelete evaluates to ${expected}`, () => {
          cy.mount(KeyList, {
            props: {
              cacheIdentifier: `key-list-${uuidv4()}`,
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
  })

  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: FetcherRawResponse;
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/keys*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getKeys')
    }

    const interceptKMMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/keys*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getKeysMultiPage')
    }

    it('should show empty state and create key cta', () => {
      interceptKM()

      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getKeys')
      cy.get('.kong-ui-entities-keys-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-key"]').should('be.visible')
    })

    it('should hide empty state and create key cta if user can not create', () => {
      interceptKM()

      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getKeys')
      cy.get('.kong-ui-entities-keys-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-key"]').should('not.exist')
    })

    it('should handle error state', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/keys*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getKeys')

      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getKeys')
      cy.get('.kong-ui-entities-keys-list').should('be.visible')
      cy.get('.k-table-error-state').should('be.visible')
    })

    it('should show key items', () => {
      interceptKM({
        mockData: keys,
      })

      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getKeys')
      cy.get('.kong-ui-entities-keys-list tr[data-testid="tk-kitty-key"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-keys-list tr[data-testid="key-2"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKMMultiPage({
        mockData: keys100,
      })

      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      const l = '.kong-ui-entities-keys-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getKeysMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="key-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getKeysMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="key-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getKeysMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="key-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-100"]`).should('exist')

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
        mockData: keys100,
      })

      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-keys-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getKeysMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="key-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getKeysMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="key-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getKeysMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="key-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getKeysMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="key-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-50"]`).should('exist')

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
          url: `${baseConfigKonnect.apiBaseUrl}/api/control_planes/${baseConfigKonnect.controlPlaneId}/keys*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getKeys')
    }

    const interceptKonnectMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/control_planes/${baseConfigKonnect.controlPlaneId}/keys*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getKeysMultiPage')
    }

    it('should show empty state and create key cta', () => {
      interceptKonnect()

      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getKeys')
      cy.get('.kong-ui-entities-keys-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-key"]').should('be.visible')
    })

    it('should hide empty state and create key cta if user can not create', () => {
      interceptKonnect()

      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getKeys')
      cy.get('.kong-ui-entities-keys-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-key"]').should('not.exist')
    })

    it('should handle error state', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/control_planes/${baseConfigKonnect.controlPlaneId}/keys*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getKeys')

      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getKeys')
      cy.get('.kong-ui-entities-keys-list').should('be.visible')
      cy.get('.k-table-error-state').should('be.visible')
    })

    it('should show key items', () => {
      interceptKonnect({
        mockData: keys,
      })

      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getKeys')
      cy.get('.kong-ui-entities-keys-list tr[data-testid="tk-kitty-key"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-keys-list tr[data-testid="key-2"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKonnectMultiPage({
        mockData: keys100,
      })

      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      const l = '.kong-ui-entities-keys-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getKeysMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="key-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getKeysMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="key-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getKeysMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="key-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-100"]`).should('exist')

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
        mockData: keys100,
      })

      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-keys-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getKeysMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="key-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getKeysMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="key-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(KeyList, {
        props: {
          cacheIdentifier: `key-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getKeysMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="key-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getKeysMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="key-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="key-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '50 items per page',
      )
    })
  })
})
