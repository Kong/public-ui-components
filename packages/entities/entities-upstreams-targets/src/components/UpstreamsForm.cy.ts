import UpstreamsForm from './UpstreamsForm.vue'
import {
  certificates5, KMConfig,
  konnectConfig,
  services5, upstreamsKMResponseDisableActive, upstreamsKMResponseFull, upstreamsKMResponsePassiveDisabled,
  upstreamsResponse, upstreamsResponseFull,
} from '../../fixtures/mockData'
import { EntityBaseForm } from '@kong-ui-public/entities-shared'
import type { AxiosError } from 'axios'
import type { UpstreamResponse } from '../types'

describe('<UpstreamsForm/>', { viewportHeight: 700, viewportWidth: 700 }, () => {
  describe('Konnect', () => {
    const interceptFetchServices = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/services*`,
        },
        {
          statusCode: status,
          body: { data: services5 },
        },
      ).as('fetchServices')
    }
    const interceptFetchCertificates = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/certificates*`,
        },
        {
          statusCode: status,
          body: { data: certificates5 },
        },
      ).as('fetchCertificates')
    }
    const interceptCreate = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/upstreams`,
        },
        {
          statusCode: status,
          body: upstreamsResponse,
        },
      ).as('createUpstream')
    }
    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'PUT',
          url: `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/upstreams/*`,
        },
        {
          statusCode: status,
          body: upstreamsResponse,
        },
      ).as('updateUpstream')
    }
    const interceptGetUpstream = (status = 200, data?: UpstreamResponse): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/upstreams/*`,
        },
        {
          statusCode: status,
          body: data || upstreamsResponse,
        },
      ).as('getUpstream')
    }

    it('Should render correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      cy.mount(UpstreamsForm, {
        props: {
          config: konnectConfig,
        },
      })

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.get('.kong-ui-entities-upstreams-general-info').should('exist')
      cy.get('.kong-ui-entities-upstreams-load-balancing').should('exist')
      cy.get('.kong-ui-entities-upstreams-healthchecks').should('exist')
      cy.get('.kong-ui-entities-upstreams-active-healthcheck').should('not.exist')
      cy.get('.kong-ui-entities-upstreams-passive-healthcheck').should('not.exist')

      cy.getTestId('upstream-create-form-cancel').should('be.visible')
      cy.getTestId('upstream-create-form-cancel').should('be.enabled')
      cy.getTestId('upstream-create-form-submit').should('be.visible')
      cy.getTestId('upstream-create-form-submit').should('be.disabled')
    })

    it('Should show Active and Passive healthchecks when switchers are turned on', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      cy.mount(UpstreamsForm, {
        props: {
          config: konnectConfig,
        },
      })

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.getTestId('active-health-switch').check({ force: true })
      cy.get('.kong-ui-entities-upstreams-active-healthcheck').should('exist')

      cy.getTestId('passive-health-switch').click({ force: true })
      cy.get('.kong-ui-entities-upstreams-passive-healthcheck').should('exist')
    })

    it('Submit button should be enabled if name field is filled in correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      cy.mount(UpstreamsForm, {
        props: {
          config: konnectConfig,
        },
      })

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.getTestId('upstream-create-form-submit').should('be.visible')
      cy.getTestId('upstream-create-form-submit').should('be.disabled')

      cy.get('.name-select').click()
      cy.getTestId('select-item-2').first().click()

      cy.getTestId('upstream-create-form-submit').should('be.enabled')
    })

    it('loading event should be emitted when EntityBaseForm emits loading event', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      cy.mount(UpstreamsForm, {
        props: {
          config: konnectConfig,
          onLoading: cy.spy().as('onLoadingSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('loading', true))

      cy.get('@onLoadingSpy').should('have.been.calledWith', true)
    })

    it('error event should be emitted when EntityBaseForm emits fetch:error event', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const expectedError: AxiosError = {
        isAxiosError: false,
        toJSON(): object {
          return {}
        },
        message: 'error',
        name: 'error',
      }

      cy.mount(UpstreamsForm, {
        props: {
          config: konnectConfig,
          onError: cy.spy().as('onErrorSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('fetch:error', expectedError))

      cy.get('@onErrorSpy').should('have.been.calledWith', expectedError)
    })

    it('Should emit update event after Upstream was created', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptCreate()

      cy.mount(UpstreamsForm, {
        props: {
          config: konnectConfig,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.get('.name-select').click()
      cy.getTestId('select-item-2').first().click()

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createUpstream')

      cy.get('@onUpdateSpy').should('have.been.calledWith', upstreamsResponse)
    })

    it('Error should be visible when creation fails', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptCreate(400)

      cy.mount(UpstreamsForm, {
        props: {
          config: konnectConfig,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.get('.name-select').click()
      cy.getTestId('select-item-2').first().click()

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createUpstream')

      cy.get('@onUpdateSpy').should('not.have.been.called')
      cy.getTestId('form-error').should('be.visible')
    })

    it('Should hydrate form correctly for Edit form type', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream(200, upstreamsResponseFull)

      cy.mount(UpstreamsForm, {
        props: {
          config: konnectConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
        },
      })

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 10000 })

      cy.get('.certificate-select input').should('have.value', upstreamsResponseFull.client_certificate?.id)
      cy.get('.name-select input').should('have.value', upstreamsResponseFull.name)
      cy.getTestId('upstreams-form-host-header').should('have.value', upstreamsResponseFull.host_header)
      cy.getTestId('upstreams-form-tags').should('have.value', upstreamsResponseFull.tags?.join(', '))
      cy.get('.algorithm-select input').should('have.value', 'Least Connections')
      cy.getTestId('upstreams-form-slots').should('have.value', upstreamsResponseFull.slots.toString())
      cy.get('.hash-on-select input').should('have.value', 'Consumer')
      cy.get('.hash-fallback-select input').should('have.value', 'Path')
      cy.getTestId('active-health-switch').should('be.checked')
      cy.getTestId('upstreams-form-healthchecks-threshold').should('have.value', '2')
      cy.get('.active-healthcheck-type-select input').should('have.value', 'HTTPS')
      cy.getTestId('active-healthcheck-http-path').should('have.value', '/abc')
      cy.getTestId('active-healthcheck-timeout').should('have.value', '4')
      cy.getTestId('active-healthcheck-concurrency').should('have.value', '13')
      cy.getTestId('active-healthcheck-headers-header-1').should('have.value', 'header1')
      cy.getTestId('active-healthcheck-headers-value-1').should('have.value', 'v1, v2')
      cy.getTestId('active-healthcheck-https-sni').should('have.value', 'test sni')
      cy.getTestId('active-healthcheck-verify-ssl').should('be.checked')
      cy.getTestId('active-healthcheck-healthy-interval').should('have.value', '10')
      cy.getTestId('active-healthcheck-healthy-successes').should('have.value', '5')
      cy.get('.active-healthcheck-healthy-http-statuses .multiselect-list button.selected').should('have.length', 2)
      cy.get('.active-healthcheck-healthy-http-statuses .multiselect-list button[value="200"]').should('have.class', 'selected')
      cy.get('.active-healthcheck-healthy-http-statuses .multiselect-list button[value="302"]').should('have.class', 'selected')
      cy.get('.active-healthcheck-unhealthy-http-statuses .multiselect-list button.selected').should('have.length', 2)
      cy.get('.active-healthcheck-unhealthy-http-statuses .multiselect-list button[value="429"]').should('have.class', 'selected')
      cy.get('.active-healthcheck-unhealthy-http-statuses .multiselect-list button[value="404"]').should('have.class', 'selected')
      cy.getTestId('active-healthcheck-unhealthy-interval').should('have.value', '5')
      cy.getTestId('active-healthcheck-unhealthy-http-failures').should('have.value', '3')
      cy.getTestId('active-healthcheck-unhealthy-tcp-failures').should('have.value', '3')
      cy.getTestId('active-healthcheck-unhealthy-timeouts').should('have.value', '0')
      cy.getTestId('passive-health-switch').should('be.checked')
      cy.get('.passive-healthcheck-type-select input').should('have.value', 'HTTP')
      cy.getTestId('passive-healthcheck-healthy-successes').should('have.value', '4')
      cy.get('.passive-healthcheck-healthy-http-statuses .multiselect-list button.selected').should('have.length', 2)
      cy.get('.passive-healthcheck-healthy-http-statuses .multiselect-list button[value="200"]').should('have.class', 'selected')
      cy.get('.passive-healthcheck-healthy-http-statuses .multiselect-list button[value="201"]').should('have.class', 'selected')
      cy.getTestId('passive-healthcheck-unhealthy-timeouts').should('have.value', '10')
      cy.getTestId('passive-healthcheck-unhealthy-http-failures').should('have.value', '2')
      cy.getTestId('passive-healthcheck-unhealthy-tcp-failures').should('have.value', '2')
      cy.get('.passive-healthcheck-unhealthy-http-statuses .multiselect-list button.selected').should('have.length', 3)
      cy.get('.passive-healthcheck-unhealthy-http-statuses .multiselect-list button[value="500"]').should('have.class', 'selected')
      cy.get('.passive-healthcheck-unhealthy-http-statuses .multiselect-list button[value="503"]').should('have.class', 'selected')
      cy.get('.passive-healthcheck-unhealthy-http-statuses .multiselect-list button[value="429"]').should('have.class', 'selected')
    })

    it('Should emit update event after Upstream was edited', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream()
      interceptUpdate()

      cy.mount(UpstreamsForm, {
        props: {
          config: konnectConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 10000 })

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateUpstream')

      cy.get('@onUpdateSpy').should('have.been.calledWith', upstreamsResponse)
    })

    it('Should set correct values for health checks when turned on', () => {
      interceptCreate()

      cy.mount(UpstreamsForm, {
        props: {
          config: konnectConfig,
        },
      })

      cy.getTestId('upstreams-form-name').type('host')
      cy.get('.name-select .select-items-container .select-add-item').should('have.length', 1)
      cy.get('.name-select .select-items-container .select-add-item').click()

      cy.getTestId('active-health-switch').check({ force: true })
      cy.getTestId('passive-health-switch').check({ force: true })

      cy.getTestId('active-healthcheck-healthy-interval').should('have.value', '5')
      cy.getTestId('active-healthcheck-healthy-successes').should('have.value', '5')
      cy.getTestId('active-healthcheck-unhealthy-http-failures').should('have.value', '5')
      cy.getTestId('active-healthcheck-unhealthy-interval').should('have.value', '5')
      cy.getTestId('active-healthcheck-unhealthy-tcp-failures').should('have.value', '5')

      cy.getTestId('passive-healthcheck-unhealthy-timeouts').should('have.value', '5')
      cy.getTestId('passive-healthcheck-healthy-successes').should('have.value', '80')
      cy.getTestId('passive-healthcheck-unhealthy-tcp-failures').should('have.value', '5')
      cy.getTestId('passive-healthcheck-unhealthy-http-failures').should('have.value', '5')

      cy.getTestId('upstream-create-form-submit').click()

      cy.wait('@createUpstream').then((interception) => {
        const { body: { healthchecks: { active, passive } } } = interception.request
        expect(active.healthy.interval).to.equal(5)
        expect(active.healthy.successes).to.equal(5)
        expect(active.unhealthy.http_failures).to.equal(5)
        expect(active.unhealthy.interval).to.equal(5)
        expect(active.unhealthy.tcp_failures).to.equal(5)

        expect(passive.unhealthy.timeouts).to.equal(5)
        expect(passive.healthy.successes).to.equal(80)
        expect(passive.unhealthy.tcp_failures).to.equal(5)
        expect(passive.unhealthy.http_failures).to.equal(5)
      })
    })

    it('Should set correct values for health checks when turned off', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream(200, upstreamsResponseFull)
      interceptUpdate()

      cy.mount(UpstreamsForm, {
        props: {
          config: konnectConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
        },
      })

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 10000 })

      cy.getTestId('active-health-switch').should('be.checked')
      cy.getTestId('passive-health-switch').should('be.checked')

      cy.getTestId('active-health-switch').uncheck({ force: true })
      cy.getTestId('passive-health-switch').uncheck({ force: true })

      cy.getTestId('upstream-edit-form-submit').click()

      cy.wait('@updateUpstream').then((interception) => {
        const { body: { healthchecks } } = interception.request
        expect(healthchecks).to.deep.equal({ threshold: 2 })
      })
    })

    it('Should set correct values for health checks when turned off, then turned on the active health checks again', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream(200, upstreamsResponseFull)
      interceptUpdate()

      cy.mount(UpstreamsForm, {
        props: {
          config: konnectConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
        },
      })

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 10000 })

      cy.getTestId('active-health-switch').should('be.checked')
      cy.getTestId('passive-health-switch').should('be.checked')

      cy.getTestId('active-health-switch').uncheck({ force: true })
      cy.getTestId('passive-health-switch').uncheck({ force: true })

      cy.getTestId('active-health-switch').check({ force: true })

      cy.getTestId('upstream-edit-form-submit').click()

      cy.wait('@updateUpstream').then((interception) => {
        const { body: { healthchecks } } = interception.request
        expect(healthchecks).to.deep.equal(JSON.parse('{"threshold":2,"active":{"type":"http","healthy":{"interval":5,"successes":5,"http_statuses":[200,302]},"unhealthy":{"interval":5,"timeouts":5,"tcp_failures":5,"http_failures":5,"http_statuses":[429,404,500,501,502,503,504,505]},"timeout":1,"concurrency":10,"http_path":"/","headers":{"header1":["v1","v2"]}}}'))
      })
    })
  })

  describe('Kong Manager', () => {
    const interceptFetchServices = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/services*`,
        },
        {
          statusCode: status,
          body: { data: services5 },
        },
      ).as('fetchServices')
    }
    const interceptFetchCertificates = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/certificates*`,
        },
        {
          statusCode: status,
          body: { data: certificates5 },
        },
      ).as('fetchCertificates')
    }
    const interceptCreate = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/upstreams`,
        },
        {
          statusCode: status,
          body: upstreamsResponse,
        },
      ).as('createUpstream')
    }
    const interceptUpdate = (status = 200, payload = upstreamsResponse): void => {
      cy.intercept(
        {
          method: 'PATCH',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/upstreams/*`,
        },
        {
          statusCode: status,
          body: payload,
        },
      ).as('updateUpstream')
    }
    const interceptGetUpstream = (status = 200, data?: UpstreamResponse): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/upstreams/*`,
        },
        {
          statusCode: status,
          body: data || upstreamsResponse,
        },
      ).as('getUpstream')
    }

    it('Should render correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
        },
      })

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.get('.kong-ui-entities-upstreams-general-info').should('exist')
      cy.get('.kong-ui-entities-upstreams-load-balancing').should('exist')
      cy.get('.kong-ui-entities-upstreams-healthchecks').should('exist')
      cy.get('.kong-ui-entities-upstreams-active-healthcheck').should('not.exist')
      cy.get('.kong-ui-entities-upstreams-passive-healthcheck').should('not.exist')

      cy.getTestId('upstream-create-form-cancel').should('be.visible')
      cy.getTestId('upstream-create-form-cancel').should('be.enabled')
      cy.getTestId('upstream-create-form-submit').should('be.visible')
      cy.getTestId('upstream-create-form-submit').should('be.disabled')
    })

    it('Should show Active and Passive healthchecks when switchers are turned on', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
        },
      })

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.getTestId('active-health-switch').check({ force: true })
      cy.get('.kong-ui-entities-upstreams-active-healthcheck').should('exist')
      cy.get('.headers-row').should('exist')
      cy.getTestId('active-healthcheck-headers-header-1').should('exist')
      cy.getTestId('active-healthcheck-headers-value-1').should('exist')

      cy.getTestId('passive-health-switch').check({ force: true })
      cy.get('.kong-ui-entities-upstreams-passive-healthcheck').should('exist')
    })

    it('Submit button should be enabled if name field is filled in correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
        },
      })

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.getTestId('upstream-create-form-submit').should('be.visible')
      cy.getTestId('upstream-create-form-submit').should('be.disabled')

      cy.get('.name-select').click()
      cy.getTestId('select-item-2').first().click()

      cy.getTestId('upstream-create-form-submit').should('be.enabled')
    })

    it('loading event should be emitted when EntityBaseForm emits loading event', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
          onLoading: cy.spy().as('onLoadingSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('loading', true))

      cy.get('@onLoadingSpy').should('have.been.calledWith', true)
    })

    it('error event should be emitted when EntityBaseForm emits fetch:error event', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const expectedError: AxiosError = {
        isAxiosError: false,
        toJSON(): object {
          return {}
        },
        message: 'error',
        name: 'error',
      }

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
          onError: cy.spy().as('onErrorSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('fetch:error', expectedError))

      cy.get('@onErrorSpy').should('have.been.calledWith', expectedError)
    })

    it('Should emit update event after Upstream was created', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptCreate()

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.get('.name-select').click()
      cy.getTestId('select-item-2').first().click()

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createUpstream')

      cy.get('@onUpdateSpy').should('have.been.calledWith', upstreamsResponse)
    })

    it('Error should be visible when creation fails', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptCreate(400)

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@fetchServices', '@fetchCertificates'])

      cy.get('.name-select').click()
      cy.getTestId('select-item-2').first().click()

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createUpstream')

      cy.get('@onUpdateSpy').should('not.have.been.called')
      cy.getTestId('form-error').should('be.visible')
    })

    it('Should hydrate form correctly for Edit form type', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream(200, upstreamsKMResponseFull)

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
        },
      })

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 10000 })

      cy.get('.certificate-select input').should('have.value', upstreamsResponseFull.client_certificate?.id)
      cy.get('.name-select input').should('have.value', upstreamsResponseFull.name)
      cy.getTestId('upstreams-form-host-header').should('have.value', upstreamsResponseFull.host_header)
      cy.getTestId('upstreams-form-tags').should('have.value', upstreamsResponseFull.tags?.join(', '))
      cy.get('.algorithm-select input').should('have.value', 'Least Connections')
      cy.getTestId('upstreams-form-slots').should('have.value', upstreamsResponseFull.slots.toString())
      cy.get('.hash-on-select input').should('have.value', 'Consumer')
      cy.get('.hash-fallback-select input').should('have.value', 'Path')
      cy.getTestId('active-health-switch').should('be.checked')
      cy.getTestId('upstreams-form-healthchecks-threshold').should('have.value', '2')
      cy.get('.active-healthcheck-type-select input').should('have.value', 'HTTPS')
      cy.getTestId('active-healthcheck-http-path').should('have.value', '/abc')
      cy.getTestId('active-healthcheck-timeout').should('have.value', '4')
      cy.getTestId('active-healthcheck-concurrency').should('have.value', '13')
      cy.getTestId('active-healthcheck-headers-header-1').should('have.value', 'header1')
      cy.getTestId('active-healthcheck-headers-value-1').should('have.value', 'v1, v2')
      cy.getTestId('active-healthcheck-https-sni').should('have.value', 'test sni')
      cy.getTestId('active-healthcheck-verify-ssl').should('be.checked')
      cy.getTestId('active-healthcheck-healthy-interval').should('have.value', '10')
      cy.getTestId('active-healthcheck-healthy-successes').should('have.value', '5')
      cy.get('.active-healthcheck-healthy-http-statuses .multiselect-list button.selected').should('have.length', 2)
      cy.get('.active-healthcheck-healthy-http-statuses .multiselect-list button[value="200"]').should('have.class', 'selected')
      cy.get('.active-healthcheck-healthy-http-statuses .multiselect-list button[value="302"]').should('have.class', 'selected')
      cy.get('.active-healthcheck-unhealthy-http-statuses .multiselect-list button.selected').should('have.length', 2)
      cy.get('.active-healthcheck-unhealthy-http-statuses .multiselect-list button[value="429"]').should('have.class', 'selected')
      cy.get('.active-healthcheck-unhealthy-http-statuses .multiselect-list button[value="404"]').should('have.class', 'selected')
      cy.getTestId('active-healthcheck-unhealthy-interval').should('have.value', '5')
      cy.getTestId('active-healthcheck-unhealthy-http-failures').should('have.value', '3')
      cy.getTestId('active-healthcheck-unhealthy-tcp-failures').should('have.value', '3')
      cy.getTestId('active-healthcheck-unhealthy-timeouts').should('have.value', '0')
      cy.getTestId('passive-health-switch').should('be.checked')
      cy.get('.passive-healthcheck-type-select input').should('have.value', 'HTTP')
      cy.getTestId('passive-healthcheck-healthy-successes').should('have.value', '4')
      cy.get('.passive-healthcheck-healthy-http-statuses .multiselect-list button.selected').should('have.length', 2)
      cy.get('.passive-healthcheck-healthy-http-statuses .multiselect-list button[value="200"]').should('have.class', 'selected')
      cy.get('.passive-healthcheck-healthy-http-statuses .multiselect-list button[value="201"]').should('have.class', 'selected')
      cy.getTestId('passive-healthcheck-unhealthy-timeouts').should('have.value', '10')
      cy.getTestId('passive-healthcheck-unhealthy-http-failures').should('have.value', '2')
      cy.getTestId('passive-healthcheck-unhealthy-tcp-failures').should('have.value', '2')
      cy.get('.passive-healthcheck-unhealthy-http-statuses .multiselect-list button.selected').should('have.length', 3)
      cy.get('.passive-healthcheck-unhealthy-http-statuses .multiselect-list button[value="500"]').should('have.class', 'selected')
      cy.get('.passive-healthcheck-unhealthy-http-statuses .multiselect-list button[value="503"]').should('have.class', 'selected')
      cy.get('.passive-healthcheck-unhealthy-http-statuses .multiselect-list button[value="429"]').should('have.class', 'selected')
    })

    it('Should emit update event after Upstream was edited', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream()
      interceptUpdate()

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 10000 })

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateUpstream')

      cy.get('@onUpdateSpy').should('have.been.calledWith', upstreamsResponse)
    })

    it('Should send active intervals eq 0 when Active health check was disabled in Edit mode', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream(200, upstreamsKMResponseFull)
      interceptUpdate(200, upstreamsKMResponseDisableActive)

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 10000 })

      cy.getTestId('active-health-switch').should('be.checked')
      cy.getTestId('active-health-switch').uncheck({ force: true })

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateUpstream')

      cy.get('@onUpdateSpy').should('have.been.calledWithExactly', upstreamsKMResponseDisableActive)
    })

    it('Should send passive values eq 0 when Passive health check was disabled in Edit mode', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream(200, upstreamsKMResponseFull)
      interceptUpdate(200, upstreamsKMResponsePassiveDisabled)

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 10000 })

      cy.getTestId('passive-health-switch').should('be.checked')
      cy.getTestId('passive-health-switch').uncheck({ force: true })

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateUpstream')

      cy.get('@onUpdateSpy').should('have.been.calledWithExactly', upstreamsKMResponsePassiveDisabled)
    })

    it('Should set correct values for health checks when turned on', () => {
      interceptCreate()

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
        },
      })

      cy.getTestId('upstreams-form-name').type('host')
      cy.get('.name-select .select-items-container .select-add-item').should('have.length', 1)
      cy.get('.name-select .select-items-container .select-add-item').click()

      cy.getTestId('active-health-switch').check({ force: true })
      cy.getTestId('passive-health-switch').check({ force: true })

      cy.getTestId('active-healthcheck-healthy-interval').should('have.value', '5')
      cy.getTestId('active-healthcheck-healthy-successes').should('have.value', '5')
      cy.getTestId('active-healthcheck-unhealthy-http-failures').should('have.value', '5')
      cy.getTestId('active-healthcheck-unhealthy-interval').should('have.value', '5')
      cy.getTestId('active-healthcheck-unhealthy-tcp-failures').should('have.value', '5')

      cy.getTestId('passive-healthcheck-unhealthy-timeouts').should('have.value', '5')
      cy.getTestId('passive-healthcheck-healthy-successes').should('have.value', '80')
      cy.getTestId('passive-healthcheck-unhealthy-tcp-failures').should('have.value', '5')
      cy.getTestId('passive-healthcheck-unhealthy-http-failures').should('have.value', '5')

      cy.getTestId('upstream-create-form-submit').click()

      cy.wait('@createUpstream').then((interception) => {
        const { body: { healthchecks: { active, passive } } } = interception.request
        expect(active.healthy.interval).to.equal(5)
        expect(active.healthy.successes).to.equal(5)
        expect(active.unhealthy.http_failures).to.equal(5)
        expect(active.unhealthy.interval).to.equal(5)
        expect(active.unhealthy.tcp_failures).to.equal(5)

        expect(passive.unhealthy.timeouts).to.equal(5)
        expect(passive.healthy.successes).to.equal(80)
        expect(passive.unhealthy.tcp_failures).to.equal(5)
        expect(passive.unhealthy.http_failures).to.equal(5)
      })
    })

    it('Should set correct values for health checks when turned off', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream(200, upstreamsKMResponseFull)
      interceptUpdate()

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
        },
      })

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 10000 })

      cy.getTestId('active-health-switch').should('be.checked')
      cy.getTestId('passive-health-switch').should('be.checked')

      cy.getTestId('active-health-switch').uncheck({ force: true })
      cy.getTestId('passive-health-switch').uncheck({ force: true })

      cy.getTestId('upstream-edit-form-submit').click()

      cy.wait('@updateUpstream').then((interception) => {
        const { body: { healthchecks } } = interception.request
        expect(healthchecks).to.deep.equal(JSON.parse('{"threshold":2,"active":{"type":"http","headers":{},"healthy":{"interval":0,"successes":0},"unhealthy":{"interval":0,"http_failures":0,"tcp_failures":0,"timeouts":0}},"passive":{"type":"http","healthy":{"successes":0},"unhealthy":{"timeouts":0,"tcp_failures":0,"http_failures":0}}}'))
      })
    })

    it('Should set correct values for health checks when turned off, then turned on the active health checks again', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream(200, upstreamsResponseFull)
      interceptUpdate()

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
        },
      })

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 10000 })

      cy.getTestId('active-health-switch').should('be.checked')
      cy.getTestId('passive-health-switch').should('be.checked')

      cy.getTestId('active-health-switch').uncheck({ force: true })
      cy.getTestId('passive-health-switch').uncheck({ force: true })

      cy.getTestId('active-health-switch').check({ force: true })

      cy.getTestId('upstream-edit-form-submit').click()

      cy.wait('@updateUpstream').then((interception) => {
        const { body: { healthchecks } } = interception.request
        expect(healthchecks).to.deep.equal(JSON.parse('{"threshold":2,"active":{"type":"http","healthy":{"interval":5,"successes":5,"http_statuses":[200,302]},"unhealthy":{"interval":5,"timeouts":5,"tcp_failures":5,"http_failures":5,"http_statuses":[429,404,500,501,502,503,504,505]},"timeout":1,"concurrency":10,"http_path":"/","headers":{"header1":["v1","v2"]}},"passive":{"type":"http","healthy":{"successes":0},"unhealthy":{"timeouts":0,"tcp_failures":0,"http_failures":0}}}'))
      })
    })
  })
})
