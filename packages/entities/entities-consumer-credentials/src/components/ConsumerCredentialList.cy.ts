// Cypress component test spec file
import ConsumerCredentialList from './ConsumerCredentialList.vue'
import { v4 as uuidv4 } from 'uuid'
import type { FetcherResponse } from '@kong-ui-public/entities-shared'

import type { FetcherRawResponse } from '../../fixtures/mockData'
import {
  paginate,
  basicAuthCredentials,
  basicAuthCredentials100,
  keyAuthCredentials,
  keyAuthEncCredentials,
  oauth2Credentials,
  hmacAuthCredentials,
  jwtCredentials,
} from '../../fixtures/mockData'
import type { KonnectConsumerCredentialListConfig, KongManagerConsumerCredentialListConfig } from '../types'

const editRoute = 'edit-route'
const createRoute = 'create-route'

const baseConfigKonnect: KonnectConsumerCredentialListConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-cats-too',
  apiBaseUrl: '/us/kong-api/konnect-api',
  createRoute,
  getEditRoute: () => editRoute,
  consumerId: '1234-abcd',
  plugin: 'basic-auth',
}

const baseConfigKM: KongManagerConsumerCredentialListConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  createRoute,
  getEditRoute: () => editRoute,
  consumerId: '1234-abcd',
  plugin: 'basic-auth',
}

