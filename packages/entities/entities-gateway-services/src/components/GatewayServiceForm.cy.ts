// Cypress component test spec file
import type { KongManagerGatewayServiceFormConfig, KonnectGatewayServiceFormConfig } from '../types'
import { gatewayService1, gatewayService2 } from '../../fixtures/mockData'
import GatewayServiceForm from './GatewayServiceForm.vue'
import { EntityBaseForm } from '@kong-ui-public/entities-shared'

const cancelRoute = { name: 'gateway-services-list' }

const baseConfigKonnect: KonnectGatewayServiceFormConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-dogs',
  apiBaseUrl: '/us/kong-api',
  cancelRoute,
}

const baseConfigKM: KongManagerGatewayServiceFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
}

describe('<GatewayServiceForm />', { viewportHeight: 800, viewportWidth: 700 }, () => {
  describe('Konnect', () => {
    const interceptKonnect = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/services/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? gatewayService1,
        },
      ).as(params?.alias ?? 'getGatewayService')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/v1/schemas/json/service/validate`,
        },
        {
          statusCode: status,
          body: {},
        },
      ).as('validateService')

      cy.intercept(
        {
          method: 'PUT',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/services/*`,
        },
        {
          statusCode: status,
          body: { ...gatewayService1, tags: ['tag1', 'tag2'] },
        },
      ).as('updateService')
    }

    it('should render Create form correctly', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      cy.get('.kong-ui-entities-gateway-service-form form').should('be.visible')

      cy.getTestId('gateway-service-name-input').should('be.visible')
      cy.getTestId('gateway-service-tags-input').should('be.visible')
      cy.getTestId('gateway-service-url-input').should('be.visible')
      cy.getTestId('collapse-trigger-content').should('be.visible')

      cy.getTestId('service-create-form-cancel').should('be.visible')
      cy.getTestId('service-create-form-cancel').should('be.enabled')
      cy.getTestId('service-create-form-submit').should('be.visible')
      cy.getTestId('service-create-form-submit').should('be.disabled')
    })

    it("should check for name's validity", () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      cy.get('.kong-ui-entities-gateway-service-form form').should('be.visible')

      cy.getTestId('gateway-service-name-input').should('be.visible')
      cy.getTestId('gateway-service-name-input').parents('.k-input.input-error')
        .should('not.exist')

      cy.getTestId('gateway-service-name-input').type('service')
      cy.getTestId('gateway-service-name-input').parents('.k-input.input-error')
        .should('not.exist')

      cy.getTestId('gateway-service-name-input').clear()
      cy.getTestId('gateway-service-name-input').type('service abc') // with a space
      cy.getTestId('gateway-service-name-input').parents('.k-input.input-error')
        .first().find('.help-text').should('be.visible')

      cy.getTestId('gateway-service-name-input').clear()
      cy.getTestId('gateway-service-name-input').type('Hello-ÆBČÐẼF-你好-妳好-こんにちは-안녕하세요-𑁦𑁧𑁨𑁩𑁪𑁫𑁬𑁭𑁮𑁯') // UTF-8
      cy.getTestId('gateway-service-name-input').parents('.k-input.input-error')
        .should('not.exist')
    })

    it('should enable Save button if Upstream URL is selected and Upstream URL field is filled in', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.getTestId('service-create-form-submit').should('be.visible')
      cy.getTestId('service-create-form-submit').should('be.disabled')

      cy.getTestId('gateway-service-url-input').type(gatewayService1.url)

      cy.getTestId('service-create-form-submit').should('be.enabled')
    })

    it('should handle error state - Upstream URL field validation fails', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      cy.getTestId('gateway-service-url-input').type('abcd')
      cy.getTestId('service-create-form-submit').should('be.enabled').click()
      cy.getTestId('form-error').should('be.visible')
    })

    it('should enable Save button if Protocol, Host, Port and Path option is selected and Host field is filled in', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.getTestId('gateway-service-protocol-radio').click()
      cy.getTestId('service-create-form-submit').should('be.visible')
      cy.getTestId('service-create-form-submit').should('be.disabled')

      cy.getTestId('gateway-service-host-input').type('google')

      cy.getTestId('service-create-form-submit').should('be.enabled')
    })

    it('should update correct Port value based on selected Protocol', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.getTestId('gateway-service-protocol-radio').click()
      // Protocol - http; Port - 80
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService1.port)

      // Protocol - https; Port - 443
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-https').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService2.port)

      // Protocol - tcp; Port - 80
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-tcp').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService1.port)

      // Protocol - tls; Port - 443
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-tls').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService2.port)

      // Protocol - tls_passthrough; Port - 80
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-tls_passthrough').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService1.port)

      // Protocol - grpc; Port - 80
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-grpc').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService1.port)

      // Protocol - grpcs; Port - 443
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-grpcs').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService2.port)

      // Protocol - ws; Port - 80
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-ws').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService1.port)

      // Protocol - wss; Port - 443
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-wss').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService2.port)

      // Protocol - udp; Port - 80
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-udp').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService1.port)
    })

    it('should clear fields when where to send traffic option is changed', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      cy.getTestId('gateway-service-name-input').type('Service-1')
      cy.getTestId('gateway-service-tags-input').type('a,b')
      cy.getTestId('gateway-service-url-input').type(gatewayService1.url)
      cy.getTestId('gateway-service-protocol-radio').click()
      cy.getTestId('gateway-service-host-input').type(gatewayService1.host)
      cy.getTestId('gateway-service-url-radio').click()
      cy.getTestId('gateway-service-url-input').should('have.value', '')
      cy.getTestId('gateway-service-protocol-radio').click()
      cy.getTestId('gateway-service-host-input').should('have.value', '')
    })

    it('should toggle cert fields when protocol is changed', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      cy.getTestId('gateway-service-protocol-radio').click()
      cy.getTestId('collapse-trigger-content').click()

      // hide clineCert, caCert and tlsVerify fields when protocol is http (default)
      cy.getTestId('gateway-service-clientCert-input').should('not.exist')
      cy.getTestId('gateway-service-ca-certs-input').should('not.exist')
      cy.getTestId('gateway-service-tls-verify-checkbox').should('not.exist')

      // show clineCert, caCert and tlsVerify fields when protocol is https
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-https').click()
      cy.getTestId('gateway-service-clientCert-input').should('be.visible')
      cy.getTestId('gateway-service-ca-certs-input').should('be.visible')
      cy.getTestId('gateway-service-tls-verify-checkbox').should('be.visible')

      // show clineCert, caCert and tlsVerify fields when protocol is tls
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-tls').click()
      cy.getTestId('gateway-service-clientCert-input').should('be.visible')
      cy.getTestId('gateway-service-ca-certs-input').should('be.visible')
      cy.getTestId('gateway-service-tls-verify-checkbox').should('be.visible')

      // show caCert and tlsVerify fields when protocol is grpcs
      cy.getTestId('k-select-input').click()
      cy.getTestId('k-select-item-grpcs').click()
      cy.getTestId('gateway-service-clientCert-input').should('not.exist')
      cy.getTestId('gateway-service-ca-certs-input').should('be.visible')
      cy.getTestId('gateway-service-tls-verify-checkbox').should('be.visible')

      // show clineCert and tlsVerify fields when protocol is wss
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-wss').click()
      cy.getTestId('gateway-service-clientCert-input').should('be.visible')
      cy.getTestId('gateway-service-ca-certs-input').should('not.exist')
      cy.getTestId('gateway-service-tls-verify-checkbox').should('be.visible')
    })

    it('should handle error state - failed to load Gateway Service', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/services/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getGatewayService')

      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
          gatewayServiceId: gatewayService1.id,
        },
      })

      cy.wait('@getGatewayService')
      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('service-edit-form-cancel').should('not.exist')
      cy.getTestId('service-edit-form-submit').should('not.exist')
      cy.get('.kong-ui-entities-gateway-service-form form').should('not.exist')
    })

    it('should show edit form', () => {
      interceptKonnect()

      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
          gatewayServiceId: gatewayService1.id,
          isEditing: true,
        },
      })

      cy.wait('@getGatewayService')
      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      // button state
      cy.getTestId('service-edit-form-cancel').should('be.visible')
      cy.getTestId('service-edit-form-submit').should('be.visible')

      // form fields
      cy.getTestId('gateway-service-name-input').should('have.value', gatewayService1.name)
      gatewayService1.tags.forEach((tag: string) => {
        cy.getTestId('gateway-service-tags-input').invoke('val').then((val: string) => {
          expect(val).to.contain(tag)
        })
      })
      cy.getTestId('gateway-service-host-input').should('have.value', gatewayService1.host)
    })

    it('should correctly pass getPayload as props to json/yaml code blocks', () => {
      interceptKonnect()

      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
          gatewayServiceId: gatewayService1.id,
          isEditing: true,
        },
      })

      cy.wait('@getGatewayService')
      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      // view configuration cta
      cy.getTestId('service-edit-form-view-configuration').should('be.visible')
      cy.getTestId('service-edit-form-view-configuration').click()
      cy.getTestId('highlighted-code-block').should('be.visible')
    })

    it('should correctly show zero values', () => {
      interceptKonnect({
        mockData: {
          ...gatewayService1,
          read_timeout: 0,
          retries: 0,
          connect_timeout: 0,
          write_timeout: 0,
          port: 0,
        },
      })

      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
          gatewayServiceId: gatewayService1.id,
          isEditing: true,
        },
      })

      cy.wait('@getGatewayService')
      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')

      // form fields
      cy.getTestId('gateway-service-readTimeout-input').should('have.value', 0)
      cy.getTestId('gateway-service-retries-input').should('have.value', 0)
      cy.getTestId('gateway-service-connTimeout-input').should('have.value', 0)
      cy.getTestId('gateway-service-writeTimeout-input').should('have.value', 0)
      cy.getTestId('gateway-service-port-input').should('have.value', 0)
    })

    it('update event should be emitted when Gateway Service was edited', () => {
      interceptKonnect()
      interceptUpdate()

      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
          gatewayServiceId: gatewayService1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getGatewayService')
      cy.getTestId('gateway-service-tags-input').clear()
      cy.getTestId('gateway-service-tags-input').type('tag1,tag2')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validateService')
      cy.wait('@updateService')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })
  })

  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/services/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? gatewayService1,
        },
      ).as(params?.alias ?? 'getGatewayService')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/schemas/services/validate`,
        },
        {
          statusCode: status,
          body: {},
        },
      ).as('validateService')

      cy.intercept(
        {
          method: 'PATCH',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/services/*`,
        },
        {
          statusCode: status,
          body: { ...gatewayService1, tags: ['tag1', 'tag2'] },
        },
      ).as('updateService')
    }

    it('should render Create form correctly', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      cy.get('.kong-ui-entities-gateway-service-form form').should('be.visible')

      cy.getTestId('gateway-service-name-input').should('be.visible')
      cy.getTestId('gateway-service-tags-input').should('be.visible')
      cy.getTestId('gateway-service-url-input').should('be.visible')
      cy.getTestId('collapse-trigger-content').should('be.visible')

      cy.getTestId('service-create-form-cancel').should('be.visible')
      cy.getTestId('service-create-form-cancel').should('be.enabled')
      cy.getTestId('service-create-form-submit').should('be.visible')
      cy.getTestId('service-create-form-submit').should('be.disabled')
    })

    it("should check for name's validity", () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      cy.get('.kong-ui-entities-gateway-service-form form').should('be.visible')

      cy.getTestId('gateway-service-name-input').should('be.visible')
      cy.getTestId('gateway-service-name-input').parents('.k-input.input-error')
        .should('not.exist')

      cy.getTestId('gateway-service-name-input').type('service')
      cy.getTestId('gateway-service-name-input').parents('.k-input.input-error')
        .should('not.exist')

      cy.getTestId('gateway-service-name-input').clear()
      cy.getTestId('gateway-service-name-input').type('service abc') // with a space
      cy.getTestId('gateway-service-name-input').parents('.k-input.input-error')
        .first().find('.help-text').should('be.visible')

      cy.getTestId('gateway-service-name-input').clear()
      cy.getTestId('gateway-service-name-input').type('Hello-ÆBČÐẼF-你好-妳好-こんにちは-안녕하세요-𑁦𑁧𑁨𑁩𑁪𑁫𑁬𑁭𑁮𑁯') // UTF-8
      cy.getTestId('gateway-service-name-input').parents('.k-input.input-error')
        .should('not.exist')
    })

    it('should enable Save button if Upstream URL is selected and Upstream URL field is filled in', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.getTestId('service-create-form-submit').should('be.visible')
      cy.getTestId('service-create-form-submit').should('be.disabled')

      cy.getTestId('gateway-service-url-input').type(gatewayService1.url)

      cy.getTestId('service-create-form-submit').should('be.enabled')
    })

    it('should handle error state - Upstream URL field validation fails', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      cy.getTestId('gateway-service-url-input').type('abcd')
      cy.getTestId('service-create-form-submit').should('be.enabled').click()
      cy.getTestId('form-error').should('be.visible')
    })

    it('should enable Save button if Protocol, Host, Port and Path option is selected and Host field is filled in', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.getTestId('gateway-service-protocol-radio').click()
      cy.getTestId('service-create-form-submit').should('be.visible')
      cy.getTestId('service-create-form-submit').should('be.disabled')

      cy.getTestId('gateway-service-host-input').type('google')

      cy.getTestId('service-create-form-submit').should('be.enabled')
    })

    it('should update correct Port value based on selected Protocol', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.getTestId('gateway-service-protocol-radio').click()
      // Protocol - http; Port - 80
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService1.port)

      // Protocol - https; Port - 443
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-https').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService2.port)

      // Protocol - tcp; Port - 80
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-tcp').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService1.port)

      // Protocol - tls; Port - 443
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-tls').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService2.port)

      // Protocol - tls_passthrough; Port - 80
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-tls_passthrough').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService1.port)

      // Protocol - grpc; Port - 80
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-grpc').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService1.port)

      // Protocol - grpcs; Port - 443
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-grpcs').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService2.port)

      // Protocol - ws; Port - 80
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-ws').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService1.port)

      // Protocol - wss; Port - 443
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-wss').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService2.port)

      // Protocol - udp; Port - 80
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-udp').click()
      cy.getTestId('gateway-service-port-input').should('have.value', gatewayService1.port)
    })

    it('should clear fields when where to send traffic option is changed', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      cy.getTestId('gateway-service-name-input').type('Service-1')
      cy.getTestId('gateway-service-tags-input').type('a,b')
      cy.getTestId('gateway-service-url-input').type(gatewayService1.url)
      cy.getTestId('gateway-service-protocol-radio').click()
      cy.getTestId('gateway-service-host-input').type(gatewayService1.host)
      cy.getTestId('gateway-service-url-radio').click()
      cy.getTestId('gateway-service-url-input').should('have.value', '')
      cy.getTestId('gateway-service-protocol-radio').click()
      cy.getTestId('gateway-service-host-input').should('have.value', '')
    })

    it('should toggle cert fields when protocol is changed', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      cy.getTestId('gateway-service-protocol-radio').click()
      cy.getTestId('collapse-trigger-content').click()

      // hide clineCert, caCert and tlsVerify fields when protocol is http (default)
      cy.getTestId('gateway-service-clientCert-input').should('not.exist')
      cy.getTestId('gateway-service-ca-certs-input').should('not.exist')
      cy.getTestId('gateway-service-tls-verify-checkbox').should('not.exist')

      // show clineCert, caCert and tlsVerify fields when protocol is https
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-https').click()
      cy.getTestId('gateway-service-clientCert-input').should('be.visible')
      cy.getTestId('gateway-service-ca-certs-input').should('be.visible')
      cy.getTestId('gateway-service-tls-verify-checkbox').should('be.visible')

      // show clineCert, caCert and tlsVerify fields when protocol is tls
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-tls').click()
      cy.getTestId('gateway-service-clientCert-input').should('be.visible')
      cy.getTestId('gateway-service-ca-certs-input').should('be.visible')
      cy.getTestId('gateway-service-tls-verify-checkbox').should('be.visible')

      // show clineCert, caCert and tlsVerify fields when protocol is grpcs
      cy.getTestId('k-select-input').click()
      cy.getTestId('k-select-item-grpcs').click()
      cy.getTestId('gateway-service-clientCert-input').should('not.exist')
      cy.getTestId('gateway-service-ca-certs-input').should('be.visible')
      cy.getTestId('gateway-service-tls-verify-checkbox').should('be.visible')

      // show clineCert and tlsVerify fields when protocol is wss
      cy.getTestId('gateway-service-protocol-select').click()
      cy.getTestId('select-item-wss').click()
      cy.getTestId('gateway-service-clientCert-input').should('be.visible')
      cy.getTestId('gateway-service-ca-certs-input').should('not.exist')
      cy.getTestId('gateway-service-tls-verify-checkbox').should('be.visible')
    })

    it('should handle error state - failed to load Gateway Service', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/services/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getGatewayService')

      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKM,
          gatewayServiceId: gatewayService1.id,
        },
      })

      cy.wait('@getGatewayService')
      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('service-edit-form-cancel').should('not.exist')
      cy.getTestId('service-edit-form-submit').should('not.exist')
      cy.get('.kong-ui-entities-gateway-service-form form').should('not.exist')
    })

    it('should show edit form', () => {
      interceptKM()

      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKM,
          gatewayServiceId: gatewayService1.id,
          isEditing: true,
        },
      })

      cy.wait('@getGatewayService')
      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')
      // button state
      cy.getTestId('service-edit-form-cancel').should('be.visible')
      cy.getTestId('service-edit-form-submit').should('be.visible')

      // form fields
      cy.getTestId('gateway-service-name-input').should('have.value', gatewayService1.name)
      gatewayService1.tags.forEach((tag: string) => {
        cy.getTestId('gateway-service-tags-input').invoke('val').then((val: string) => {
          expect(val).to.contain(tag)
        })
      })
      cy.getTestId('gateway-service-host-input').should('have.value', gatewayService1.host)
    })

    it('should correctly show zero values', () => {
      interceptKM({
        mockData: {
          ...gatewayService1,
          read_timeout: 0,
          retries: 0,
          connect_timeout: 0,
          write_timeout: 0,
          port: 0,
        },
      })

      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKM,
          gatewayServiceId: gatewayService1.id,
          isEditing: true,
        },
      })

      cy.wait('@getGatewayService')
      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')

      // form fields
      cy.getTestId('gateway-service-readTimeout-input').should('have.value', 0)
      cy.getTestId('gateway-service-retries-input').should('have.value', 0)
      cy.getTestId('gateway-service-connTimeout-input').should('have.value', 0)
      cy.getTestId('gateway-service-writeTimeout-input').should('have.value', 0)
      cy.getTestId('gateway-service-port-input').should('have.value', 0)
    })

    it('update event should be emitted when Gateway Service was edited', () => {
      interceptKM()
      interceptUpdate()

      cy.mount(GatewayServiceForm, {
        props: {
          config: baseConfigKM,
          gatewayServiceId: gatewayService1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getGatewayService')
      cy.getTestId('gateway-service-tags-input').clear()
      cy.getTestId('gateway-service-tags-input').type('tag1,tag2')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validateService')
      cy.wait('@updateService')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })

    it('should hide `ws` options when not supported', () => {
      cy.mount(GatewayServiceForm, {
        props: {
          config: {
            ...baseConfigKM,
            gatewayInfo: {
              edition: 'enterprise',
              version: '2.8.0.0',
            },
          },
        },
      })

      cy.get('.kong-ui-entities-gateway-service-form').should('be.visible')

      cy.getTestId('gateway-service-protocol-radio').click()
      cy.getTestId('gateway-service-protocol-select').click({ force: true })
      cy.getTestId('select-item-http').should('exist')
      cy.getTestId('select-item-ws').should('not.exist')
      cy.getTestId('select-item-wss').should('not.exist')
    })
  })
})
