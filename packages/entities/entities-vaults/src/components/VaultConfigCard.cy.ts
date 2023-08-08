import { konnectCardConfig, vault } from '../../fixtures/mockData'
import VaultConfigCard from './VaultConfigCard.vue'
import { EntityBaseConfigCard } from '@kong-ui/entities-shared'

describe('<UpstreamsConfigCard/>', () => {
  describe('Konnect', () => {
    const interceptGetVault = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectCardConfig.apiBaseUrl}/api/runtime_groups/${konnectCardConfig.controlPlaneId}/vaults/*`,
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

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseConfigCard)
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

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseConfigCard)
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

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseConfigCard)
        .vm.$emit('fetch:success', { message: 'text' }))

      cy.get('@onSuccess').should('have.been.calledWith', { message: 'text' })
    })

    it('emits copy:success event when EntityBaseConfigCard emits copy:success event', () => {
      interceptGetVault()

      cy.mount(VaultConfigCard, {
        props: {
          config: konnectCardConfig,
          'onCopy:success': cy.spy().as('onCopy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getVault')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseConfigCard)
        .vm.$emit('copy:success', { message: 'text' }))

      cy.get('@onCopy').should('have.been.calledWith', { message: 'text' })
    })
  })
})
