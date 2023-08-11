import { KonnectRouteFormConfig, KongManagerRouteFormConfig } from '../types'
import RouteForm from './RouteForm.vue'
import { route, services } from '../../fixtures/mockData'
import { EntityBaseForm } from '@kong-ui/entities-shared'

const cancelRoute = { name: 'route-list' }

const baseConfigKonnect: KonnectRouteFormConfig = {
  app: 'konnect',
  controlPlaneId: '1235-abcd-ilove-dogs',
  apiBaseUrl: '/us/kong-api/konnect-api',
  cancelRoute,
}

const baseConfigKM: KongManagerRouteFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
}

describe('<RouteForm />', { viewportHeight: 700, viewportWidth: 700 }, () => {
  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/routes/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? route,
        },
      ).as(params?.alias ?? 'getRoute')
    }

    const interceptKMServices = (params?: {
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
          body: { data: params?.mockData ?? services },
        },
      ).as(params?.alias ?? 'getServices')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'PATCH',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/routes/*`,
        },
        {
          statusCode: status,
          body: { ...route, tags: ['tag1', 'tag2'] },
        },
      ).as('updateRoute')
    }

    it('should show create form', () => {
      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-route-form').should('be.visible')
      cy.get('.kong-ui-entities-route-form form').should('be.visible')

      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')

      // form fields - general
      cy.getTestId('route-form-name').should('be.visible')
      cy.getTestId('route-form-service-id').should('be.visible')
      cy.getTestId('route-form-tags').should('be.visible')

      // advanced fields
      cy.getTestId('k-collapse-trigger-content').should('be.visible').click()
      cy.getTestId('route-form-path-handling').should('be.visible')
      cy.getTestId('route-form-http-redirect-status-code').should('be.visible')
      cy.getTestId('route-form-regex-priority').should('be.visible')
      cy.getTestId('route-form-strip-path').should('be.visible')
      cy.getTestId('route-form-preserve-host').should('be.visible')
      cy.getTestId('route-form-request-buffering').should('be.visible')
      cy.getTestId('route-form-response-buffering').should('be.visible')

      // routing rules fields
      cy.getTestId('route-form-protocols').should('be.visible')

      // paths
      cy.getTestId('route-form-paths-input-1').should('be.visible')
      cy.getTestId('add-paths').should('be.visible').click()
      cy.getTestId('route-form-paths-input-2').should('be.visible')
      cy.getTestId('remove-paths').first().should('be.visible').click()
      cy.getTestId('route-form-paths-input-2').should('not.exist')

      cy.getTestId('route-form-paths-input-1').should('be.visible')
      cy.getTestId('remove-paths').first().should('be.visible').click()
      cy.get('.route-form-routing-rules-selector-options').should('be.visible')

      // snis
      cy.getTestId('routing-rule-snis').should('be.visible').click()
      cy.getTestId('route-form-snis-input-1').should('be.visible')
      cy.getTestId('add-snis').should('be.visible').click()
      cy.getTestId('route-form-snis-input-2').should('be.visible')
      cy.getTestId('remove-snis').first().should('be.visible').click()
      cy.getTestId('route-form-snis-input-2').should('not.exist')

      // hosts
      cy.getTestId('routing-rule-hosts').should('be.visible').click()
      cy.getTestId('route-form-hosts-input-1').should('be.visible')
      cy.getTestId('add-hosts').should('be.visible').click()
      cy.getTestId('route-form-hosts-input-2').should('be.visible')
      cy.getTestId('remove-hosts').first().should('be.visible').click()
      cy.getTestId('route-form-hosts-input-2').should('not.exist')

      // methods and custom methods
      cy.getTestId('routing-rule-methods').should('be.visible').click()
      cy.getTestId('routing-rule-methods').should('have.attr', 'aria-disabled').and('eq', 'true')
      cy.getTestId('get-method-toggle').should('exist').should('be.visible')
      cy.getTestId('post-method-toggle').should('exist').should('be.visible')
      cy.getTestId('put-method-toggle').should('exist').should('be.visible')
      cy.get('[data-testid="custom-method-toggle"] input').should('exist').should('not.be.visible').check({ force: true })
      cy.getTestId('route-form-custom-method-input-1').should('be.visible')
      cy.getTestId('add-custom-method').should('be.visible').click()
      cy.getTestId('route-form-custom-method-input-2').should('be.visible')
      cy.getTestId('remove-custom-method').first().should('be.visible').click()
      cy.getTestId('route-form-custom-method-input-2').should('not.exist')
      cy.getTestId('remove-methods').should('be.visible').click()
      cy.getTestId('get-method-toggle').should('not.exist')
      cy.getTestId('routing-rule-methods').should('have.attr', 'aria-disabled').and('eq', 'false')

      // headers
      cy.getTestId('routing-rule-headers').should('be.visible').click()
      cy.getTestId('route-form-headers-name-input-1').should('be.visible')
      cy.getTestId('route-form-headers-values-input-1').should('be.visible')
      cy.getTestId('add-headers').should('be.visible').click()
      cy.getTestId('route-form-headers-name-input-2').should('be.visible')
      cy.getTestId('route-form-headers-values-input-2').should('be.visible')
      cy.getTestId('remove-headers').first().should('be.visible').click()
      cy.getTestId('route-form-headers-name-input-2').should('not.exist')
      cy.getTestId('route-form-headers-values-input-2').should('not.exist')

      cy.getTestId('route-form-protocols').click({ force: true })
      cy.get("[data-testid='k-select-item-tcp,tls,udp']").click()
      cy.getTestId('routing-rule-paths').should('not.exist')
      cy.getTestId('routing-rule-hosts').should('not.exist')
      cy.getTestId('routing-rule-methods').should('not.exist')
      cy.getTestId('routing-rule-headers').should('not.exist')

      // sources
      cy.getTestId('routing-rule-sources').should('be.visible').click()
      cy.getTestId('route-form-sources-ip-input-1').should('be.visible')
      cy.getTestId('route-form-sources-port-input-1').should('be.visible')
      cy.getTestId('add-sources').should('be.visible').click()
      cy.getTestId('route-form-sources-ip-input-2').should('be.visible')
      cy.getTestId('route-form-sources-port-input-2').should('be.visible')
      cy.getTestId('remove-sources').first().should('be.visible').click()
      cy.getTestId('route-form-sources-ip-input-2').should('not.exist')
      cy.getTestId('route-form-sources-port-input-2').should('not.exist')

      // destinations
      cy.getTestId('routing-rule-destinations').should('be.visible').click()
      cy.getTestId('route-form-destinations-ip-input-1').should('be.visible')
      cy.getTestId('route-form-destinations-port-input-1').should('be.visible')
      cy.getTestId('add-destinations').should('be.visible').click()
      cy.getTestId('route-form-destinations-ip-input-2').should('be.visible')
      cy.getTestId('route-form-destinations-port-input-2').should('be.visible')
      cy.getTestId('remove-destinations').first().should('be.visible').click()
      cy.getTestId('route-form-destinations-ip-input-2').should('not.exist')
      cy.getTestId('route-form-destinations-port-input-2').should('not.exist')
    })

    it('should correctly handle button state - create', () => {
      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-route-form').should('be.visible')

      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')

      // enables save when required fields have values
      // form fields - general
      cy.getTestId('route-form-name').should('be.visible')

      // paths
      cy.getTestId('route-form-paths-input-1').type(route.paths[0])
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-paths-input-1').clear()
      cy.getTestId('form-submit').should('be.disabled')

      // snis
      cy.getTestId('routing-rule-snis').click()
      cy.getTestId('route-form-snis-input-1').type('sni')
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-snis-input-1').clear()
      cy.getTestId('form-submit').should('be.disabled')

      // hosts
      cy.getTestId('routing-rule-hosts').click()
      cy.getTestId('route-form-hosts-input-1').type('host')
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-hosts-input-1').clear()
      cy.getTestId('form-submit').should('be.disabled')

      // methods and custom methods
      cy.getTestId('routing-rule-methods').click()
      cy.get('[data-testid="get-method-toggle"] input').check({ force: true })
      cy.getTestId('form-submit').should('be.enabled')
      cy.get('[data-testid="get-method-toggle"] input').uncheck({ force: true })
      cy.getTestId('form-submit').should('be.disabled')
      cy.get('[data-testid="custom-method-toggle"] input').check({ force: true })
      cy.getTestId('form-submit').should('be.disabled')
      cy.getTestId('route-form-custom-method-input-1').type('castom')
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-custom-method-input-1').clear()
      cy.getTestId('form-submit').should('be.disabled')

      // headers
      cy.getTestId('routing-rule-headers').click()
      cy.getTestId('route-form-headers-name-input-1').type(Object.keys(route.headers)[0])
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-headers-name-input-1').clear()
      cy.getTestId('route-form-headers-values-input-1').type(route.headers.Header1[0])
      cy.getTestId('form-submit').should('be.disabled')

      cy.getTestId('route-form-protocols').click({ force: true })
      cy.get("[data-testid='k-select-item-tcp,tls,udp']").click()

      // sources
      cy.getTestId('routing-rule-sources').click()
      cy.getTestId('route-form-sources-ip-input-1').type('127.0.0.1')
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-sources-ip-input-1').clear()
      cy.getTestId('route-form-sources-port-input-1').type('8080')
      cy.getTestId('form-submit').should('be.disabled')

      // destinations
      cy.getTestId('routing-rule-destinations').click()
      cy.getTestId('route-form-destinations-ip-input-1').type('127.0.0.2')
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-destinations-ip-input-1').clear()
      cy.getTestId('route-form-destinations-port-input-1').type('8000')
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should show edit form', () => {
      interceptKM()
      interceptKMServices()

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
          routeId: route.id,
        },
      })

      cy.wait('@getRoute')
      cy.wait('@getServices')
      cy.get('.kong-ui-entities-route-form').should('be.visible')

      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')

      // form fields
      cy.getTestId('route-form-name').should('have.value', route.name)
      cy.getTestId('route-form-service-id').should('have.value', route.service.id)
      cy.getTestId('route-form-tags').should('have.value', route.tags.join(', '))
      cy.getTestId('route-form-paths-input-1').should('have.value', route.paths[0])
      cy.getTestId('route-form-paths-input-2').should('have.value', route.paths[1])
      cy.get(`[data-testid="${route.methods[0].toLowerCase()}-method-toggle"] input`).should('be.checked')
      cy.get(`[data-testid="${route.methods[1].toLowerCase()}-method-toggle"] input`).should('be.checked')
      cy.getTestId('route-form-headers-name-input-1').should('have.value', Object.keys(route.headers)[0])
      cy.getTestId('route-form-headers-values-input-1').should('have.value', route.headers.Header1.join(','))

      cy.getTestId('k-collapse-trigger-content').click()
      cy.getTestId('route-form-path-handling').should('have.value', route.path_handling)
      cy.getTestId('route-form-regex-priority').should('have.value', route.regex_priority)
      cy.getTestId('route-form-strip-path').should(`${route.strip_path ? '' : 'not.'}be.checked`)
      cy.getTestId('route-form-preserve-host').should(`${route.preserve_host ? '' : 'not.'}be.checked`)
    })

    it('should correctly handle button state - edit', () => {
      interceptKM()
      interceptKMServices()

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
          routeId: route.id,
        },
      })

      cy.wait('@getRoute')
      cy.wait('@getServices')

      cy.get('.kong-ui-entities-route-form').should('be.visible')

      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      cy.getTestId('routing-rules-warning').should('not.exist')

      // enables save when form has changes
      cy.getTestId('route-form-service-id').click({ force: true })
      cy.get("[data-testid='k-select-item-2']").click()
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('remove-methods').click()
      cy.getTestId('remove-paths').first().click()
      cy.getTestId('remove-paths').click()
      cy.getTestId('remove-headers').click()
      cy.getTestId('routing-rules-warning').should('be.visible')
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load route', () => {
      interceptKMServices()

      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/routes/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getRoute')

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
          routeId: route.id,
        },
      })

      cy.wait('@getRoute')
      cy.wait('@getServices')

      cy.get('.kong-ui-entities-route-form').should('be.visible')

      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')

      // buttons and form hidden
      cy.getTestId('form-cancel').should('not.exist')
      cy.getTestId('form-submit').should('not.exist')
      cy.get('.kong-ui-entities-route-form form').should('not.exist')
    })

    it('should allow exact match filtering of services', () => {
      interceptKMServices()

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.wait('@getServices')
      cy.get('.kong-ui-entities-route-form').should('be.visible')

      // search
      cy.getTestId('route-form-service-id').should('be.visible')
      cy.getTestId('route-form-service-id').type(services[1].name)

      // click kselect item
      cy.getTestId(`k-select-item-${services[1].id}`).should('be.visible')
      cy.get(`[data-testid="k-select-item-${services[1].id}"] button`).click()
      cy.getTestId('route-form-service-id').should('have.value', services[1].id)
    })

    it('should handle error state - failed to load services', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/services/*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getServices')

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.wait('@getServices')
      cy.get('.kong-ui-entities-route-form').should('be.visible')
      cy.getTestId('form-error').should('be.visible')
    })

    it('should correctly render with all props and slot content', () => {
      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
          serviceId: services[0].id,
          hideSectionsInfo: true,
          hideNameField: true,
          showTagsFiledUnderAdvanced: true,
        },
        slots: {
          'form-actions': '<button data-testid="slotted-cancel-button">Cancel</button><button data-testid="slotted-submit-button">Submit</button>',
        },
      })

      cy.get('.kong-ui-entities-route-form').should('be.visible')
      cy.get('.kong-ui-entities-route-form form').should('be.visible')

      // name field should be hidden when hideNameField is true
      cy.getTestId('route-form-name').should('not.exist')

      // tags field should render under advanced fields
      cy.getTestId('route-form-tags').should('not.be.visible')
      cy.getTestId('k-collapse-trigger-content').click()
      cy.getTestId('route-form-tags').should('be.visible')

      // service id field should be hidden when serviceId is provided
      cy.getTestId('route-form-service-id').should('not.exist')

      // sections info should be hidden when hideSectionsInfo is true
      cy.get('.form-section-info sticky').should('not.exist')

      // default buttons should be replaced with slotted content
      cy.getTestId('form-cancel').should('not.exist')
      cy.getTestId('form-submit').should('not.exist')
      cy.getTestId('slotted-cancel-button').should('be.visible')
      cy.getTestId('slotted-submit-button').should('be.visible')
    })

    it('update event should be emitted when Route was edited', () => {
      interceptKM()
      interceptUpdate()

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
          routeId: route.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getRoute')
      cy.getTestId('route-form-tags').clear()
      cy.getTestId('route-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateRoute')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })

    it('should hide `ws` options when not supported', () => {
      cy.mount(RouteForm, {
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

      cy.get('.kong-ui-entities-route-form').should('be.visible')

      cy.getTestId('route-form-protocols').click({ force: true })
      cy.getTestId('k-select-item-http').should('exist')
      cy.getTestId('k-select-item-ws').should('not.exist')
      cy.getTestId('k-select-item-wss').should('not.exist')
    })
  })

  describe('Konnect', { viewportHeight: 700, viewportWidth: 700 }, () => {
    const interceptKonnect = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/routes/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? route,
        },
      ).as(params?.alias ?? 'getRoute')
    }

    const interceptKonnectServices = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/services*`,
        },
        {
          statusCode: 200,
          body: { data: params?.mockData ?? services },
        },
      ).as(params?.alias ?? 'getServices')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'PUT',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/routes/*`,
        },
        {
          statusCode: status,
          body: { ...route, tags: ['tag1', 'tag2'] },
        },
      ).as('updateRoute')
    }

    it('should show create form', () => {
      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-route-form').should('be.visible')
      cy.get('.kong-ui-entities-route-form form').should('be.visible')

      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')

      // form fields - general
      cy.getTestId('route-form-name').should('be.visible')
      cy.getTestId('route-form-service-id').should('be.visible')
      cy.getTestId('route-form-tags').should('be.visible')

      // advanced fields
      cy.getTestId('k-collapse-trigger-content').should('be.visible').click()
      cy.getTestId('route-form-path-handling').should('be.visible')
      cy.getTestId('route-form-http-redirect-status-code').should('be.visible')
      cy.getTestId('route-form-regex-priority').should('be.visible')
      cy.getTestId('route-form-strip-path').should('be.visible')
      cy.getTestId('route-form-preserve-host').should('be.visible')

      // routing rules fields
      cy.getTestId('route-form-protocols').should('be.visible')

      // paths
      cy.getTestId('route-form-paths-input-1').should('be.visible')
      cy.getTestId('add-paths').should('be.visible').click()
      cy.getTestId('route-form-paths-input-2').should('be.visible')
      cy.getTestId('remove-paths').first().should('be.visible').click()
      cy.getTestId('route-form-paths-input-2').should('not.exist')

      cy.getTestId('route-form-paths-input-1').should('be.visible')
      cy.getTestId('remove-paths').first().should('be.visible').click()
      cy.get('.route-form-routing-rules-selector-options').should('be.visible')

      // snis
      cy.getTestId('routing-rule-snis').should('be.visible').click()
      cy.getTestId('route-form-snis-input-1').should('be.visible')
      cy.getTestId('add-snis').should('be.visible').click()
      cy.getTestId('route-form-snis-input-2').should('be.visible')
      cy.getTestId('remove-snis').first().should('be.visible').click()
      cy.getTestId('route-form-snis-input-2').should('not.exist')

      // hosts
      cy.getTestId('routing-rule-hosts').should('be.visible').click()
      cy.getTestId('route-form-hosts-input-1').should('be.visible')
      cy.getTestId('add-hosts').should('be.visible').click()
      cy.getTestId('route-form-hosts-input-2').should('be.visible')
      cy.getTestId('remove-hosts').first().should('be.visible').click()
      cy.getTestId('route-form-hosts-input-2').should('not.exist')

      // methods and custom methods
      cy.getTestId('routing-rule-methods').should('be.visible').click()
      cy.getTestId('routing-rule-methods').should('have.attr', 'aria-disabled').and('eq', 'true')
      cy.getTestId('get-method-toggle').should('exist').should('be.visible')
      cy.getTestId('post-method-toggle').should('exist').should('be.visible')
      cy.getTestId('put-method-toggle').should('exist').should('be.visible')
      cy.get('[data-testid="custom-method-toggle"] input').should('exist').should('not.be.visible').check({ force: true })
      cy.getTestId('route-form-custom-method-input-1').should('be.visible')
      cy.getTestId('add-custom-method').should('be.visible').click()
      cy.getTestId('route-form-custom-method-input-2').should('be.visible')
      cy.getTestId('remove-custom-method').first().should('be.visible').click()
      cy.getTestId('route-form-custom-method-input-2').should('not.exist')
      cy.getTestId('remove-methods').should('be.visible').click()
      cy.getTestId('get-method-toggle').should('not.exist')
      cy.getTestId('routing-rule-methods').should('have.attr', 'aria-disabled').and('eq', 'false')

      // headers
      cy.getTestId('routing-rule-headers').should('be.visible').click()
      cy.getTestId('route-form-headers-name-input-1').should('be.visible')
      cy.getTestId('route-form-headers-values-input-1').should('be.visible')
      cy.getTestId('add-headers').should('be.visible').click()
      cy.getTestId('route-form-headers-name-input-2').should('be.visible')
      cy.getTestId('route-form-headers-values-input-2').should('be.visible')
      cy.getTestId('remove-headers').first().should('be.visible').click()
      cy.getTestId('route-form-headers-name-input-2').should('not.exist')
      cy.getTestId('route-form-headers-values-input-2').should('not.exist')

      cy.getTestId('route-form-protocols').click({ force: true })
      cy.get("[data-testid='k-select-item-tcp,tls,udp']").click()
      cy.getTestId('routing-rule-paths').should('not.exist')
      cy.getTestId('routing-rule-hosts').should('not.exist')
      cy.getTestId('routing-rule-methods').should('not.exist')
      cy.getTestId('routing-rule-headers').should('not.exist')

      // sources
      cy.getTestId('routing-rule-sources').should('be.visible').click()
      cy.getTestId('route-form-sources-ip-input-1').should('be.visible')
      cy.getTestId('route-form-sources-port-input-1').should('be.visible')
      cy.getTestId('add-sources').should('be.visible').click()
      cy.getTestId('route-form-sources-ip-input-2').should('be.visible')
      cy.getTestId('route-form-sources-port-input-2').should('be.visible')
      cy.getTestId('remove-sources').first().should('be.visible').click()
      cy.getTestId('route-form-sources-ip-input-2').should('not.exist')
      cy.getTestId('route-form-sources-port-input-2').should('not.exist')

      // destinations
      cy.getTestId('routing-rule-destinations').should('be.visible').click()
      cy.getTestId('route-form-destinations-ip-input-1').should('be.visible')
      cy.getTestId('route-form-destinations-port-input-1').should('be.visible')
      cy.getTestId('add-destinations').should('be.visible').click()
      cy.getTestId('route-form-destinations-ip-input-2').should('be.visible')
      cy.getTestId('route-form-destinations-port-input-2').should('be.visible')
      cy.getTestId('remove-destinations').first().should('be.visible').click()
      cy.getTestId('route-form-destinations-ip-input-2').should('not.exist')
      cy.getTestId('route-form-destinations-port-input-2').should('not.exist')
    })

    it('should correctly handle button state - create', () => {
      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-route-form').should('be.visible')

      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')

      // enables save when required fields have values
      // form fields - general
      cy.getTestId('route-form-name').should('be.visible')

      // paths
      cy.getTestId('route-form-paths-input-1').type(route.paths[0])
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-paths-input-1').clear()
      cy.getTestId('form-submit').should('be.disabled')

      // snis
      cy.getTestId('routing-rule-snis').click()
      cy.getTestId('route-form-snis-input-1').type('sni')
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-snis-input-1').clear()
      cy.getTestId('form-submit').should('be.disabled')

      // hosts
      cy.getTestId('routing-rule-hosts').click()
      cy.getTestId('route-form-hosts-input-1').type('host')
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-hosts-input-1').clear()
      cy.getTestId('form-submit').should('be.disabled')

      // methods and custom methods
      cy.getTestId('routing-rule-methods').click()
      cy.get('[data-testid="get-method-toggle"] input').check({ force: true })
      cy.getTestId('form-submit').should('be.enabled')
      cy.get('[data-testid="get-method-toggle"] input').uncheck({ force: true })
      cy.getTestId('form-submit').should('be.disabled')
      cy.get('[data-testid="custom-method-toggle"] input').check({ force: true })
      cy.getTestId('form-submit').should('be.disabled')
      cy.getTestId('route-form-custom-method-input-1').type('castom')
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-custom-method-input-1').clear()
      cy.getTestId('form-submit').should('be.disabled')

      // headers
      cy.getTestId('routing-rule-headers').click()
      cy.getTestId('route-form-headers-name-input-1').type(Object.keys(route.headers)[0])
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-headers-name-input-1').clear()
      cy.getTestId('route-form-headers-values-input-1').type(route.headers.Header1[0])
      cy.getTestId('form-submit').should('be.disabled')

      cy.getTestId('route-form-protocols').click({ force: true })
      cy.get("[data-testid='k-select-item-tcp,tls,udp']").click()

      // sources
      cy.getTestId('routing-rule-sources').click()
      cy.getTestId('route-form-sources-ip-input-1').type('127.0.0.1')
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-sources-ip-input-1').clear()
      cy.getTestId('route-form-sources-port-input-1').type('8080')
      cy.getTestId('form-submit').should('be.disabled')

      // destinations
      cy.getTestId('routing-rule-destinations').click()
      cy.getTestId('route-form-destinations-ip-input-1').type('127.0.0.2')
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('route-form-destinations-ip-input-1').clear()
      cy.getTestId('route-form-destinations-port-input-1').type('8000')
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should show edit form', () => {
      interceptKonnect()
      interceptKonnectServices()

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
          routeId: route.id,
        },
      })

      cy.wait('@getRoute')
      cy.wait('@getServices')
      cy.get('.kong-ui-entities-route-form').should('be.visible')

      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')

      // form fields
      cy.getTestId('route-form-name').should('have.value', route.name)
      cy.getTestId('route-form-service-id').should('have.value', route.service.id)
      cy.getTestId('route-form-tags').should('have.value', route.tags.join(', '))
      cy.getTestId('route-form-paths-input-1').should('have.value', route.paths[0])
      cy.getTestId('route-form-paths-input-2').should('have.value', route.paths[1])
      cy.get(`[data-testid="${route.methods[0].toLowerCase()}-method-toggle"] input`).should('be.checked')
      cy.get(`[data-testid="${route.methods[1].toLowerCase()}-method-toggle"] input`).should('be.checked')
      cy.getTestId('route-form-headers-name-input-1').should('have.value', Object.keys(route.headers)[0])
      cy.getTestId('route-form-headers-values-input-1').should('have.value', route.headers.Header1.join(','))

      cy.getTestId('k-collapse-trigger-content').click()
      cy.getTestId('route-form-path-handling').should('have.value', route.path_handling)
      cy.getTestId('route-form-regex-priority').should('have.value', route.regex_priority)
      cy.getTestId('route-form-strip-path').should(`${route.strip_path ? '' : 'not.'}be.checked`)
      cy.getTestId('route-form-preserve-host').should(`${route.preserve_host ? '' : 'not.'}be.checked`)
    })

    it('should correctly handle button state - edit', () => {
      interceptKonnect()
      interceptKonnectServices()

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
          routeId: route.id,
        },
      })

      cy.wait('@getRoute')
      cy.wait('@getServices')

      cy.get('.kong-ui-entities-route-form').should('be.visible')

      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      cy.getTestId('routing-rules-warning').should('not.exist')

      // enables save when form has changes
      cy.getTestId('route-form-service-id').click({ force: true })
      cy.get("[data-testid='k-select-item-2']").click()
      cy.getTestId('form-submit').should('be.enabled')
      cy.getTestId('remove-methods').click()
      cy.getTestId('remove-paths').first().click()
      cy.getTestId('remove-paths').click()
      cy.getTestId('remove-headers').click()
      cy.getTestId('routing-rules-warning').should('be.visible')
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load route', () => {
      interceptKonnectServices()

      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/routes/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getRoute')

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
          routeId: route.id,
        },
      })

      cy.wait('@getRoute')
      cy.wait('@getServices')

      cy.get('.kong-ui-entities-route-form').should('be.visible')

      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')

      // buttons and form hidden
      cy.getTestId('form-cancel').should('not.exist')
      cy.getTestId('form-submit').should('not.exist')
      cy.get('.kong-ui-entities-route-form form').should('not.exist')
    })

    it('should allow exact match filtering of certs', () => {
      interceptKonnectServices()

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.wait('@getServices')
      cy.get('.kong-ui-entities-route-form').should('be.visible')

      // search
      cy.getTestId('route-form-service-id').should('be.visible')
      cy.getTestId('route-form-service-id').type(services[1].name)

      // click kselect item
      cy.getTestId(`k-select-item-${services[1].id}`).should('be.visible')
      cy.get(`[data-testid="k-select-item-${services[1].id}"] button`).click()
      cy.getTestId('route-form-service-id').should('have.value', services[1].id)
    })

    it('should handle error state - failed to load services', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/services*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getServices')

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.wait('@getServices')
      cy.get('.kong-ui-entities-route-form').should('be.visible')
      cy.getTestId('form-error').should('be.visible')
    })

    it('should correctly render with all props and slot content', () => {
      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
          serviceId: services[0].id,
          hideSectionsInfo: true,
          hideNameField: true,
          showTagsFiledUnderAdvanced: true,
        },
        slots: {
          'form-actions': '<button data-testid="slotted-cancel-button">Cancel</button><button data-testid="slotted-submit-button">Submit</button>',
        },
      })

      cy.get('.kong-ui-entities-route-form').should('be.visible')
      cy.get('.kong-ui-entities-route-form form').should('be.visible')

      // name field should be hidden when hideNameField is true
      cy.getTestId('route-form-name').should('not.exist')

      // tags field should render under advanced fields
      cy.getTestId('route-form-tags').should('not.be.visible')
      cy.getTestId('k-collapse-trigger-content').click()
      cy.getTestId('route-form-tags').should('be.visible')

      // service id field should be hidden when serviceId is provided
      cy.getTestId('route-form-service-id').should('not.exist')

      // sections info should be hidden when hideSectionsInfo is true
      cy.get('.form-section-info sticky').should('not.exist')

      // default buttons should be replaced with slotted content
      cy.getTestId('form-cancel').should('not.exist')
      cy.getTestId('form-submit').should('not.exist')
      cy.getTestId('slotted-cancel-button').should('be.visible')
      cy.getTestId('slotted-submit-button').should('be.visible')
    })

    it('update event should be emitted when Route was edited', () => {
      interceptKonnect()
      interceptUpdate()

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
          routeId: route.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getRoute')
      cy.getTestId('route-form-tags').clear()
      cy.getTestId('route-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateRoute')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })
  })
})
