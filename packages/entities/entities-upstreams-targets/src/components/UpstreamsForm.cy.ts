import UpstreamsForm from './UpstreamsForm.vue'
import {
  certificates5, KMConfig,
  konnectConfig,
  services5, upstreamsKMResponseDisableActive, upstreamsKMResponseFull, upstreamsKMResponsePassiveDisabled,
  upstreamsResponse, upstreamsResponseFull,
} from '../../fixtures/mockData'
import { EntityBaseForm } from '@kong-ui-public/entities-shared'
import { AxiosError } from 'axios'
import { UpstreamResponse } from '../types'

describe('<UpstreamsForm/>', () => {
  describe('Konnect', () => {
    const interceptFetchServices = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/services*`,
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
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/certificates*`,
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
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/upstreams`,
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
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/upstreams/*`,
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
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/upstreams/*`,
        },
        {
          statusCode: status,
          body: data || upstreamsResponse,
        },
      ).as('getUpstream')
    }
    const interceptValidate = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/v1/schemas/json/upstream/validate`,
        },
        {
          statusCode: status,
          body: {},
        },
      ).as('validateUpstream')
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

      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-submit').should('be.disabled')
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

      cy.get('.active-health-switch').click()
      cy.get('.kong-ui-entities-upstreams-active-healthcheck').should('exist')

      cy.get('.passive-health-switch').click()
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

      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-submit').should('be.disabled')

      cy.get('.name-select').click()
      cy.get('.name-select .k-select-list [data-testid="k-select-item-2"]').click()

      cy.getTestId('form-submit').should('be.enabled')
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

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
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

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('fetch:error', expectedError))

      cy.get('@onErrorSpy').should('have.been.calledWith', expectedError)
    })

    it('Should emit update event after Upstream was created', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptValidate()
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
      cy.get('.name-select .k-select-list [data-testid="k-select-item-2"]').click()

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validateUpstream')
      cy.wait('@createUpstream')

      cy.get('@onUpdateSpy').should('have.been.calledWith', upstreamsResponse)
    })

    it('Error should be visible when creation fails', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptValidate()
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
      cy.get('.name-select .k-select-list [data-testid="k-select-item-2"]').click()

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validateUpstream')
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

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 2000 })

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
      cy.getTestId('active-healthcheck-https-sni').should('have.value', 'test sni')
      cy.getTestId('active-healthcheck-verify-ssl').should('be.checked')
      cy.getTestId('active-healthcheck-interval').should('have.value', '10')
      cy.getTestId('active-healthcheck-successes').should('have.value', '5')
      cy.get('.active-healthcheck-http-statuses .k-multiselect-list button.selected').should('have.length', 2)
      cy.get('.active-healthcheck-http-statuses .k-multiselect-list button[value="200"]').should('have.class', 'selected')
      cy.get('.active-healthcheck-http-statuses .k-multiselect-list button[value="302"]').should('have.class', 'selected')
      cy.get('.active-healthcheck-unhealthy-http-statuses .k-multiselect-list button.selected').should('have.length', 2)
      cy.get('.active-healthcheck-unhealthy-http-statuses .k-multiselect-list button[value="429"]').should('have.class', 'selected')
      cy.get('.active-healthcheck-unhealthy-http-statuses .k-multiselect-list button[value="404"]').should('have.class', 'selected')
      cy.getTestId('active-healthcheck-unhealthy-interval').should('have.value', '5')
      cy.getTestId('active-healthcheck-http-failures').should('have.value', '5')
      cy.getTestId('active-healthcheck-unhealthy-timeouts').should('have.value', '0')
      cy.getTestId('passive-health-switch').should('be.checked')
      cy.get('.passive-healthcheck-type-select input').should('have.value', 'HTTP')
      cy.getTestId('passive-healthcheck-successes').should('have.value', '4')
      cy.get('.passive-healthcheck-http-statuses .k-multiselect-list button.selected').should('have.length', 2)
      cy.get('.passive-healthcheck-http-statuses .k-multiselect-list button[value="200"]').should('have.class', 'selected')
      cy.get('.passive-healthcheck-http-statuses .k-multiselect-list button[value="201"]').should('have.class', 'selected')
      cy.getTestId('passive-healthcheck-timeouts').should('have.value', '10')
      cy.getTestId('passive-healthcheck-http-failures').should('have.value', '5')
      cy.get('.passive-healthcheck-unhealthy-http-statuses .k-multiselect-list button.selected').should('have.length', 3)
      cy.get('.passive-healthcheck-unhealthy-http-statuses .k-multiselect-list button[value="500"]').should('have.class', 'selected')
      cy.get('.passive-healthcheck-unhealthy-http-statuses .k-multiselect-list button[value="503"]').should('have.class', 'selected')
      cy.get('.passive-healthcheck-unhealthy-http-statuses .k-multiselect-list button[value="429"]').should('have.class', 'selected')
    })

    it('Should emit update event after Upstream was edited', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream()
      interceptValidate()
      interceptUpdate()

      cy.mount(UpstreamsForm, {
        props: {
          config: konnectConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 2000 })

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validateUpstream')
      cy.wait('@updateUpstream')

      cy.get('@onUpdateSpy').should('have.been.calledWith', upstreamsResponse)
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
    const interceptValidate = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/schemas/upstreams/validate`,
        },
        {
          statusCode: status,
          body: {},
        },
      ).as('validateUpstream')
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

      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-submit').should('be.disabled')
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

      cy.get('.active-health-switch').click()
      cy.get('.kong-ui-entities-upstreams-active-healthcheck').should('exist')
      cy.get('.headers-row').should('exist')
      cy.getTestId('active-healthcheck-headers-header-1').should('exist')
      cy.getTestId('active-healthcheck-headers-value-1').should('exist')

      cy.get('.passive-health-switch').click()
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

      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-submit').should('be.disabled')

      cy.get('.name-select').click()
      cy.get('.name-select .k-select-list [data-testid="k-select-item-2"]').click()

      cy.getTestId('form-submit').should('be.enabled')
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

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
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

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('fetch:error', expectedError))

      cy.get('@onErrorSpy').should('have.been.calledWith', expectedError)
    })

    it('Should emit update event after Upstream was created', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptValidate()
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
      cy.get('.name-select .k-select-list [data-testid="k-select-item-2"]').click()

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validateUpstream')
      cy.wait('@createUpstream')

      cy.get('@onUpdateSpy').should('have.been.calledWith', upstreamsResponse)
    })

    it('Error should be visible when creation fails', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptValidate()
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
      cy.get('.name-select .k-select-list [data-testid="k-select-item-2"]').click()

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validateUpstream')
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

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 2000 })

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
      cy.getTestId('active-healthcheck-interval').should('have.value', '10')
      cy.getTestId('active-healthcheck-successes').should('have.value', '5')
      cy.get('.active-healthcheck-http-statuses .k-multiselect-list button.selected').should('have.length', 2)
      cy.get('.active-healthcheck-http-statuses .k-multiselect-list button[value="200"]').should('have.class', 'selected')
      cy.get('.active-healthcheck-http-statuses .k-multiselect-list button[value="302"]').should('have.class', 'selected')
      cy.get('.active-healthcheck-unhealthy-http-statuses .k-multiselect-list button.selected').should('have.length', 2)
      cy.get('.active-healthcheck-unhealthy-http-statuses .k-multiselect-list button[value="429"]').should('have.class', 'selected')
      cy.get('.active-healthcheck-unhealthy-http-statuses .k-multiselect-list button[value="404"]').should('have.class', 'selected')
      cy.getTestId('active-healthcheck-unhealthy-interval').should('have.value', '5')
      cy.getTestId('active-healthcheck-http-failures').should('have.value', '5')
      cy.getTestId('active-healthcheck-unhealthy-timeouts').should('have.value', '0')
      cy.getTestId('passive-health-switch').should('be.checked')
      cy.get('.passive-healthcheck-type-select input').should('have.value', 'HTTP')
      cy.getTestId('passive-healthcheck-successes').should('have.value', '4')
      cy.get('.passive-healthcheck-http-statuses .k-multiselect-list button.selected').should('have.length', 2)
      cy.get('.passive-healthcheck-http-statuses .k-multiselect-list button[value="200"]').should('have.class', 'selected')
      cy.get('.passive-healthcheck-http-statuses .k-multiselect-list button[value="201"]').should('have.class', 'selected')
      cy.getTestId('passive-healthcheck-timeouts').should('have.value', '10')
      cy.getTestId('passive-healthcheck-http-failures').should('have.value', '5')
      cy.get('.passive-healthcheck-unhealthy-http-statuses .k-multiselect-list button.selected').should('have.length', 3)
      cy.get('.passive-healthcheck-unhealthy-http-statuses .k-multiselect-list button[value="500"]').should('have.class', 'selected')
      cy.get('.passive-healthcheck-unhealthy-http-statuses .k-multiselect-list button[value="503"]').should('have.class', 'selected')
      cy.get('.passive-healthcheck-unhealthy-http-statuses .k-multiselect-list button[value="429"]').should('have.class', 'selected')
    })

    it('Should emit update event after Upstream was edited', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream()
      interceptValidate()
      interceptUpdate()

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 2000 })

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validateUpstream')
      cy.wait('@updateUpstream')

      cy.get('@onUpdateSpy').should('have.been.calledWith', upstreamsResponse)
    })

    it('Should send active intervals eq 0 when Active health check was disabled in Edit mode', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream(200, upstreamsKMResponseFull)
      interceptValidate()
      interceptUpdate(200, upstreamsKMResponseDisableActive)

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 2000 })

      cy.getTestId('active-health-switch').should('be.checked')
      cy.get('[data-testid="active-health-switch"] + .switch-control').click({ force: true })

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validateUpstream')
      cy.wait('@updateUpstream')

      cy.get('@onUpdateSpy').should('have.been.calledWithExactly', upstreamsKMResponseDisableActive)
    })

    it('Should send passive values eq 0 when Passive health check was disabled in Edit mode', () => {
      interceptFetchServices()
      interceptFetchCertificates()
      interceptGetUpstream(200, upstreamsKMResponseFull)
      interceptValidate()
      interceptUpdate(200, upstreamsKMResponsePassiveDisabled)

      cy.mount(UpstreamsForm, {
        props: {
          config: KMConfig,
          upstreamId: 'c372844b-a78a-4317-a81f-0606ba317816',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait(['@getUpstream', '@fetchServices', '@fetchCertificates'], { timeout: 2000 })

      cy.getTestId('passive-health-switch').should('be.checked')
      cy.get('[data-testid="passive-health-switch"] + .switch-control').click({ force: true })

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validateUpstream')
      cy.wait('@updateUpstream')

      cy.get('@onUpdateSpy').should('have.been.calledWithExactly', upstreamsKMResponsePassiveDisabled)
    })
  })
})
