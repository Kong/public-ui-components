import { UpstreamResponse } from '../types'
import { konnectCardConfig, upstreamsResponseFull } from '../../fixtures/mockData'
import UpstreamsConfigCard from './UpstreamsConfigCard.vue'
import { EntityBaseConfigCard } from '@kong-ui-public/entities-shared'

describe('<UpstreamsConfigCard/>', () => {
  describe('Konnect', () => {
    const interceptGetUpstream = (status = 200, data?: UpstreamResponse): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectCardConfig.apiBaseUrl}/api/runtime_groups/${konnectCardConfig.controlPlaneId}/upstreams/*`,
        },
        {
          statusCode: status,
          body: data || upstreamsResponseFull,
        },
      ).as('getUpstream')
    }

    it('emits loading event when EntityBaseConfigCard emits loading event', () => {
      interceptGetUpstream()

      cy.mount(UpstreamsConfigCard, {
        props: {
          config: konnectCardConfig,
          onLoading: cy.spy().as('onLoadingSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getUpstream')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseConfigCard)
        .vm.$emit('loading', true))

      cy.get('@onLoadingSpy').should('have.been.calledWith', true)
    })

    it('emits fetch:error event when EntityBaseConfigCard emits fetch:error event', () => {
      interceptGetUpstream()

      cy.mount(UpstreamsConfigCard, {
        props: {
          config: konnectCardConfig,
          'onFetch:error': cy.spy().as('onError'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getUpstream')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseConfigCard)
        .vm.$emit('fetch:error', { message: 'text' }))

      cy.get('@onError').should('have.been.calledWith', { message: 'text' })
    })

    it('emits fetch:success event when EntityBaseConfigCard emits fetch:success event', () => {
      interceptGetUpstream()

      cy.mount(UpstreamsConfigCard, {
        props: {
          config: konnectCardConfig,
          'onFetch:success': cy.spy().as('onSuccess'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getUpstream')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseConfigCard)
        .vm.$emit('fetch:success', { message: 'text' }))

      cy.get('@onSuccess').should('have.been.calledWith', { message: 'text' })
    })

    it('emits copy:success event when EntityBaseConfigCard emits copy:success event', () => {
      interceptGetUpstream()

      cy.mount(UpstreamsConfigCard, {
        props: {
          config: konnectCardConfig,
          'onCopy:success': cy.spy().as('onCopy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getUpstream')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseConfigCard)
        .vm.$emit('copy:success', { message: 'text' }))

      cy.get('@onCopy').should('have.been.calledWith', { message: 'text' })
    })
  })
})
