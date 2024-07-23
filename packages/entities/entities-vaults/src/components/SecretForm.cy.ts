// Cypress component test spec file
import type { KonnectSecretFormConfig } from '../types'
import SecretForm from './SecretForm.vue'
import { secret } from '../../fixtures/mockData'

const cancelRoute = { name: 'view-route' }
const vaultId = '12345-qwerty'

const baseConfigKonnect: KonnectSecretFormConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-cats',
  apiBaseUrl: '/us/kong-api',
  cancelRoute,
}

describe('<SecretForm />', { viewportHeight: 700, viewportWidth: 700 }, () => {
  describe('Konnect', () => {
    const interceptKonnect = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/vaults/${vaultId}/secrets/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? secret,
        },
      ).as(params?.alias ?? 'getSecret')
    }

    it('should show create form', () => {
      cy.mount(SecretForm, {
        props: {
          config: baseConfigKonnect,
          vaultId,
        },
      })

      cy.get('.kong-ui-entities-secret-form').should('be.visible')
      cy.get('.kong-ui-entities-secret-form form').should('be.visible')
      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('secret-form-key').should('be.visible')
      cy.getTestId('secret-form-value').should('be.visible')
    })

    it('should correctly handle button state - create', () => {
      cy.mount(SecretForm, {
        props: {
          config: baseConfigKonnect,
          vaultId,
        },
      })

      cy.get('.kong-ui-entities-secret-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('secret-form-key').type('bicycle-kick')
      cy.getTestId('secret-form-value').clear()
      cy.getTestId('secret-form-value').type('101')
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('secret-form-key').clear()
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should show edit form', () => {
      interceptKonnect()

      cy.mount(SecretForm, {
        props: {
          config: baseConfigKonnect,
          vaultId,
          secretId: secret.key,
        },
      })

      cy.wait('@getSecret')
      cy.get('.kong-ui-entities-secret-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('secret-form-key').should('be.disabled')
      cy.getTestId('secret-form-key').should('have.value', secret.key)
      cy.getTestId('secret-form-value').should('have.value', '')
    })

    it('should correctly handle button state - edit', () => {
      interceptKonnect()

      cy.mount(SecretForm, {
        props: {
          config: baseConfigKonnect,
          vaultId,
          secretId: secret.key,
        },
      })

      cy.wait('@getSecret')
      cy.get('.kong-ui-entities-secret-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('secret-form-value').type('ubiquitous')
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('secret-form-value').clear()
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load secret', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/vaults/${vaultId}/secrets/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getSecret')

      cy.mount(SecretForm, {
        props: {
          config: baseConfigKonnect,
          vaultId,
          secretId: secret.key,
        },
      })

      cy.wait('@getSecret')
      cy.get('.kong-ui-entities-secret-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // form hidden
      cy.get('.kong-ui-entities-secret-form form').should('not.exist')
    })
  })
})
