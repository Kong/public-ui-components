// Cypress component test spec file
import SecretList from './SecretList.vue'
import type { FetcherResponse } from '@kong-ui-public/entities-shared'
import type { FetcherRawResponse } from '../../fixtures/mockData'
import {
  paginate,
  secrets,
  secrets100,
} from '../../fixtures/mockData'
import type { KonnectSecretListConfig } from '../types'
import { createMemoryHistory, createRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'

const viewRoute = 'view-route'
const editRoute = 'edit-route'
const createRoute = 'create-route'
const vaultId = 'vault-id'
const configStoreId = '123-qwerty-french-dj'

const baseConfigKonnect: KonnectSecretListConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-cats',
  apiBaseUrl: '/us/kong-api',
  createRoute,
  getEditRoute: () => editRoute,
}

describe('<SecretList />', () => {
  describe('actions', () => {
    beforeEach(() => {
      // Initialize a new router before each test
      createRouter({
        routes: [
          { path: '/', name: 'list-secret', component: { template: '<div>ListPage</div>' } },
          { path: `/${viewRoute}`, name: viewRoute, component: { template: '<div>DetailPage</div>' } },
        ],
        history: createMemoryHistory(),
      })

      // Mock data for each test in this block
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/vaults/${vaultId}`,
        },
        {
          statusCode: 200,
          body: { config: { config_store_id: configStoreId } },
        },
      )
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/config-stores/${configStoreId}/secrets*`,
        },
        {
          statusCode: 200,
          body: secrets,
        },
      )
    })

    for (const expected of [false, true]) {
      describe(`${expected ? 'allowed' : 'denied'}`, () => {
        it(`should ${expected ? '' : 'not'} include the Edit action if canEdit evaluates to ${expected}`, () => {
          cy.mount(SecretList, {
            props: {
              cacheIdentifier: `secret-list-${uuidv4()}`,
              config: baseConfigKonnect,
              vaultId,
              canCreate: () => false,
              canEdit: () => expected,
              canDelete: () => false,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-edit').should(`${expected ? '' : 'not.'}exist`)
        })

        it(`should ${expected ? '' : 'not'} include the Delete action if canDelete evaluates to ${expected}`, () => {
          cy.mount(SecretList, {
            props: {
              cacheIdentifier: `secret-list-${uuidv4()}`,
              config: baseConfigKonnect,
              vaultId,
              canCreate: () => false,
              canEdit: () => false,
              canDelete: () => expected,
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-delete').should(`${expected ? '' : 'not.'}exist`)
        })
      })
    }
  })

  describe('Konnect', () => {
    const interceptKonnect = (params?: {
      mockData?: FetcherResponse;
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/vaults/*`,
        },
        {
          statusCode: 200,
          body: { config: { config_store_id: configStoreId } },
        },
      )
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/config-stores/${configStoreId}/secrets*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getSecrets')
    }

    const interceptKonnectMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/vaults/*`,
        },
        {
          statusCode: 200,
          body: { config: { config_store_id: configStoreId } },
        },
      )
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/config-stores/${configStoreId}/secrets*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getSecretsMultiPage')
    }

    it('should show empty state and create secret cta', () => {
      interceptKonnect()

      cy.mount(SecretList, {
        props: {
          cacheIdentifier: `secret-list-${uuidv4()}`,
          config: baseConfigKonnect,
          vaultId,
          canCreate: () => true,
          canEdit: () => false,
          canDelete: () => false,
        },
      })

      cy.wait('@getSecrets')
      cy.get('.kong-ui-entities-secrets-list').should('be.visible')
      cy.get('.table-empty-state').should('be.visible')
      cy.getTestId('empty-state-action').should('be.visible')
    })

    it('should hide empty state and create secret cta if user can not create', () => {
      interceptKonnect()

      cy.mount(SecretList, {
        props: {
          cacheIdentifier: `secret-list-${uuidv4()}`,
          config: baseConfigKonnect,
          vaultId,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
        },
      })

      cy.wait('@getSecrets')
      cy.get('.kong-ui-entities-secrets-list').should('be.visible')
      cy.get('.table-empty-state').should('be.visible')
      cy.get('[data-testid="new-secret"]').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/vaults/*`,
          },
          {
            statusCode: 200,
            body: { config: { config_store_id: configStoreId } },
          },
        )
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/config-stores/${configStoreId}/secrets*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getSecrets')

        cy.mount(SecretList, {
          props: {
            cacheIdentifier: `secret-list-${uuidv4()}`,
            config: baseConfigKonnect,
            vaultId,
            canCreate: () => false,
            canEdit: () => false,
            canDelete: () => false,
          },
        })

        cy.wait('@getSecrets')
        cy.get('.kong-ui-entities-secrets-list').should('be.visible')
        cy.get('.table-error-state').should('be.visible')
        if (message) {
          cy.get('.table-error-state .empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should show secret items', () => {
      interceptKonnect({
        mockData: secrets,
      })

      cy.mount(SecretList, {
        props: {
          cacheIdentifier: `secret-list-${uuidv4()}`,
          config: baseConfigKonnect,
          vaultId,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
        },
      })

      cy.wait('@getSecrets')
      cy.get('.kong-ui-entities-secrets-list tr[data-testid="secret-1"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-secrets-list tr[data-testid="secret-2"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKonnectMultiPage({
        mockData: secrets100,
      })

      cy.mount(SecretList, {
        props: {
          cacheIdentifier: `secret-list-${uuidv4()}`,
          config: baseConfigKonnect,
          vaultId,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
        },
      })

      const l = '.kong-ui-entities-secrets-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getSecretsMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="secret-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getSecretsMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="secret-31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="previous-button"]`).should(
        'not.have.attr',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      cy.wait('@getSecretsMultiPage')

      cy.get(`${l} ${p} [data-testid="next-button"]`)
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="secret-91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-100"]`).should('exist')

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
      const cacheIdentifier = `secret-list-${uuidv4()}`

      interceptKonnectMultiPage({
        mockData: secrets100,
      })

      cy.mount(SecretList, {
        props: {
          cacheIdentifier,
          config: baseConfigKonnect,
          vaultId,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-secrets-list'
      const p = '[data-testid="table-pagination"]'

      cy.wait('@getSecretsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="secret-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('30 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).last().click()

      cy.wait('@getSecretsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="secret-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then(wrapper => wrapper.unmount())
      cy.mount(SecretList, {
        props: {
          cacheIdentifier,
          config: baseConfigKonnect,
          vaultId,
          canCreate: () => false,
          canEdit: () => false,
          canDelete: () => false,
        },
      })

      cy.wait('@getSecretsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="secret-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('15 items per page')
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).last().click()

      cy.wait('@getSecretsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="secret-1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="secret-50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).contains('50 items per page')
    })
  })
})
