// Cypress component test spec file
import type { KongManagerConfig, KonnectConfig } from '@kong-ui-public/entities-shared'
import {
  kongManagerVaultsResponse,
  konnectVaultId,
  secretsResponse,
  vaultsResponse,
} from '../../fixtures/mockData'
import VaultSecretPicker from './VaultSecretPicker.vue'

const baseConfigKonnect: KonnectConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: '00000000-0000-0000-0000-000000000000',
}

const baseConfigKM: KongManagerConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
}

describe('<VaultSecretPicker />', () => {
  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/vaults*`,
        },
        cy.spy((req) => {
          req.reply({
            statusCode: 200,
            body: params?.mockData ?? kongManagerVaultsResponse,
          })
        }).as(`${params?.alias ?? 'getVaults'}.handler`), // used to count requests
      ).as(params?.alias ?? 'getVaults')
    }

    it('should show nothing if `setup` prop is unset', () => {
      interceptKM()

      cy.mount(VaultSecretPicker, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.vault-secret-picker-modal').should('not.exist')
      cy.get('@getVaults.handler').should('not.be.called')
    })

    it('should show the modal if `setup` prop is empty', () => {
      interceptKM()

      cy.mount(VaultSecretPicker, {
        props: {
          config: baseConfigKM,
          setup: '',
        },
      })

      cy.wait('@getVaults')
      cy.getTestId('vault-secret-picker-modal').find('.modal-container').should('be.visible')

      // Cannot select/input secret ID and key
      cy.getTestId('vault-secret-picker-secret-id-select').should('not.exist')
      cy.getTestId('vault-secret-picker-secret-id-input').should('be.disabled')
      cy.getTestId('vault-secret-picker-secret-key-input').should('be.disabled')

      // Cannot proceed
      cy.getTestId('modal-action-button').should('be.disabled')
    })

    it('should list vaults but show input for secret IDs on selecting a non-Konnect vault', () => {
      interceptKM()

      cy.mount(VaultSecretPicker, {
        props: {
          config: baseConfigKM,
          setup: '',
          onProceed: cy.stub().as('onProceed'),
        },
      })

      cy.wait('@getVaults')
      cy.getTestId('vault-secret-picker-modal')
        .find('.modal-container').should('be.visible')

      cy.getTestId('vault-secret-picker-vault-select').click()
      cy.getTestId('vault-secret-picker-vault-popover')
        .should('be.visible')
        .find('.select-items-container .select-item')
        .should('have.length', kongManagerVaultsResponse.total)

      // Cannot select/input secret ID and key
      cy.getTestId('vault-secret-picker-secret-id-select').should('not.exist')
      cy.getTestId('vault-secret-picker-secret-id-input').should('be.disabled')
      cy.getTestId('vault-secret-picker-secret-key-input').should('be.disabled')

      // Cannot proceed
      cy.getTestId('modal-action-button').should('be.disabled')

      // Should not have the Konnect vault
      cy.getTestId('select-item-kv-1').should('not.exist')
      // Select a non-Konnect vault (e.g. an env vault)
      cy.getTestId('select-item-env-1').click()

      // Can input secret ID and key
      cy.getTestId('vault-secret-picker-secret-id-select').should('not.exist')
      cy.getTestId('vault-secret-picker-secret-id-input').should('be.enabled')
      cy.getTestId('vault-secret-picker-secret-key-input').should('be.enabled')

      // But still cannot proceed
      cy.getTestId('modal-action-button').should('be.disabled')

      // Type in a secret ID
      cy.getTestId('vault-secret-picker-secret-id-input').type('public_key')

      // Can proceed
      cy.getTestId('modal-action-button')
        .should('be.enabled')
        .click()

      // Check emitted event
      cy.get('@onProceed').should('be.calledWith', '{vault://env-1/public_key}')
    })

    it('should only allow to proceed when vault and secret is provided', () => {
      interceptKM()

      cy.mount(VaultSecretPicker, {
        props: {
          config: baseConfigKM,
          setup: '',
          onProceed: cy.stub().as('onProceed'),
        },
      })

      cy.getTestId('vault-secret-picker-modal')
        .find('.modal-container').should('be.visible')

      cy.getTestId('vault-secret-picker-vault-select').click()
      cy.getTestId('vault-secret-picker-vault-popover')
        .should('be.visible')
        .find('.select-items-container .select-item')
        .should('have.length', kongManagerVaultsResponse.total)

      // Cannot proceed
      cy.getTestId('modal-action-button').should('be.disabled')

      // Select a vault
      cy.getTestId('select-item-env-1').click()

      // Can input secret key
      cy.getTestId('vault-secret-picker-secret-key-input')
        .should('be.enabled')
        .type('refresh_token')

      // Cannot proceed
      cy.getTestId('modal-action-button').should('be.disabled')

      // Provide a secret ID
      cy.getTestId('vault-secret-picker-secret-id-input').type('tokens')

      // Can proceed
      cy.getTestId('modal-action-button')
        .should('be.enabled')
        .click()

      // Check emitted event
      cy.get('@onProceed').should('be.calledWith', '{vault://env-1/tokens/refresh_token}')
    })
  })

  describe('Konnect', () => {
    const interceptKonnect = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/vaults*`,
        },
        cy.spy((req) => {
          req.reply({
            statusCode: 200,
            body: params?.mockData ?? vaultsResponse,
          })
        }).as(`${params?.alias ?? 'getVaults'}.handler`), // used to count requests
      ).as(params?.alias ?? 'getVaults')

      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/vaults/*/secrets*`,
        },
        cy.spy((req) => {
          if (!req.url.includes(`/vaults/${konnectVaultId}/secrets`)) {
            req.reply({
              statusCode: 400,
              body: { message: 'Not a Konnect vault!' },
            })
            return
          }

          req.reply({
            statusCode: 200,
            body: params?.mockData ?? secretsResponse,
          })
        }).as(`${params?.alias ?? 'getSecrets'}.handler`), // used to count requests
      ).as(params?.alias ?? 'getSecrets')
    }

    it('should show nothing if `setup` prop is unset', () => {
      interceptKonnect()

      cy.mount(VaultSecretPicker, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.vault-secret-picker-modal').should('not.exist')
      cy.get('@getVaults.handler').should('not.be.called')
    })

    it('should show the modal if `setup` prop is empty', () => {
      interceptKonnect()

      cy.mount(VaultSecretPicker, {
        props: {
          config: baseConfigKonnect,
          setup: '',
        },
      })

      cy.wait('@getVaults')
      cy.getTestId('vault-secret-picker-modal').find('.modal-container').should('be.visible')

      // Cannot select/input secret ID and key
      cy.getTestId('vault-secret-picker-secret-id-select').should('not.exist')
      cy.getTestId('vault-secret-picker-secret-id-input').should('be.disabled')
      cy.getTestId('vault-secret-picker-secret-key-input').should('be.disabled')

      // Cannot proceed
      cy.getTestId('modal-action-button').should('be.disabled')
    })

    it('should list vaults and list secrets on selecting a Konnect vault', () => {
      interceptKonnect()

      cy.mount(VaultSecretPicker, {
        props: {
          config: baseConfigKonnect,
          setup: '',
          onProceed: cy.stub().as('onProceed'),
        },
      })

      cy.wait('@getVaults')
      cy.getTestId('vault-secret-picker-modal')
        .find('.modal-container').should('be.visible')

      cy.getTestId('vault-secret-picker-vault-select').click()
      cy.getTestId('vault-secret-picker-vault-popover')
        .should('be.visible')
        .find('.select-items-container .select-item')
        .should('have.length', vaultsResponse.total)

      // Cannot select/input secret ID and key
      cy.getTestId('vault-secret-picker-secret-id-select').should('not.exist')
      cy.getTestId('vault-secret-picker-secret-id-input').should('be.disabled')
      cy.getTestId('vault-secret-picker-secret-key-input').should('be.disabled')

      // Cannot proceed
      cy.getTestId('modal-action-button').should('be.disabled')

      // Select Konnect vault
      cy.getTestId('select-item-kv-1').click()

      // Should fetch secrets
      cy.wait('@getSecrets')

      // Can select secret ID and input key
      cy.getTestId('vault-secret-picker-secret-id-select').should('be.enabled')
      cy.getTestId('vault-secret-picker-secret-id-input').should('not.exist')
      cy.getTestId('vault-secret-picker-secret-key-input').should('be.enabled')

      // But still cannot proceed
      cy.getTestId('modal-action-button').should('be.disabled')

      cy.getTestId('vault-secret-picker-secret-id-select').click()
      cy.getTestId('vault-secret-picker-secret-id-popover')
        .should('be.visible')
        .find('.select-items-container .select-item')
        .should('have.length', secretsResponse.total)

      // Select a secret
      cy.getTestId('select-item-password').click()

      // Can proceed
      cy.getTestId('modal-action-button')
        .should('be.enabled')
        .click()

      // Check emitted event
      cy.get('@onProceed').should('be.calledWith', '{vault://kv-1/password}')
    })

    it('should list vaults but show input for secret IDs on selecting a non-Konnect vault', () => {
      interceptKonnect()

      cy.mount(VaultSecretPicker, {
        props: {
          config: baseConfigKonnect,
          setup: '',
          onProceed: cy.stub().as('onProceed'),
        },
      })

      cy.wait('@getVaults')
      cy.getTestId('vault-secret-picker-modal')
        .find('.modal-container').should('be.visible')

      cy.getTestId('vault-secret-picker-vault-select').click()
      cy.getTestId('vault-secret-picker-vault-popover')
        .should('be.visible')
        .find('.select-items-container .select-item')
        .should('have.length', vaultsResponse.total)

      // Cannot select/input secret ID and key
      cy.getTestId('vault-secret-picker-secret-id-select').should('not.exist')
      cy.getTestId('vault-secret-picker-secret-id-input').should('be.disabled')
      cy.getTestId('vault-secret-picker-secret-key-input').should('be.disabled')

      // Cannot proceed
      cy.getTestId('modal-action-button').should('be.disabled')

      // Select a non-Konnect vault (e.g. an env vault)
      cy.getTestId('select-item-env-1').click()

      // Should NOT fetch secrets
      cy.get('@getSecrets.handler').should('not.be.called')

      // Can input secret ID and key
      cy.getTestId('vault-secret-picker-secret-id-select').should('not.exist')
      cy.getTestId('vault-secret-picker-secret-id-input').should('be.enabled')
      cy.getTestId('vault-secret-picker-secret-key-input').should('be.enabled')

      // But still cannot proceed
      cy.getTestId('modal-action-button').should('be.disabled')

      // Type in a secret ID
      cy.getTestId('vault-secret-picker-secret-id-input').type('public_key')

      // Can proceed
      cy.getTestId('modal-action-button')
        .should('be.enabled')
        .click()

      // Check emitted event
      cy.get('@onProceed').should('be.calledWith', '{vault://env-1/public_key}')
    })

    it('should only allow to proceed when vault and secret is provided', () => {
      interceptKonnect()

      cy.mount(VaultSecretPicker, {
        props: {
          config: baseConfigKonnect,
          setup: '',
          onProceed: cy.stub().as('onProceed'),
        },
      })

      cy.wait('@getVaults')
      cy.getTestId('vault-secret-picker-modal')
        .find('.modal-container').should('be.visible')

      cy.getTestId('vault-secret-picker-vault-select').click()
      cy.getTestId('vault-secret-picker-vault-popover')
        .should('be.visible')
        .find('.select-items-container .select-item')
        .should('have.length', vaultsResponse.total)

      // Cannot proceed
      cy.getTestId('modal-action-button').should('be.disabled')

      // Select Konnect vault
      cy.getTestId('select-item-kv-1').click()

      // Should fetch secrets
      cy.wait('@getSecrets')

      // Can input secret key
      cy.getTestId('vault-secret-picker-secret-key-input')
        .should('be.enabled')
        .type('refresh_token')

      // Cannot proceed
      cy.getTestId('modal-action-button').should('be.disabled')

      cy.getTestId('vault-secret-picker-secret-id-select').click()
      cy.getTestId('vault-secret-picker-secret-id-popover')
        .should('be.visible')
        .find('.select-items-container .select-item')
        .should('have.length', secretsResponse.total)

      // Cannot proceed
      cy.getTestId('modal-action-button').should('be.disabled')

      // Select a secret
      cy.getTestId('select-item-tokens').click()

      // Can proceed
      cy.getTestId('modal-action-button')
        .should('be.enabled')
        .click()

      // Check emitted event
      cy.get('@onProceed').should('be.calledWith', '{vault://kv-1/tokens/refresh_token}')
    })
  })
})
