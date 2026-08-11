import { konnectCardConfig, vault } from '../../fixtures/mockData'
import VaultConfigCard from './VaultConfigCard.vue'
import { EntityBaseConfigCard } from '@kong-ui-public/entities-shared'

describe('<VaultConfigCard/>', () => {
  describe('Konnect', () => {
    const interceptGetVault = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectCardConfig.apiBaseUrl}/v2/control-planes/${konnectCardConfig.controlPlaneId}/core-entities/vaults/*`,
        },
        {
          statusCode: status,
          body: vault,
        },
      ).as('getVault')
    }

    it('emits loading event when EntityBaseConfigCard emits loading event', () => {
      interceptGetVault()

      cy.mount(VaultConfigCard, {
        props: {
          config: konnectCardConfig,
          onLoading: cy.spy().as('onLoadingSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getVault')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseConfigCard)
        .vm.$emit('loading', true))

      cy.get('@onLoadingSpy').should('have.been.calledWith', true)
    })

    it('emits fetch:error event when EntityBaseConfigCard emits fetch:error event', () => {
      interceptGetVault()

      cy.mount(VaultConfigCard, {
        props: {
          config: konnectCardConfig,
          'onFetch:error': cy.spy().as('onError'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getVault')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseConfigCard)
        .vm.$emit('fetch:error', { message: 'text' }))

      cy.get('@onError').should('have.been.calledWith', { message: 'text' })
    })

    it('emits fetch:success event when EntityBaseConfigCard emits fetch:success event', () => {
      interceptGetVault()

      cy.mount(VaultConfigCard, {
        props: {
          config: konnectCardConfig,
          'onFetch:success': cy.spy().as('onSuccess'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getVault')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseConfigCard)
        .vm.$emit('fetch:success', { message: 'text' }))

      cy.get('@onSuccess').should('have.been.calledWith', { message: 'text' })
    })

    it('masks sensitive config keys in structured view', () => {
      interceptGetVault()

      cy.mount(VaultConfigCard, {
        props: {
          config: konnectCardConfig,
        },
      })

      cy.wait('@getVault')

      // Sensitive keys should be masked
      cy.getTestId('api_key-plain-text').should('contain.text', '************')
    })
  })

  describe('Kong AI Gateway', () => {
    const aiGatewayId = 'ai-gw-1234'
    const aiGatewayCardConfig = {
      ...konnectCardConfig,
      apiType: 'aiGateway' as const,
      aiGatewayId,
    }
    // AI Gateway hcv vault with renamed fields; reverse-mapped to gateway names for display.
    const aiHcvVault = {
      id: '1234',
      type: 'hcv',
      name: 'hcv-1',
      description: 'HashiCorp Vault',
      config: {
        protocol: 'https',
        host: '127.0.0.1',
        port: 8200,
        mount: 'secret',
        kv: 'v1',
        auth_method: 'token',
        token: 'super-secret',
      },
    }

    it('renders labels as key:value badges', () => {
      const vaultWithLabels = {
        ...aiHcvVault,
        labels: { env: 'prod', team: 'platform' },
      }

      cy.intercept(
        {
          method: 'GET',
          url: `${aiGatewayCardConfig.apiBaseUrl}/v1/ai-gateways/${aiGatewayId}/vaults/*`,
        },
        { statusCode: 200, body: vaultWithLabels },
      ).as('getAiVaultWithLabels')

      cy.mount(VaultConfigCard, {
        props: { config: aiGatewayCardConfig },
      })

      cy.wait('@getAiVaultWithLabels')

      cy.getTestId('labels-badge-tag-0').should('contain.text', 'env: prod')
      cy.getTestId('labels-badge-tag-1').should('contain.text', 'team: platform')
    })

    it('fetches from the AI Gateway URL, shows mapped fields, and masks secrets', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${aiGatewayCardConfig.apiBaseUrl}/v1/ai-gateways/${aiGatewayId}/vaults/*`,
        },
        { statusCode: 200, body: aiHcvVault },
      ).as('getAiVault')

      cy.mount(VaultConfigCard, {
        props: { config: aiGatewayCardConfig },
      })

      cy.wait('@getAiVault')

      // identifier (API `name`) rendered as the prefix
      cy.get('.kong-ui-vault-entity-config-card').should('contain.text', 'hcv-1')
      // token is a sensitive key and should be masked
      cy.getTestId('token-plain-text').should('contain.text', '************')
    })
  })
})
