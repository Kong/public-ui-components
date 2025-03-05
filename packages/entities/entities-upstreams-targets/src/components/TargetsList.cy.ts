// Cypress component test spec file
import TargetsList from './TargetsList.vue'
import type {
  KonnectTargetsListConfig,
  KongManagerTargetsListConfig,
} from '../types'
import type { FetcherRawResponse } from '../../fixtures/mockData'
import {
  paginate,
  targets,
  targets100,
} from '../../fixtures/mockData'
import { AppType, type FetcherResponse } from '@kong-ui-public/entities-shared'
import type { Router } from 'vue-router'
import { createMemoryHistory, createRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'

const baseConfigKM: KongManagerTargetsListConfig = {
  app: AppType.KongManager,
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  isExactMatch: false,
  upstreamId: '123-qwerty-french-dj',
  canMarkHealthy: () => false,
  canMarkUnhealthy: () => false,
}

const baseConfigKonnect: KonnectTargetsListConfig = {
  app: AppType.Konnect,
  controlPlaneId: '1234-abcd-ilove-targets',
  upstreamId: '123-qwerty-french-dj',
  apiBaseUrl: '/us/kong-api',
}

const createRoute = 'create-target'

describe('<TargetsList />', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', err => !err.message.includes('ResizeObserver loop limit exceeded'))
  })

  describe('actions', () => {
    beforeEach(() => {
      // Mock data for each test in this block; doesn't matter if we use KM or Konnect
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/upstreams/${baseConfigKonnect.upstreamId}/targets*`,
        },
        {
          statusCode: 200,
          body: targets,
        },
      )
    })

    it('should always show the Copy ID action', () => {
      cy.mount(TargetsList, {
        props: {
          cacheIdentifier: `targets-list-${uuidv4()}`,
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
        it(`should ${expected ? '' : 'not'} include the Delete action if canDelete evaluates to ${expected}`, () => {
          cy.mount(TargetsList, {
            props: {
              cacheIdentifier: `targets-list-${uuidv4()}`,
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

      it(`should ${expected ? '' : 'not'} include the Edit action if canEdit evaluates to ${expected}`, () => {
        cy.mount(TargetsList, {
          props: {
            cacheIdentifier: `targets-list-${uuidv4()}`,
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
    }
  })

  describe('create target cta', { viewportHeight: 700, viewportWidth: 700 }, () => {
    // Create a new router instance for each test
    let router: Router

    beforeEach(() => {
      // Initialize a new router before each test
      router = createRouter({
        routes: [
          { path: '/', name: 'list-targets', component: { template: '<div>ListPage</div>' } },
          { path: `/${createRoute}`, name: createRoute, component: { template: '<div>CreateTargetPage</div>' } },
        ],
        history: createMemoryHistory(),
      })

      // Mock data for each test in this block; doesn't matter if we use KM or Konnect
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/upstreams/${baseConfigKonnect.upstreamId}/targets*`,
        },
        {
          statusCode: 200,
          body: targets,
        },
      )
    })

    it('create target cta should open create form in a modal when createRoute NOT provided', () => {
      cy.mount(TargetsList, {
        props: {
          cacheIdentifier: `targets-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => true,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
        router,
      })

      cy.get('.kong-ui-entities-targets-list').should('be.visible')
      cy.get('[data-testid="toolbar-new-target"]').should('be.visible').click()
      expect(router.currentRoute.value.fullPath).not.to.include(createRoute)
      cy.get('.kong-ui-entities-target-form').should('be.visible')
    })

    // TODO: can be removed when we switch to using modal all the way
    it('create target cta should open trigger route change when createRoute is provided', () => {
      cy.mount(TargetsList, {
        props: {
          cacheIdentifier: `targets-list-${uuidv4()}`,
          config: { ...baseConfigKonnect, createRoute: { name: createRoute } },
          canCreate: () => true,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
        router,
      })

      cy.get('.kong-ui-entities-targets-list').should('be.visible')
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('[data-testid="toolbar-new-target"]').should('be.visible').click().then(() => {
        cy.get('.kong-ui-entities-target-form').should('not.exist')
        expect(router.currentRoute.value.fullPath).to.include(createRoute)
      })
    })
  })

  describe('Konng Manager actions', () => {
    beforeEach(() => {
      // Mock data for each test in this block; doesn't matter if we use KM or Konnect
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/upstreams/${baseConfigKM.upstreamId}/targets*`,
        },
        {
          statusCode: 200,
          body: targets,
        },
      )
    })

    for (const expected of [false, true]) {
      describe(`${expected ? 'allowed' : 'denied'}`, () => {
        it(`should ${expected ? '' : 'not'} include the health actions when canMarkHealthy returns ${expected}`, () => {
          cy.mount(TargetsList, {
            props: {
              cacheIdentifier: `targets-list-${uuidv4()}`,
              config: { ...baseConfigKM, canMarkHealthy: () => expected },
              canCreate: () => false,
              canEdit: () => false,
              canDelete: () => false,
              canRetrieve: () => false,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-target-mark-healthy').should(`${expected ? '' : 'not.'}exist`)
          cy.getTestId('action-target-mark-unhealthy').should('not.exist')
        })

        it(`should ${expected ? '' : 'not'} include the health action when canMarkUnhealthy returns ${expected}`, () => {
          cy.mount(TargetsList, {
            props: {
              cacheIdentifier: `targets-list-${uuidv4()}`,
              config: { ...baseConfigKM, canMarkUnhealthy: () => expected },
              canCreate: () => false,
              canEdit: () => false,
              canDelete: () => false,
              canRetrieve: () => false,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-target-mark-healthy').should('not.exist')
          cy.getTestId('action-target-mark-unhealthy').should(`${expected ? '' : 'not.'}exist`)
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
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/upstreams/${baseConfigKM.upstreamId}/targets*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getTargets')
    }

    const interceptKMMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/upstreams/${baseConfigKM.upstreamId}/targets*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getTargetsMultiPage')
    }

    it('should show empty state and create target cta', () => {
      interceptKM()

      cy.mount(TargetsList, {
        props: {
          cacheIdentifier: `targets-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => true,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getTargets')
      cy.get('.kong-ui-entities-targets-list').should('be.visible')
      cy.get('.table-empty-state').should('be.visible')
      cy.getTestId('empty-state-action').should('be.visible')
    })

    it('should hide empty state and create target cta if user can not create', () => {
      interceptKM()

      cy.mount(TargetsList, {
        props: {
          cacheIdentifier: `targets-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getTargets')
      cy.get('.kong-ui-entities-targets-list').should('be.visible')
      cy.get('.table-empty-state').should('be.visible')
      cy.getTestId('empty-state-action').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/upstreams/${baseConfigKM.upstreamId}/targets*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getTargets')

        cy.mount(TargetsList, {
          props: {
            cacheIdentifier: `targets-list-${uuidv4()}`,
            config: baseConfigKM,
            canCreate: () => false,
            canEdit: () => false,
            canDelete: () => false,
            canRetrieve: () => false,
          },
        })

        cy.wait('@getTargets')
        cy.get('.kong-ui-entities-targets-list').should('be.visible')
        cy.get('.table-error-state').should('be.visible')
        if (message) {
          cy.get('.table-error-state .empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should show targets items', () => {
      interceptKM({
        mockData: targets,
      })

      cy.mount(TargetsList, {
        props: {
          cacheIdentifier: `targets-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getTargets')
      cy.get('.kong-ui-entities-targets-list tr[data-rowid="123"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-targets-list tr[data-rowid="234"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKMMultiPage({
        mockData: targets100,
      })

      cy.mount(TargetsList, {
        props: {
          cacheIdentifier: `targets-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      const l = '.kong-ui-entities-targets-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getTargetsMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="29"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getTargetsMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-rowid="31"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="32"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="59"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'not.have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getTargetsMultiPage')

      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-rowid="91"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="92"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="99"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="100"]`).should('exist')

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
      const cacheIdentifier = `targets-list-${uuidv4()}`

      interceptKMMultiPage({
        mockData: targets100,
      })

      cy.mount(TargetsList, {
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

      const l = '.kong-ui-entities-targets-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getTargetsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="29"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('30 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).last().click()

      cy.wait('@getTargetsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="14"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then(wrapper => wrapper.unmount())
      cy.mount(TargetsList, {
        props: {
          cacheIdentifier,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getTargetsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="14"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('15 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).last().click()

      cy.wait('@getTargetsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="49"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('50 items per page')
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
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/upstreams/${baseConfigKonnect.upstreamId}/targets*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getTargets')
    }

    const interceptKonnectMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/upstreams/${baseConfigKonnect.upstreamId}/targets*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getTargetsMultiPage')
    }

    it('should show empty state and create target cta', () => {
      interceptKonnect()

      cy.mount(TargetsList, {
        props: {
          cacheIdentifier: `targets-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => true,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getTargets')
      cy.get('.kong-ui-entities-targets-list').should('be.visible')
      cy.get('.table-empty-state').should('be.visible')
      cy.getTestId('empty-state-action').should('be.visible')
    })

    it('should hide empty state and create target cta if user can not create', () => {
      interceptKonnect()

      cy.mount(TargetsList, {
        props: {
          cacheIdentifier: `targets-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getTargets')
      cy.get('.kong-ui-entities-targets-list').should('be.visible')
      cy.get('.table-empty-state').should('be.visible')
      cy.getTestId('empty-state-action').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/upstreams/${baseConfigKonnect.upstreamId}/targets*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getTargets')

        cy.mount(TargetsList, {
          props: {
            cacheIdentifier: `targets-list-${uuidv4()}`,
            config: baseConfigKonnect,
            canCreate: () => false,
            canEdit: () => false,
            canDelete: () => false,
            canRetrieve: () => false,
          },
        })

        cy.wait('@getTargets')
        cy.get('.kong-ui-entities-targets-list').should('be.visible')
        cy.get('.table-error-state').should('be.visible')
        if (message) {
          cy.get('.table-error-state .empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should show targets items', () => {
      interceptKonnect({
        mockData: targets,
      })

      cy.mount(TargetsList, {
        props: {
          cacheIdentifier: `targets-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getTargets')
      cy.get('.kong-ui-entities-targets-list tr[data-rowid="123"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-targets-list tr[data-rowid="234"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKonnectMultiPage({
        mockData: targets100,
      })

      cy.mount(TargetsList, {
        props: {
          cacheIdentifier: `targets-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      const l = '.kong-ui-entities-targets-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getTargetsMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="29"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getTargetsMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-rowid="31"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="32"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="59"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'not.have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getTargetsMultiPage')

      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-rowid="91"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="92"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="99"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="100"]`).should('exist')

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
      const cacheIdentifier = `targets-list-${uuidv4()}`

      interceptKonnectMultiPage({
        mockData: targets100,
      })

      cy.mount(TargetsList, {
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

      const l = '.kong-ui-entities-targets-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getTargetsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="29"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('30 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).last().click()

      cy.wait('@getTargetsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="14"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then(wrapper => wrapper.unmount())
      cy.mount(TargetsList, {
        props: {
          cacheIdentifier,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
          canRetrieve: () => false,
        },
      })

      cy.wait('@getTargetsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="14"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('15 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).last().click()

      cy.wait('@getTargetsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="49"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('50 items per page')
    })
  })
})