describe('<ConsumerCredentialList />', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', err => !err.message.includes('ResizeObserver loop limit exceeded'))
  })

  describe('actions', () => {
    const intercept = (mockData?: FetcherResponse) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/consumers/${baseConfigKonnect.consumerId}/*`,
        },
        {
          statusCode: 200,
          body: mockData ?? {
            data: [],
            total: 0,
          },
        },
      )
    }

    it('should always show the Copy ID action', () => {
      intercept(basicAuthCredentials)

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
        },
      })

      cy.getTestId('dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-copy-id').should('be.visible')
    })

    it('should show the Copy Credential action for basic-auth', () => {
      intercept(basicAuthCredentials)

      cy.mount(ConsumerCredentialList, {
        cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
        props: {
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
        },
      })

      cy.getTestId('dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-copy-credential').should('be.visible')
    })

    it('should show the Copy Key action for key-auth', () => {
      intercept(keyAuthCredentials)

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: {
            ...baseConfigKonnect,
            plugin: 'key-auth',
          },
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
        },
      })

      cy.getTestId('dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-copy-key').should('be.visible')
    })

    it('should show the Copy Key action for key-auth-enc', () => {
      intercept(keyAuthEncCredentials)

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: {
            ...baseConfigKonnect,
            plugin: 'key-auth-enc',
          },
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
        },
      })

      cy.getTestId('dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-copy-key').should('be.visible')
    })

    it('should show the Copy Key action for jwt', () => {
      intercept(jwtCredentials)

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: {
            ...baseConfigKonnect,
            plugin: 'key-auth-enc',
          },
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
        },
      })

      cy.getTestId('dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-copy-key').should('be.visible')
    })

    it('should show the Copy Secret action for oauth2', () => {
      intercept(oauth2Credentials)

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: {
            ...baseConfigKonnect,
            plugin: 'hmac-auth',
          },
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
        },
      })

      cy.getTestId('dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-copy-secret').should('be.visible')
    })

    it('should show the Copy Secret action for hmac-auth', () => {
      intercept(hmacAuthCredentials)

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: {
            ...baseConfigKonnect,
            plugin: 'hmac-auth',
          },
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
        },
      })

      cy.getTestId('dropdown-trigger').eq(0).click()
      cy.getTestId('action-entity-copy-secret').should('be.visible')
    })

    for (const expected of [false, true]) {
      describe(`${expected ? 'allowed' : 'denied'}`, () => {
        it(`should ${expected ? '' : 'not '}include the Edit action if canEdit evaluates to ${expected}`, () => {
          intercept(basicAuthCredentials)

          cy.mount(ConsumerCredentialList, {
            cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
            props: {
              config: baseConfigKonnect,
              canCreate: () => {},
              canEdit: () => expected,
              canDelete: () => {},
            },
          })

          cy.getTestId('dropdown-trigger').eq(0).click()
          cy.getTestId('action-entity-edit').should(`${expected ? '' : 'not.'}exist`)
        })

        it(`should ${expected ? '' : 'not '}include the Delete action if canDelete evaluates to ${expected}`, () => {
          intercept(basicAuthCredentials)

          cy.mount(ConsumerCredentialList, {
            props: {
              cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
              config: baseConfigKonnect,
              canCreate: () => {},
              canEdit: () => {},
              canDelete: () => expected,
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
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/consumers/${baseConfigKonnect.consumerId}/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getCredentials')
    }

    const interceptKMMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/consumers/${baseConfigKonnect.consumerId}/*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getCredentialsMultiPage')
    }

    it('should show empty state and create credential cta', () => {
      interceptKM()

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => true,
          canEdit: () => true,
          canDelete: () => true,
        },
      })

      cy.wait('@getCredentials')
      cy.get('.kong-ui-entities-consumer-credentials-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-basic-auth-credential"]').should('be.visible')
    })

    it('should hide empty state and create credential cta if user can not create', () => {
      interceptKM()

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCredentials')
      cy.get('.kong-ui-entities-consumer-credentials-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-basic-auth-credential"]').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/consumers/${baseConfigKonnect.consumerId}/*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getCredentials')

        cy.mount(ConsumerCredentialList, {
          props: {
            cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
            config: baseConfigKM,
            canCreate: () => {},
            canEdit: () => {},
            canDelete: () => {},
            canRetrieve: () => {},
          },
        })

        cy.wait('@getCredentials')
        cy.get('.kong-ui-entities-consumer-credentials-list').should('be.visible')
        cy.get('.k-table-error-state').should('be.visible')
        if (message) {
          cy.get('.k-table-error-state .k-empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should show credential items', () => {
      interceptKM({
        mockData: basicAuthCredentials,
      })

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCredentials')
      cy.get('.kong-ui-entities-consumer-credentials-list tr[data-rowid="1"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-consumer-credentials-list tr[data-rowid="2"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKMMultiPage({
        mockData: basicAuthCredentials100,
      })

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      const l = '.kong-ui-entities-consumer-credentials-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getCredentialsMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="29"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getCredentialsMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-rowid="31"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="32"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="59"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getCredentialsMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-rowid="91"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="92"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="99"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="100"]`).should('exist')

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
        mockData: basicAuthCredentials100,
      })

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-consumer-credentials-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getCredentialsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="29"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getCredentialsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="14"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getCredentialsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="14"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getCredentialsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="49"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="50"]`).should('exist')

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
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/consumers/${baseConfigKonnect.consumerId}/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? {
            data: [],
            total: 0,
          },
        },
      ).as(params?.alias ?? 'getCredentials')
    }

    const interceptKonnectMultiPage = (params?: {
      mockData?: FetcherRawResponse[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/consumers/${baseConfigKonnect.consumerId}/*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getCredentialsMultiPage')
    }

    it('should show empty state and create credential cta', () => {
      interceptKonnect()

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
        },
      })

      cy.wait('@getCredentials')
      cy.get('.kong-ui-entities-consumer-credentials-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-basic-auth-credential"]').should('be.visible')
    })

    it('should hide empty state and create credential cta if user can not create', () => {
      interceptKonnect()

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => {},
          canDelete: () => {},
        },
      })

      cy.wait('@getCredentials')
      cy.get('.kong-ui-entities-consumer-credentials-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-basic-auth-credential"]').should('not.exist')
    })

    it('should handle error state', () => {
      const testHandleErrorRequest = (message?: string) => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/consumers/${baseConfigKonnect.consumerId}/*`,
          },
          {
            statusCode: 500,
            body: message ? { message } : {},
          },
        ).as('getCredentials')

        cy.mount(ConsumerCredentialList, {
          props: {
            cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
            config: baseConfigKonnect,
            canCreate: () => {},
            canEdit: () => {},
            canDelete: () => {},
          },
        })

        cy.wait('@getCredentials')
        cy.get('.kong-ui-entities-consumer-credentials-list').should('be.visible')
        cy.get('.k-table-error-state').should('be.visible')
        if (message) {
          cy.get('.k-table-error-state .k-empty-state-message').should('contain.text', message)
        }
      }

      testHandleErrorRequest()
      testHandleErrorRequest('Custom error message')
    })

    it('should show route items', () => {
      interceptKonnect({
        mockData: basicAuthCredentials,
      })

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
        },
      })

      cy.wait('@getCredentials')
      cy.get('.kong-ui-entities-consumer-credentials-list tr[data-rowid="1"]').should(
        'exist',
      )
      cy.get('.kong-ui-entities-consumer-credentials-list tr[data-rowid="2"]').should(
        'exist',
      )
    })

    it('should allow switching between pages', () => {
      interceptKonnectMultiPage({
        mockData: basicAuthCredentials100,
      })

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
        },
      })

      const l = '.kong-ui-entities-consumer-credentials-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getCredentialsMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="29"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getCredentialsMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-rowid="31"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="32"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="59"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getCredentialsMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-rowid="91"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="92"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="99"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="100"]`).should('exist')

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
        mockData: basicAuthCredentials100,
      })

      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-consumer-credentials-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getCredentialsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="29"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getCredentialsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="14"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(ConsumerCredentialList, {
        props: {
          cacheIdentifier: `consumer-credential-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
        },
      })

      cy.wait('@getCredentialsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="14"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getCredentialsMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-rowid="1"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="2"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="49"]`).should('exist')
      cy.get(`${l} tbody tr[data-rowid="50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '50 items per page',
      )
    })
  })
})
