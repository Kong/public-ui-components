import { konnectCardConfig, vault } from '../../fixtures/mockData'
import VaultConfigCard from './VaultConfigCard.vue'
import { EntityBaseConfigCard } from '@kong-ui-public/entities-shared'

describe('<VaultConfigCard/>', () => {
  describe('Konnect', () => {
    const interceptGetVault = (status = 200, mockData = vault): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectCardConfig.apiBaseUrl}/v2/control-planes/${konnectCardConfig.controlPlaneId}/core-entities/vaults/*`,
        },
        {
          statusCode: status,
          body: mockData,
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

    it('masks encrypted HCV CSP fields in structured view', () => {
      interceptGetVault(200, {
        id: '1',
        name: 'hcv',
        prefix: 'hcv-1',
        description: 'HashiCorp Vault',
        config: {
          auth_method: 'aws_iam',
          aws_auth_role: 'aws-role',
          aws_access_key_id: 'access-key-id',
          aws_secret_access_key: 'secret-access-key',
          aws_assume_role_arn: 'arn:aws:iam::123456789012:role/demo',
          aws_auth_region: 'ap-northeast-1',
        },
      })

      cy.mount(VaultConfigCard, {
        props: {
          config: konnectCardConfig,
        },
      })

      cy.wait('@getVault')

      cy.getTestId('aws_auth_role-plain-text').should('contain.text', '************')
      cy.getTestId('aws_access_key_id-plain-text').should('contain.text', '************')
      cy.getTestId('aws_secret_access_key-plain-text').should('contain.text', '************')
      cy.getTestId('aws_assume_role_arn-plain-text').should('contain.text', '************')
      cy.getTestId('aws_auth_region-plain-text').should('contain.text', 'ap-northeast-1')
    })
  })
})
