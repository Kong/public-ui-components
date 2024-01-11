import UpstreamsFormPassiveHealthCheck from './UpstreamsFormPassiveHealthCheck.vue'
import { PassiveHealthyHttpStatuses, PassiveUnhealthyHttpStatuses } from '../constants'

describe('<UpstreamsFormPassiveHealthCheck/>', { viewportHeight: 700, viewportWidth: 700 }, () => {
  it('Component should be rendered correctly', () => {
    cy.mount(UpstreamsFormPassiveHealthCheck, {
      props: {
        type: 'http',
      },
    })

    cy.get('.passive-healthcheck-type-select').should('be.visible')
    cy.getTestId('passive-healthcheck-successes').should('be.visible')
    cy.get('.passive-healthcheck-http-statuses').should('be.visible')
    cy.getTestId('passive-healthcheck-timeouts').should('be.visible')
    cy.getTestId('passive-healthcheck-http-failures').should('be.visible')
    cy.get('.passive-healthcheck-unhealthy-http-statuses').should('be.visible')
  })

  it('Should bind type data correctly', () => {
    cy.mount(UpstreamsFormPassiveHealthCheck, {
      props: {
        type: 'http',
        'onUpdate:type': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.passive-healthcheck-type-select').click({ waitForAnimations: false })
    cy.get('.passive-healthcheck-type-select .select-list .select-item').should('have.length', 5)
    cy.get('.passive-healthcheck-type-select .select-list [data-testid="select-item-tcp"]').click()

    cy.get('@onUpdateSpy').should('have.been.calledWith', 'tcp')
  })

  it('Should bind successes data correctly', () => {
    cy.mount(UpstreamsFormPassiveHealthCheck, {
      props: {
        type: 'http',
        'onUpdate:successes': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('passive-healthcheck-successes').type('10', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '10')
  })

  it('Should bind httpStatuses data correctly', () => {
    cy.mount(UpstreamsFormPassiveHealthCheck, {
      props: {
        type: 'http',
        'onUpdate:http-statuses': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.passive-healthcheck-http-statuses').click({ waitForAnimations: false })

    cy.get('.passive-healthcheck-http-statuses .multiselect-list .multiselect-item').should('have.length', 92)
    cy.get('.passive-healthcheck-http-statuses .multiselect-list [data-testid="multiselect-item-200"]').click({ waitForAnimations: false })
    cy.get('.passive-healthcheck-http-statuses .multiselect-list [data-testid="multiselect-item-201"]').click({ waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', ['200', '201'])
  })

  it('Should bind timeouts data correctly', () => {
    cy.mount(UpstreamsFormPassiveHealthCheck, {
      props: {
        type: 'http',
        'onUpdate:timeouts': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('passive-healthcheck-timeouts').type('4', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '4')
  })

  it('Should bind httpFailures data correctly', () => {
    cy.mount(UpstreamsFormPassiveHealthCheck, {
      props: {
        type: 'http',
        'onUpdate:http-failures': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('passive-healthcheck-http-failures').type('5', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '5')
  })

  it('Should bind unhealthyHttpStatuses data correctly', () => {
    cy.mount(UpstreamsFormPassiveHealthCheck, {
      props: {
        type: 'http',
        'onUpdate:unhealthy-http-statuses': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.passive-healthcheck-unhealthy-http-statuses').click({ waitForAnimations: false })

    cy.get('.passive-healthcheck-unhealthy-http-statuses .multiselect-list .multiselect-item').should('have.length', 92)
    cy.get('.passive-healthcheck-unhealthy-http-statuses .multiselect-list [data-testid="multiselect-item-404"]').click({ waitForAnimations: false })
    cy.get('.passive-healthcheck-unhealthy-http-statuses .multiselect-list [data-testid="multiselect-item-500"]').click({ waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', ['404', '500'])
  })

  it('httpStatuses, httpFailures and unhealthyHttpStatuses fields should be hidden if type === "tcp"', () => {
    cy.mount(UpstreamsFormPassiveHealthCheck, {
      props: {
        type: 'tcp',
      },
    })

    cy.get('.passive-healthcheck-http-statuses').should('not.exist')
    cy.getTestId('passive-healthcheck-http-failures').should('not.exist')
    cy.get('.passive-healthcheck-unhealthy-http-statuses').should('not.exist')
  })

  it('Should bind tcpFailures data correctly if type === "tcp"', () => {
    cy.mount(UpstreamsFormPassiveHealthCheck, {
      props: {
        type: 'tcp',
        'onUpdate:tcp-failures': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('passive-healthcheck-tcp-failures').should('be.visible')
    cy.getTestId('passive-healthcheck-tcp-failures').type('10', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '10')
  })

  it('Should clear data on type updates', () => {
    cy.mount(UpstreamsFormPassiveHealthCheck, {
      props: {
        type: 'tcp',
        'onUpdate:tcp-failures': cy.spy().as('onUpdateTcpFailuresSpy'),
        'onUpdate:http-statuses': cy.spy().as('onUpdateHttpStatusesSpy'),
        'onUpdate:unhealthy-http-statuses': cy.spy().as('onUpdateUnhealthyHttpStatusesSpy'),
      },
    }).then(({ wrapper }) => wrapper)
      .as('vueWrapper')

    cy.get('@vueWrapper').then(async (wrapper: any) => {
      await wrapper.setProps({ type: 'https' })
      cy.get('@onUpdateTcpFailuresSpy').should('have.been.calledWith', '5')

      await wrapper.setProps({ type: 'tcp' })
      cy.get('@onUpdateHttpStatusesSpy').should('have.been.calledWith', PassiveHealthyHttpStatuses)
      cy.get('@onUpdateUnhealthyHttpStatusesSpy').should('have.been.calledWith', PassiveUnhealthyHttpStatuses)
    })
  })
})
