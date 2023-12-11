import UpstreamsFormActiveHealthCheck from './UpstreamsFormActiveHealthCheck.vue'
import { KMConfig, konnectConfig } from '../../fixtures/mockData'
import { ActiveHealthyHttpStatuses, ActiveUnhealthyHttpStatuses } from '../constants'

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
    cy.getTestId('active-healthcheck-interval').should('be.visible')
    cy.getTestId('active-healthcheck-successes').should('be.visible')
    cy.get('.active-healthcheck-http-statuses').should('be.visible')
    cy.getTestId('active-healthcheck-unhealthy-interval').should('be.visible')
    cy.getTestId('active-healthcheck-http-failures').should('be.visible')
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
    cy.get('.active-healthcheck-type-select .k-select-list .k-select-item').should('have.length', 5)
    cy.get('.active-healthcheck-type-select .k-select-list [data-testid="k-select-item-tcp"]').click()

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

  it('Should bind interval data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'https',
        headers: [{ key: '', values: '' }],
        'onUpdate:interval': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-interval').type('4', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '4')
  })

  it('Should bind successes data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'https',
        headers: [{ key: '', values: '' }],
        'onUpdate:successes': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-successes').type('4', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '4')
  })

  it('Should bind httpStatuses data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'https',
        headers: [{ key: '', values: '' }],
        'onUpdate:http-statuses': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.active-healthcheck-http-statuses').click({ waitForAnimations: false })

    cy.get('.active-healthcheck-http-statuses .k-multiselect-list .k-multiselect-item').should('have.length', 92)
    cy.get('.active-healthcheck-http-statuses .k-multiselect-list [data-testid="k-multiselect-item-200"]').click({ waitForAnimations: false })
    cy.get('.active-healthcheck-http-statuses .k-multiselect-list [data-testid="k-multiselect-item-201"]').click({ waitForAnimations: false })

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

  it('Should bind httpFailures data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'http',
        headers: [{ key: '', values: '' }],
        'onUpdate:http-failures': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-http-failures').type('4', { waitForAnimations: false })

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

    cy.get('.active-healthcheck-unhealthy-http-statuses .k-multiselect-list .k-multiselect-item').should('have.length', 92)
    cy.get('.active-healthcheck-unhealthy-http-statuses .k-multiselect-list [data-testid="k-multiselect-item-404"]').click({ waitForAnimations: false })
    cy.get('.active-healthcheck-unhealthy-http-statuses .k-multiselect-list [data-testid="k-multiselect-item-500"]').click({ waitForAnimations: false })

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

  it('httpPath, httpStatuses and unhealthyHttpStatuses should be hidden and  if type === "tcp"', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'tcp',
        headers: [{ key: '', values: '' }],
      },
    })

    cy.getTestId('active-healthcheck-http-path').should('not.exist')
    cy.getTestId('active-healthcheck-http-statuses').should('not.exist')
    cy.getTestId('active-healthcheck-unhealthy-http-statuses').should('not.exist')
  })

  it('Should bind tcpFailures data correctly', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'tcp',
        headers: [{ key: '', values: '' }],
        'onUpdate:tcp-failures': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-healthcheck-tcp-failures').should('be.visible')
    cy.getTestId('active-healthcheck-tcp-failures').type('4', { waitForAnimations: false })

    cy.get('@onUpdateSpy').should('have.been.calledWith', '4')
  })

  // TODO: remove when api will support `headers` property
  it('headers-row should be hidden for "konnect" config', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'http',
        headers: [{ key: '', values: '' }],
        config: konnectConfig,
      },
    })

    cy.get('.headers-row').should('not.exist')
  })

  it('Should bind headers data correctly for "kongManager" config', () => {
    cy.mount(UpstreamsFormActiveHealthCheck, {
      props: {
        type: 'http',
        headers: [{ key: '', values: '' }],
        config: KMConfig,
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
        'onUpdate:tcp-failures': cy.spy().as('onUpdateTcpFailuresSpy'),
        'onUpdate:https-sni': cy.spy().as('onUpdateHttpsSniSpy'),
        'onUpdate:verify-ssl': cy.spy().as('onUpdateVerifySslSpy'),
        'onUpdate:http-path': cy.spy().as('onUpdateHttpPathSpy'),
        'onUpdate:http-statuses': cy.spy().as('onUpdateHttpStatusesSpy'),
        'onUpdate:unhealthy-http-statuses': cy.spy().as('onUpdateUnhealthyHttpStatusesSpy'),
      },
    }).then(({ wrapper }) => wrapper)
      .as('vueWrapper')

    cy.get('@vueWrapper').then(async (wrapper: any) => {
      await wrapper.setProps({ type: 'https' })
      cy.get('@onUpdateTcpFailuresSpy').should('have.been.calledWith', '5')

      await wrapper.setProps({ type: 'tcp' })
      cy.get('@onUpdateHttpsSniSpy').should('have.been.calledWith', '')
      cy.get('@onUpdateVerifySslSpy').should('have.been.calledWith', false)
      cy.get('@onUpdateHttpPathSpy').should('have.been.calledWith', '/')
      cy.get('@onUpdateHttpStatusesSpy').should('have.been.calledWith', ActiveHealthyHttpStatuses)
      cy.get('@onUpdateUnhealthyHttpStatusesSpy').should('have.been.calledWith', ActiveUnhealthyHttpStatuses)

      await wrapper.setProps({ type: 'grpcs' })
      await wrapper.setProps({ type: 'http' })
      cy.get('@onUpdateHttpsSniSpy').should('have.been.calledWith', '')
      cy.get('@onUpdateVerifySslSpy').should('have.been.calledWith', false)
    })
  })
})
