import UpstreamsFormActiveHealthCheck from './UpstreamsFormActiveHealthCheck.vue'
import { ActiveHealthyHttpStatuses, ActiveUnhealthyHttpStatuses } from '../constants'

const PORTOCOLS = ['http', 'https', 'tcp', 'grpc', 'grpcs']

describe('<UpstreamsFormActiveHealthCheck/>', { viewportHeight: 700, viewportWidth: 700 }, () => {
  it('Component should be rendered correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'http',
        headers: [{ key: '', values: '' }],
      },
    })

    cy.get('.active-healthcheck-type-select').should('be.visible')
    cy.getTestId('active-healthcheck-http-path').should('be.visible')
    cy.getTestId('active-healthcheck-timeout').should('be.visible')
    cy.getTestId('active-healthcheck-concurrency').should('be.visible')
    cy.getTestId('active-healthcheck-healthy-interval').should('be.visible')
    cy.getTestId('active-healthcheck-healthy-successes').should('be.visible')
    cy.getTestId('active-healthcheck-healthy-http-statuses').should('be.visible')
    cy.getTestId('active-healthcheck-unhealthy-interval').should('be.visible')
    cy.getTestId('active-healthcheck-unhealthy-http-failures').should('be.visible')
    cy.getTestId('active-healthcheck-unhealthy-timeouts').should('be.visible')
    cy.get('.active-healthcheck-unhealthy-http-statuses').should('be.visible')
  })

  it('Should bind type data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'http',
        headers: [{ key: '', values: '' }],
        'onUpdate:type': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.active-healthcheck-type-select').click({ waitForAnimations: false })
    cy.get('.active-healthcheck-type-select .select-items-container .select-item').should('have.length', 5)
    cy.get('.active-healthcheck-type-select .select-items-container [data-testid="select-item-tcp"]').click()

    cy.get('@onUpdateSpy').should('have.been.calledWith', 'tcp')
  })

  it('Should bind httpPath data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'http',
        headers: [{ key: '', values: '' }],
        'onUpdate:http-path': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-http-path').type('http-path', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', 'http-path')
  })

  it('Should bind timeout data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'http',
        headers: [{ key: '', values: '' }],
        'onUpdate:timeout': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-timeout').type('3', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '3')
  })

  it('Should bind concurrency data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'http',
        headers: [{ key: '', values: '' }],
        'onUpdate:concurrency': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-concurrency').type('3', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '3')
  })

  it('Should bind httpsSni data correctly if type === "https"', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'https',
        headers: [{ key: '', values: '' }],
        'onUpdate:https-sni': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-https-sni').should('be.visible')
    cy.getTestId('active-healthcheck-https-sni').type('https-sni', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', 'https-sni')
  })

  it('Should bind verifySsl data correctly if type === "https"', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'https',
        headers: [{ key: '', values: '' }],
        'onUpdate:verify-ssl': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-verify-ssl').should('be.visible')
    cy.getTestId('active-healthcheck-verify-ssl').check()

    cy.get('@onUpdateSpy').should('have.been.calledWith', true)
  })

  it('Should bind httpsSni data correctly if type === "grpcs"', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'grpcs',
        headers: [{ key: '', values: '' }],
        'onUpdate:https-sni': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-https-sni').should('be.visible')
    cy.getTestId('active-healthcheck-https-sni').type('https-sni', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', 'https-sni')
  })

  it('Should bind verifySsl data correctly if type === "grpcs"', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'grpcs',
        headers: [{ key: '', values: '' }],
        'onUpdate:verify-ssl': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-verify-ssl').should('be.visible')
    cy.getTestId('active-healthcheck-verify-ssl').check()

    cy.get('@onUpdateSpy').should('have.been.calledWith', true)
  })

  it('Should bind healthyInterval data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'https',
        headers: [{ key: '', values: '' }],
        'onUpdate:healthy-interval': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-healthy-interval').type('4', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '4')
  })

  it('Should bind healthySuccesses data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'https',
        headers: [{ key: '', values: '' }],
        'onUpdate:healthy-successes': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-healthy-successes').type('4', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '4')
  })

  it('Should bind healthyHttpStatuses data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'https',
        headers: [{ key: '', values: '' }],
        'onUpdate:healthy-http-statuses': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.active-healthcheck-healthy-http-statuses').click({ waitForAnimations: false })

    cy.get('.active-healthcheck-healthy-http-statuses .multiselect-list .multiselect-item').should('have.length', 92)
    cy.get('.active-healthcheck-healthy-http-statuses .multiselect-list [data-testid="multiselect-item-200"]').click({ waitForAnimations: false })
    cy.get('.active-healthcheck-healthy-http-statuses .multiselect-list [data-testid="multiselect-item-201"]').click({ waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', ['200', '201'])
  })

  it('Should bind unhealthyInterval data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'http',
        headers: [{ key: '', values: '' }],
        'onUpdate:unhealthy-interval': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-unhealthy-interval').type('4', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '4')
  })

  it('Should bind unhealthyHttpFailures data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'http',
        headers: [{ key: '', values: '' }],
        'onUpdate:unhealthy-http-failures': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-unhealthy-http-failures').type('4', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '4')
  })

  it('Should bind unhealthyHttpStatuses data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'https',
        headers: [{ key: '', values: '' }],
        'onUpdate:unhealthy-http-statuses': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.active-healthcheck-unhealthy-http-statuses').click({ waitForAnimations: false })

    cy.get('.active-healthcheck-unhealthy-http-statuses .multiselect-list .multiselect-item').should('have.length', 92)
    cy.get('.active-healthcheck-unhealthy-http-statuses .multiselect-list [data-testid="multiselect-item-404"]').click({ waitForAnimations: false })
    cy.get('.active-healthcheck-unhealthy-http-statuses .multiselect-list [data-testid="multiselect-item-500"]').click({ waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', ['404', '500'])
  })

  it('Should bind unhealthyTimeouts data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'http',
        headers: [{ key: '', values: '' }],
        'onUpdate:unhealthy-timeouts': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-unhealthy-timeouts').type('4', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '4')
  })

  it('httpPath, healthyHttpStatuses and unhealthyHttpStatuses should be hidden and if type === "tcp"', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'tcp',
        headers: [{ key: '', values: '' }],
      },
    })

    cy.getTestId('active-healthcheck-http-path').should('not.exist')
    cy.getTestId('active-healthcheck-healthy-http-statuses').should('not.exist')
    cy.getTestId('active-healthcheck-unhealthy-http-statuses').should('not.exist')
  })

  PORTOCOLS.forEach((protocol) => {
    it(`Should bind unhealthyTcpFailures data correctly if type === "${protocol}"`, () => {
      cy.mount(UpstreamsFormActiveHealthCheck, {
        props: {
          type: protocol,
          headers: [{ key: '', values: '' }],
          'onUpdate:unhealthy-tcp-failures': cy.spy().as('onUpdateSpy'),
        },
      })

      cy.getTestId('active-healthcheck-unhealthy-tcp-failures').should('be.visible')
      cy.getTestId('active-healthcheck-unhealthy-tcp-failures').type('4', { waitForAnimations: false })

      cy.get('@onUpdateSpy').should('have.been.calledWith', '4')
    })
  })

  it('Should bind headers data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'http',
        headers: [{ key: '', values: '' }],
        'onUpdate:headers': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.headers-row').should('be.visible')
    cy.getTestId('active-healthcheck-headers-header-1').type('header', { waitForAnimations: false })
    cy.getTestId('active-healthcheck-headers-value-1').type('value1, value2', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', [{ key: 'header', values: 'value1, value2' }])

    cy.getTestId('btn-add-header').click({ waitForAnimations: false })

    cy.get('.headers-row').should('have.length', 2)
  })

  it('Should clear data on type updates', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'tcp',
        headers: [{ key: '', values: '' }],
        'onUpdate:unhealthy-tcp-failures': cy.spy().as('onUpdateUnhealthyTcpFailuresSpy'),
        'onUpdate:https-sni': cy.spy().as('onUpdateHttpsSniSpy'),
        'onUpdate:verify-ssl': cy.spy().as('onUpdateVerifySslSpy'),
        'onUpdate:http-path': cy.spy().as('onUpdateHttpPathSpy'),
        'onUpdate:healthy-http-statuses': cy.spy().as('onUpdateHealthyHttpStatusesSpy'),
        'onUpdate:unhealthy-http-statuses': cy.spy().as('onUpdateUnhealthyHttpStatusesSpy'),
      },
    }).then(({ wrapper }) => wrapper)
      .as('vueWrapper')

    cy.get('@vueWrapper').then(async wrapper => {
      await wrapper.setProps({ type: 'https' })
      cy.get('@onUpdateUnhealthyTcpFailuresSpy').should('have.been.calledWith', '5')

      await wrapper.setProps({ type: 'tcp' })
      cy.get('@onUpdateHttpsSniSpy').should('have.been.calledWith', '')
      cy.get('@onUpdateVerifySslSpy').should('have.been.calledWith', false)
      cy.get('@onUpdateHttpPathSpy').should('have.been.calledWith', '/')
      cy.get('@onUpdateHealthyHttpStatusesSpy').should('have.been.calledWith', ActiveHealthyHttpStatuses)
      cy.get('@onUpdateUnhealthyHttpStatusesSpy').should('have.been.calledWith', ActiveUnhealthyHttpStatuses)

      await wrapper.setProps({ type: 'grpcs' })
      await wrapper.setProps({ type: 'http' })
      cy.get('@onUpdateHttpsSniSpy').should('have.been.calledWith', '')
      cy.get('@onUpdateVerifySslSpy').should('have.been.calledWith', false)
    })
  })
})
