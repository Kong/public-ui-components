import type { KonnectRouteFormConfig, KongManagerRouteFormConfig, RouteFlavors } from '../types'
import RouteForm from './RouteForm.vue'
import { route, routeExpressions, services } from '../../fixtures/mockData'
import { EntityBaseForm } from '@kong-ui-public/entities-shared'
import type { RouteHandler } from 'cypress/types/net-stubbing'
import { HTTP_BASED_PROTOCOLS, STREAM_BASED_PROTOCOLS } from '@kong-ui-public/expressions'

const cancelRoute = { name: 'route-list' }

const baseConfigKonnect: KonnectRouteFormConfig = {
  app: 'konnect',
  controlPlaneId: '1235-abcd-ilove-dogs',
  apiBaseUrl: '/us/kong-api',
  cancelRoute,
}

const baseConfigKM: KongManagerRouteFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
}

const TRADITIONAL_ONLY: RouteFlavors = { traditional: true, expressions: false }
const EXPRESSIONS_ONLY: RouteFlavors = { traditional: false, expressions: true }
const TRADITIONAL_EXPRESSIONS: RouteFlavors = { traditional: true, expressions: true }

const formatRouteFlavors = (routeFlavors?: RouteFlavors): string => {
  return routeFlavors ? [...routeFlavors.traditional ? ['trad'] : [], ...routeFlavors.expressions ? ['expr'] : []].join('+') || 'none' : 'default'
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
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/services*`,
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

    /**
     * Stub the POST and PATCH requests with mocked responses where `kind` marks the type of route
     * being created/edited. This uses the validation steps that are similar to the backend to simply
     * verify that the mutually exclusive fields are not included.
     */
    const stubCreateEdit = () => {
      const handler: RouteHandler = (req) => {
        const { body } = req

        // only verify mutually exclusive fields
        const hasExpressionsFields = Object.hasOwnProperty.call(body, 'expression')
        const hasTraditionalFields = ['hosts', 'paths', 'headers', 'methods', 'snis', 'sources', 'destinations']
          .some((prop) => Object.hasOwnProperty.call(body, prop))

        req.reply({
          statusCode: 400,
          body: {
            kind: hasExpressionsFields ? 'expr' : hasTraditionalFields ? 'trad' : undefined,
          },
        })
      }

      cy.intercept('POST', `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/routes`, handler).as('createRoute')
      cy.intercept('PATCH', `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/routes/*`, handler).as('editRoute')
    }

    // Tests 4 possible RouteFlavors: <not-set>, <trad only>, <expr only>, <trad+expr>
    for (const routeFlavors of [undefined, TRADITIONAL_ONLY, EXPRESSIONS_ONLY, TRADITIONAL_EXPRESSIONS]) {
      const configTabs = `tabs=${formatRouteFlavors(routeFlavors)}`

      it(`should show create form, ${configTabs}`, () => {
        cy.mount(RouteForm, {
          props: {
            config: baseConfigKM,
            routeFlavors,
          },
        })

        cy.get('.kong-ui-entities-route-form').should('be.visible')
        cy.get('.kong-ui-entities-route-form form').should('be.visible')

        // button state
        cy.getTestId('route-create-form-cancel').should('be.visible')
        cy.getTestId('route-create-form-submit').should('be.visible')
        cy.getTestId('route-create-form-cancel').should('be.enabled')
        cy.getTestId('route-create-form-submit').should('be.disabled')

        // config tabs is hidden when there is only one tab
        cy.getTestId('route-form-config-tabs')
          .should(routeFlavors?.traditional && routeFlavors?.expressions ? 'be.visible' : 'not.exist')

        // base + base advanced fields
        cy.getTestId('collapse-trigger-content').click()
        cy.getTestId('route-form-name').should('be.visible')
        cy.getTestId('route-form-service-id').should('be.visible')
        cy.getTestId('route-form-tags').should('be.visible')
        cy.getTestId('route-form-protocols').should('be.visible')

        if (routeFlavors?.traditional && routeFlavors?.expressions) {
          // trad + expr 2 tabs
          // switch to trad tab
          cy.get('#traditional-tab').click()
        } // else: we will be on the trad tab by default

        if (routeFlavors?.traditional) {
          // base advanced fields
          cy.getTestId('route-form-http-redirect-status-code').should('be.visible')
          cy.getTestId('route-form-preserve-host').should('be.visible')
          cy.getTestId('route-form-strip-path').should('be.visible')
          cy.getTestId('route-form-request-buffering').should('be.visible')
          cy.getTestId('route-form-response-buffering').should('be.visible')

          // other advanced fields
          cy.getTestId('route-form-path-handling').should('be.visible')
          cy.getTestId('route-form-regex-priority').should('be.visible')

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
          cy.getTestId('get-method-toggle').should('exist')
          cy.getTestId('post-method-toggle').should('exist')
          cy.getTestId('put-method-toggle').should('exist')
          cy.getTestId('custom-method-toggle').should('exist').check({ force: true })
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
          cy.get("[data-testid='select-item-tcp,tls,udp']").click({ force: true })
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
        }

        if (routeFlavors?.traditional && routeFlavors?.expressions) {
          // trad + expr 2 tabs
          // switch to expr tab
          cy.get('#expressions-tab').click()
        }

        if (routeFlavors?.expressions) {
          // negative: traditional fields should not exist
          cy.getTestId('route-form-path-handling').should('not.exist')
          cy.getTestId('route-form-regex-priority').should('not.exist')
          cy.getTestId('route-form-paths-input-1').should('not.exist')
          cy.get('.route-form-routing-rules-selector-options').should('not.exist')

          // expressions editor
          cy.get('.expression-editor .monaco-editor').should('be.visible')

          // base advanced fields
          cy.getTestId('route-form-http-redirect-status-code').should('be.visible')
          cy.getTestId('route-form-preserve-host').should('be.visible')
          cy.getTestId('route-form-strip-path').should('be.visible')
          cy.getTestId('route-form-request-buffering').should('be.visible')
          cy.getTestId('route-form-response-buffering').should('be.visible')
        }
      })

      if (routeFlavors?.traditional && routeFlavors?.expressions) {
        // only test when both trad & expr tabs present
        it('should show tooltips', () => {
          cy.mount(RouteForm, {
            props: {
              config: baseConfigKM,
              routeFlavors,
              configTabTooltips: {
                traditional: 'For traditional routes',
                expressions: 'For expressions routes',
              },
            },
          })

          cy.get('.kong-ui-entities-route-form').should('be.visible')
          cy.get('.kong-ui-entities-route-form form').should('be.visible')

          cy.get('#traditional-tab .route-form-config-tabs-tooltip').should('contain.text', 'For traditional routes')
          cy.get('#expressions-tab .route-form-config-tabs-tooltip').should('contain.text', 'For expressions routes')
        })
      }

      if (!routeFlavors || routeFlavors?.traditional) {
        // only test when there is trad tab
        it(`should correctly handle button state - create traditional, ${configTabs}`, () => {
          interceptKMServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKM,
              routeFlavors,
            },
          })

          cy.get('.kong-ui-entities-route-form').should('be.visible')

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad + expr 2 tabs
            // switch to trad tab
            cy.get('#traditional-tab').click()
          } // else: we will be on the trad tab by default

          // default button state
          cy.getTestId('route-create-form-cancel').should('be.visible')
          cy.getTestId('route-create-form-submit').should('be.visible')
          cy.getTestId('route-create-form-cancel').should('be.enabled')
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // config tabs is hidden when there is only one tab
          cy.getTestId('route-form-config-tabs')
            .should(routeFlavors?.traditional && routeFlavors?.expressions ? 'be.visible' : 'not.exist')

          // enables save when required fields have values
          // form fields - general
          cy.getTestId('route-form-name').should('be.visible')

          // paths
          cy.getTestId('route-form-paths-input-1').type(route.paths[0])
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-paths-input-1').clear()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // snis
          cy.getTestId('routing-rule-snis').click()
          cy.getTestId('route-form-snis-input-1').type('sni')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-snis-input-1').clear()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // hosts
          cy.getTestId('routing-rule-hosts').click()
          cy.getTestId('route-form-hosts-input-1').type('host')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-hosts-input-1').clear()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // methods and custom methods
          cy.getTestId('routing-rule-methods').click()
          cy.getTestId('get-method-toggle').check({ force: true })
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('get-method-toggle').uncheck({ force: true })
          cy.getTestId('route-create-form-submit').should('be.disabled')
          cy.getTestId('custom-method-toggle').check({ force: true })
          cy.getTestId('route-create-form-submit').should('be.disabled')
          cy.getTestId('route-form-custom-method-input-1').type('castom')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-custom-method-input-1').clear()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // headers
          cy.getTestId('routing-rule-headers').click()
          cy.getTestId('route-form-headers-name-input-1').type(Object.keys(route.headers)[0])
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-headers-name-input-1').clear()
          cy.getTestId('route-form-headers-values-input-1').type(route.headers.Header1[0])
          cy.getTestId('route-create-form-submit').should('be.disabled')

          cy.getTestId('route-form-protocols').click({ force: true })
          cy.get("[data-testid='select-item-tcp,tls,udp']").click({ force: true })

          // sources
          cy.getTestId('routing-rule-sources').click()
          cy.getTestId('route-form-sources-ip-input-1').type('127.0.0.1')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-sources-ip-input-1').clear()
          cy.getTestId('route-form-sources-port-input-1').type('8080')
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // destinations
          cy.getTestId('routing-rule-destinations').click()
          cy.getTestId('route-form-destinations-ip-input-1').type('127.0.0.2')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-destinations-ip-input-1').clear()
          cy.getTestId('route-form-destinations-port-input-1').type('8000')
          cy.getTestId('route-create-form-submit').should('be.disabled')
        })
      } // if !routeFlavors || routeFlavors?.traditional

      if (routeFlavors?.expressions) {
        // only test when there is expr tab
        it(`should correctly handle button state - create expressions, ${configTabs}`, () => {
          interceptKMServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKM,
              routeFlavors,
            },
          })

          cy.get('.kong-ui-entities-route-form').should('be.visible')

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad + expr 2 tabs
            // switch to expr tab
            cy.get('#expressions-tab').click()
          } // else: we will be on expr tab by default

          // default button state
          cy.getTestId('route-create-form-cancel').should('be.visible')
          cy.getTestId('route-create-form-submit').should('be.visible')
          cy.getTestId('route-create-form-cancel').should('be.enabled')
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // enables save when required fields have values
          // form fields - general
          cy.getTestId('route-form-name').should('be.visible')
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // the editor shows invalid because it is empty
          cy.get('.expression-editor').should('have.class', 'invalid')

          // type a valid expression
          cy.get('.monaco-editor').first().as('monacoEditor').click()
          cy.get('@monacoEditor').type('http.path == "/kong"')

          // it should be no longer invalid
          cy.get('.expression-editor').should('not.have.class', 'invalid')
          // and the submit button is enabled
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'expr')

          // delete the last character
          cy.get('@monacoEditor').type('{backspace}')

          // invalid again
          cy.get('.expression-editor').should('have.class', 'invalid')
          // but the submit button is still enabled because we let the server handle uncaught errors
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'expr')
        })
      } // if routeFlavors?.expressions

      if (!routeFlavors || routeFlavors?.traditional) {
        // only test when there is trad tab
        it(`should show edit form, traditional ${configTabs}`, () => {
          interceptKM()
          interceptKMServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKM,
              routeId: route.id,
              routeFlavors,
            },
          })

          cy.wait('@getRoute')
          cy.wait('@getServices')
          cy.get('.kong-ui-entities-route-form').should('be.visible')

          // button state
          cy.getTestId('route-edit-form-cancel').should('be.visible')
          cy.getTestId('route-edit-form-submit').should('be.visible')
          cy.getTestId('route-edit-form-cancel').should('be.enabled')
          cy.getTestId('route-edit-form-submit').should('be.disabled')

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad tab should be active by default
            cy.get('#traditional-tab').should('have.class', 'active')
          }

          // form fields
          cy.getTestId('route-form-name').should('have.value', route.name)
          cy.getTestId('route-form-service-id').should('have.value', route.service.id)
          cy.getTestId('route-form-tags').should('have.value', route.tags.join(', '))

          cy.getTestId('collapse-trigger-content').click()
          cy.getTestId('route-form-path-handling').should('have.value', route.path_handling)
          cy.getTestId('route-form-regex-priority').should('have.value', route.regex_priority)
          cy.getTestId('route-form-strip-path').should(`${route.strip_path ? '' : 'not.'}be.checked`)
          cy.getTestId('route-form-preserve-host').should(`${route.preserve_host ? '' : 'not.'}be.checked`)

          cy.getTestId('route-form-paths-input-1').should('have.value', route.paths[0])
          cy.getTestId('route-form-paths-input-2').should('have.value', route.paths[1])
          cy.getTestId(`${route.methods[0].toLowerCase()}-method-toggle`).should('be.checked')
          cy.getTestId(`${route.methods[1].toLowerCase()}-method-toggle`).should('be.checked')
          cy.getTestId('route-form-headers-name-input-1').should('have.value', Object.keys(route.headers)[0])
          cy.getTestId('route-form-headers-values-input-1').should('have.value', route.headers.Header1.join(','))

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // switch to expr tab
            cy.get('#expressions-tab').click()
            // should not see the expression editor
            cy.get('.expression-editor').should('not.exist')
            // should be reminded that the route type cannot be changed
            cy.getTestId('route-config-type-immutable-alert').should('contain.text', 'cannot be changed after creation')
          }
        })

        it(`should correctly handle button state - edit traditional, ${configTabs}`, () => {
          interceptKM()
          interceptKMServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKM,
              routeId: route.id,
              routeFlavors,
            },
          })

          cy.wait('@getRoute')
          cy.wait('@getServices')

          cy.get('.kong-ui-entities-route-form').should('be.visible')

          // default button state
          cy.getTestId('route-edit-form-cancel').should('be.visible')
          cy.getTestId('route-edit-form-submit').should('be.visible')
          cy.getTestId('route-edit-form-cancel').should('be.enabled')
          cy.getTestId('route-edit-form-submit').should('be.disabled')

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad tab should be active by default
            cy.get('#traditional-tab').should('have.class', 'active')
          }

          cy.getTestId('routing-rules-warning').should('not.exist')

          // enables save when form has changes
          cy.getTestId('route-form-service-id').click({ force: true })
          cy.get("[data-testid='select-item-2']").click()
          cy.getTestId('route-edit-form-submit').should('be.enabled').click()
          cy.wait('@editRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('remove-methods').click()
          cy.getTestId('remove-paths').first().click()
          cy.getTestId('remove-paths').click()
          cy.getTestId('remove-headers').click()
          cy.getTestId('routing-rules-warning').should('be.visible')
          cy.getTestId('route-edit-form-submit').should('be.disabled')
        })
      } // if !routeFlavors || routeFlavors?.traditional

      if (routeFlavors?.expressions) {
        // only test when there is trad tab
        it(`should show edit form, expressions ${configTabs}`, () => {
          interceptKM({ mockData: routeExpressions })
          interceptKMServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKM,
              routeId: routeExpressions.id,
              routeFlavors,
            },
          })

          cy.wait('@getRoute')
          cy.wait('@getServices')
          cy.get('.kong-ui-entities-route-form').should('be.visible')

          // button state
          cy.getTestId('route-edit-form-cancel').should('be.visible')
          cy.getTestId('route-edit-form-submit').should('be.visible')
          cy.getTestId('route-edit-form-cancel').should('be.enabled')
          cy.getTestId('route-edit-form-submit').should('be.disabled')

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // expr tab should be active by default
            cy.get('#expressions-tab').should('have.class', 'active')
          }

          // form fields
          cy.getTestId('route-form-name').should('have.value', routeExpressions.name)
          cy.getTestId('route-form-service-id').should('have.value', routeExpressions.service.id)
          cy.getTestId('route-form-tags').should('have.value', routeExpressions.tags.join(', '))

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            cy.getTestId('collapse-trigger-content').click()
            // switch to trad tab
            cy.get('#traditional-tab').click()
            // should not see trad fields
            cy.getTestId('route-form-path-handling').should('not.exist')
            cy.getTestId('route-form-regex-priority').should('not.exist')
            // should be reminded that the route type cannot be changed
            cy.getTestId('route-config-type-immutable-alert').should('contain.text', 'cannot be changed after creation')
          }
        })

        it(`should correctly handle button state - edit expressions, ${configTabs}`, () => {
          interceptKM({ mockData: routeExpressions })
          interceptKMServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKM,
              routeId: routeExpressions.id,
              routeFlavors,
            },
          })

          cy.wait('@getRoute')
          cy.wait('@getServices')

          cy.get('.kong-ui-entities-route-form').should('be.visible')

          // default button state
          cy.getTestId('route-edit-form-cancel').should('be.visible')
          cy.getTestId('route-edit-form-submit').should('be.visible')
          cy.getTestId('route-edit-form-cancel').should('be.enabled')
          cy.getTestId('route-edit-form-submit').should('be.disabled')

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad tab should be active by default
            cy.get('#expressions-tab').should('have.class', 'active')
            cy.getTestId('route-form-expressions-editor-loader-loading').should('not.exist')
          }

          // enables save when form has changes
          cy.getTestId('route-form-service-id').click({ force: true })
          cy.get("[data-testid='select-item-2']").click()
          cy.getTestId('route-edit-form-submit').should('be.enabled').click()
          cy.wait('@editRoute').then((res) => res.response?.body?.kind).should('eq', 'expr')

          // type a valid expression
          cy.get('.monaco-editor').first().as('monacoEditor').click()
          // delete the last character
          cy.get('@monacoEditor').type('{backspace}')

          // the editor should become invalid
          cy.get('.expression-editor').should('have.class', 'invalid')
          // but the submit button is still enabled because we let the server handle uncaught errors
          cy.getTestId('route-edit-form-submit').should('be.enabled').click()
          cy.wait('@editRoute').then((res) => res.response?.body?.kind).should('eq', 'expr')
        })
      } // if routeFlavors?.expressions

      it(`should handle error state - failed to load route, ${configTabs}`, () => {
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
            routeFlavors,
          },
        })

        cy.wait('@getRoute')
        cy.wait('@getServices')

        cy.get('.kong-ui-entities-route-form').should('be.visible')

        // error state is displayed
        cy.getTestId('form-fetch-error').should('be.visible')

        // buttons and form hidden
        cy.getTestId('route-edit-form-cancel').should('not.exist')
        cy.getTestId('route-edit-form-submit').should('not.exist')
        cy.get('.kong-ui-entities-route-form form').should('not.exist')
      })

      it(`should allow exact match filtering of services, ${configTabs}`, () => {
        interceptKMServices()

        cy.mount(RouteForm, {
          props: {
            config: baseConfigKM,
            routeFlavors,
          },
        })

        cy.wait('@getServices')
        cy.get('.kong-ui-entities-route-form').should('be.visible')

        // config tabs is hidden when there is only one tab
        cy.getTestId('route-form-config-tabs')
          .should(routeFlavors?.traditional && routeFlavors?.expressions ? 'be.visible' : 'not.exist')

        // search
        cy.getTestId('route-form-service-id').should('be.visible')
        cy.getTestId('route-form-service-id').type(services[1].name)

        // click kselect item
        cy.getTestId(`select-item-${services[1].id}`).should('be.visible')
        cy.get(`[data-testid="select-item-${services[1].id}"] button`).click()
        cy.getTestId('route-form-service-id').should('have.value', services[1].id)
      })

      it(`should handle error state - failed to load services, ${configTabs}`, () => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/services*`,
          },
          {
            statusCode: 500,
            body: {},
          },
        ).as('getServices')

        cy.mount(RouteForm, {
          props: {
            config: baseConfigKM,
            routeFlavors,
          },
        })

        cy.wait('@getServices')
        cy.get('.kong-ui-entities-route-form').should('be.visible')
        cy.getTestId('form-error').should('be.visible')
      })

      it(`should correctly render with all props and slot content, ${configTabs}`, () => {
        cy.mount(RouteForm, {
          props: {
            config: baseConfigKM,
            serviceId: services[0].id,
            hideSectionsInfo: true,
            hideNameField: true,
            showTagsFiledUnderAdvanced: true,
            routeFlavors,
          },
          slots: {
            'form-actions': '<button data-testid="slotted-cancel-button">Cancel</button><button data-testid="slotted-submit-button">Submit</button>',
          },
        })

        cy.get('.kong-ui-entities-route-form').should('be.visible')
        cy.get('.kong-ui-entities-route-form form').should('be.visible')

        // config tabs is hidden when there is only one tab
        cy.getTestId('route-form-config-tabs')
          .should(routeFlavors?.traditional && routeFlavors?.expressions ? 'be.visible' : 'not.exist')

        // name field should be hidden when hideNameField is true
        cy.getTestId('route-form-name').should('not.exist')

        // tags field should render under advanced fields
        cy.getTestId('route-form-tags').should('not.be.visible')
        cy.getTestId('collapse-trigger-content').click()
        cy.getTestId('route-form-tags').should('be.visible')

        // service id field should be hidden when serviceId is provided
        cy.getTestId('route-form-service-id').should('not.exist')

        // sections info should be hidden when hideSectionsInfo is true
        cy.get('.form-section-info sticky').should('not.exist')

        // default buttons should be replaced with slotted content
        cy.getTestId('route-create-form-cancel').should('not.exist')
        cy.getTestId('route-create-form-submit').should('not.exist')
        cy.getTestId('slotted-cancel-button').should('be.visible')
        cy.getTestId('slotted-submit-button').should('be.visible')
      })

      it(`update event should be emitted when Route was edited, ${configTabs}`, () => {
        interceptKM()
        interceptUpdate()

        cy.mount(RouteForm, {
          props: {
            config: baseConfigKM,
            routeId: route.id,
            onUpdate: cy.spy().as('onUpdateSpy'),
            routeFlavors,
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getRoute')
        cy.getTestId('route-form-tags').clear()
        cy.getTestId('route-form-tags').type('tag1,tag2')

        cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
          .vm.$emit('submit'))

        cy.wait('@updateRoute')

        cy.get('@onUpdateSpy').should('have.been.calledOnce')
      })
    } // for RouteFlavors[]

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

      // config tabs is hidden when there is only one tab
      cy.getTestId('route-form-config-tabs').should('not.exist')

      cy.getTestId('route-form-protocols').click({ force: true })
      cy.getTestId('select-item-http').should('exist')
      cy.getTestId('select-item-ws').should('not.exist')
      cy.getTestId('select-item-wss').should('not.exist')
    })

    describe('RoutePlayground', () => {
      beforeEach(() => {
        cy.on('uncaught:exception', err => !err.message.includes('ResizeObserver loop completed with undelivered notifications.'))
      })

      it('route playground entry should hide if select stream-based protocols', () => {
        cy.mount(RouteForm, {
          props: {
            config: baseConfigKM,
            routeFlavors: TRADITIONAL_EXPRESSIONS,
            showExpressionsModalEntry: true,
          },
        })

        cy.get('#expressions-tab').click()

        STREAM_BASED_PROTOCOLS.forEach((protocol) => {
          cy.getTestId('route-form-protocols').click({ force: true })
          cy.get(`[data-testid='select-item-${protocol}']`).click()
          cy.getTestId('open-router-playground').should('have.class', 'disabled')
          cy.getTestId('open-router-playground').click()
          cy.get('.router-playground-wrapper').should('not.exist')
        })
      })

      it('route playground entry should show if select http-based protocols', () => {
        cy.mount(RouteForm, {
          props: {
            config: baseConfigKM,
            routeFlavors: TRADITIONAL_EXPRESSIONS,
            showExpressionsModalEntry: true,
          },
        })

        cy.get('#expressions-tab').click()

        HTTP_BASED_PROTOCOLS.forEach((protocol) => {
          cy.getTestId('route-form-protocols').click({ force: true })
          cy.get(`[data-testid='select-item-${protocol}']`).click()
          cy.getTestId('open-router-playground').should('not.have.class', 'disabled')
        })
      })

      it('route playground should have initial expression value', () => {
        cy.mount(RouteForm, {
          props: {
            config: baseConfigKM,
            routeFlavors: TRADITIONAL_EXPRESSIONS,
            showExpressionsModalEntry: true,
          },
        })

        cy.get('#expressions-tab').click()
        cy.get('.monaco-editor').first().as('monacoEditor').click()
        cy.get('@monacoEditor').type('http.path == "/kong"')
        cy.getTestId('open-router-playground').click()
        cy.get('.router-playground > [data-testid="expressions-editor"]').contains('http.path == "/kong"')
      })

      it('should expression updated when save in route playground', () => {
        cy.mount(RouteForm, {
          props: {
            config: baseConfigKM,
            routeFlavors: TRADITIONAL_EXPRESSIONS,
            showExpressionsModalEntry: true,
          },
        })
        cy.get('#expressions-tab').click()
        cy.get('.monaco-editor').first().as('monacoEditor').click()
        cy.get('@monacoEditor').type('http.path == "/kong"')
        cy.getTestId('open-router-playground').click()
        cy.get('.router-playground > [data-testid="expressions-editor"]').type(' && http.method == "GET"')
        cy.getTestId('modal-action-button').click()
        cy.get('@monacoEditor').contains('http.path == "/kong" && http.method == "GET"')
      })
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
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/routes/*`,
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
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/services*`,
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
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/routes/*`,
        },
        {
          statusCode: status,
          body: { ...route, tags: ['tag1', 'tag2'] },
        },
      ).as('updateRoute')
    }

    /**
     * Stub the POST and PATCH requests with mocked responses where `kind` marks the type of route
     * being created/edited. This uses the validation steps that are similar to the backend to simply
     * verify that the mutually exclusive fields are not included.
     */
    const stubCreateEdit = () => {
      const handler: RouteHandler = (req) => {
        const { body } = req

        // only verify mutually exclusive fields
        const hasExpressionsFields = Object.hasOwnProperty.call(body, 'expression')
        const hasTraditionalFields = ['hosts', 'paths', 'headers', 'methods', 'snis', 'sources', 'destinations']
          .some((prop) => Object.hasOwnProperty.call(body, prop))

        req.reply({
          statusCode: 400,
          body: {
            kind: hasExpressionsFields ? 'expr' : hasTraditionalFields ? 'trad' : undefined,
          },
        })
      }

      cy.intercept('POST', `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/routes`, handler).as('createRoute')
      cy.intercept('PUT', `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/routes/*`, handler).as('editRoute')
    }

    // Tests 2 possible RouteFlavors: <not-set>, <trad only>
    for (const routeFlavors of [undefined, TRADITIONAL_ONLY]) {
      const configTabs = `tabs=${formatRouteFlavors(routeFlavors)}`

      it(`should show create form, ${configTabs}`, () => {
        cy.mount(RouteForm, {
          props: {
            config: baseConfigKonnect,
            routeFlavors,
          },
        })

        cy.get('.kong-ui-entities-route-form').should('be.visible')
        cy.get('.kong-ui-entities-route-form form').should('be.visible')

        // button state
        cy.getTestId('route-create-form-cancel').should('be.visible')
        cy.getTestId('route-create-form-submit').should('be.visible')
        cy.getTestId('route-create-form-cancel').should('be.enabled')
        cy.getTestId('route-create-form-submit').should('be.disabled')

        // config tabs is hidden when there is only one tab
        cy.getTestId('route-form-config-tabs')
          .should(routeFlavors?.traditional && routeFlavors?.expressions ? 'be.visible' : 'not.exist')

        // base + base advanced fields
        cy.getTestId('collapse-trigger-content').click()
        cy.getTestId('route-form-name').should('be.visible')
        cy.getTestId('route-form-service-id').should('be.visible')
        cy.getTestId('route-form-tags').should('be.visible')
        cy.getTestId('route-form-protocols').should('be.visible')

        if (routeFlavors?.traditional && routeFlavors?.expressions) {
          // trad + expr 2 tabs
          // switch to trad tab
          cy.get('#traditional-tab').click()
        } // else: we will be on the trad tab by default

        if (routeFlavors?.traditional) {
          // base advanced fields
          cy.getTestId('route-form-http-redirect-status-code').should('be.visible')
          cy.getTestId('route-form-preserve-host').should('be.visible')
          cy.getTestId('route-form-strip-path').should('be.visible')
          cy.getTestId('route-form-request-buffering').should('be.visible')
          cy.getTestId('route-form-response-buffering').should('be.visible')

          // other advanced fields
          cy.getTestId('route-form-path-handling').should('be.visible')
          cy.getTestId('route-form-regex-priority').should('be.visible')

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
          cy.getTestId('get-method-toggle').should('exist')
          cy.getTestId('post-method-toggle').should('exist')
          cy.getTestId('put-method-toggle').should('exist')
          cy.getTestId('custom-method-toggle').should('exist').check({ force: true })
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
          cy.get("[data-testid='select-item-tcp,tls,udp']").click({ force: true })
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
        } // if routeFlavors?.traditional

        if (routeFlavors?.traditional && routeFlavors?.expressions) {
          // trad + expr 2 tabs
          // switch to expr tab
          cy.get('#expressions-tab').click()
        }

        if (routeFlavors?.expressions) {
          // negative: traditional fields should not exist
          cy.getTestId('route-form-path-handling').should('not.exist')
          cy.getTestId('route-form-regex-priority').should('not.exist')
          cy.getTestId('route-form-paths-input-1').should('not.exist')
          cy.get('.route-form-routing-rules-selector-options').should('not.exist')

          // expressions editor
          cy.get('.expression-editor .monaco-editor').should('be.visible')

          // base advanced fields
          cy.getTestId('route-form-http-redirect-status-code').should('be.visible')
          cy.getTestId('route-form-preserve-host').should('be.visible')
          cy.getTestId('route-form-strip-path').should('be.visible')
          cy.getTestId('route-form-request-buffering').should('be.visible')
          cy.getTestId('route-form-response-buffering').should('be.visible')
        } // if routeFlavors?.expressions
      })

      if (!routeFlavors || routeFlavors?.traditional) {
        // only test when there is trad tab
        it(`should correctly handle button state - create traditional, ${configTabs}`, () => {
          interceptKonnectServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKonnect,
              routeFlavors,
            },
          })

          cy.get('.kong-ui-entities-route-form').should('be.visible')

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad + expr 2 tabs
            // switch to trad tab
            cy.get('#traditional-tab').click()
          } // else: we will be on the trad tab by default

          // default button state
          cy.getTestId('route-create-form-cancel').should('be.visible')
          cy.getTestId('route-create-form-submit').should('be.visible')
          cy.getTestId('route-create-form-cancel').should('be.enabled')
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // config tabs is hidden when there is only one tab
          cy.getTestId('route-form-config-tabs')
            .should(routeFlavors?.traditional && routeFlavors?.expressions ? 'be.visible' : 'not.exist')

          // enables save when required fields have values
          // form fields - general
          cy.getTestId('route-form-name').should('be.visible')

          // paths
          cy.getTestId('route-form-paths-input-1').type(route.paths[0])
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-paths-input-1').clear()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // snis
          cy.getTestId('routing-rule-snis').click()
          cy.getTestId('route-form-snis-input-1').type('sni')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-snis-input-1').clear()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // hosts
          cy.getTestId('routing-rule-hosts').click()
          cy.getTestId('route-form-hosts-input-1').type('host')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-hosts-input-1').clear()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // methods and custom methods
          cy.getTestId('routing-rule-methods').click()
          cy.getTestId('get-method-toggle').check({ force: true })
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('get-method-toggle').uncheck({ force: true })
          cy.getTestId('route-create-form-submit').should('be.disabled')
          cy.getTestId('custom-method-toggle').check({ force: true })
          cy.getTestId('route-create-form-submit').should('be.disabled')
          cy.getTestId('route-form-custom-method-input-1').type('castom')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-custom-method-input-1').clear()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // headers
          cy.getTestId('routing-rule-headers').click()
          cy.getTestId('route-form-headers-name-input-1').type(Object.keys(route.headers)[0])
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-headers-name-input-1').clear()
          cy.getTestId('route-form-headers-values-input-1').type(route.headers.Header1[0])
          cy.getTestId('route-create-form-submit').should('be.disabled')

          cy.getTestId('route-form-protocols').click({ force: true })
          cy.get("[data-testid='select-item-tcp,tls,udp']").click({ force: true })

          // sources
          cy.getTestId('routing-rule-sources').click()
          cy.getTestId('route-form-sources-ip-input-1').type('127.0.0.1')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-sources-ip-input-1').clear()
          cy.getTestId('route-form-sources-port-input-1').type('8080')
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // destinations
          cy.getTestId('routing-rule-destinations').click()
          cy.getTestId('route-form-destinations-ip-input-1').type('127.0.0.2')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-destinations-ip-input-1').clear()
          cy.getTestId('route-form-destinations-port-input-1').type('8000')
          cy.getTestId('route-create-form-submit').should('be.disabled')
        })
      } // if !routeFlavors || routeFlavors?.traditional

      if (routeFlavors?.expressions) {
        // only test when there is expr tab
        it(`should correctly handle button state - create expressions, ${configTabs}`, () => {
          interceptKonnectServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKonnect,
              routeFlavors,
            },
          })

          cy.get('.kong-ui-entities-route-form').should('be.visible')

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad + expr 2 tabs
            // switch to expr tab
            cy.get('#expressions-tab').click()
          } // else: we will be on expr tab by default

          // default button state
          cy.getTestId('route-create-form-cancel').should('be.visible')
          cy.getTestId('route-create-form-submit').should('be.visible')
          cy.getTestId('route-create-form-cancel').should('be.enabled')
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // enables save when required fields have values
          // form fields - general
          cy.getTestId('route-form-name').should('be.visible')
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // the editor shows invalid because it is empty
          cy.get('.expression-editor').should('have.class', 'invalid')

          // type a valid expression
          cy.get('.monaco-editor').first().as('monacoEditor').click()
          cy.get('@monacoEditor').type('http.path == "/kong"')

          // it should be no longer invalid
          cy.get('.expression-editor').should('not.have.class', 'invalid')
          // and the submit button is enabled
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'expr')

          // delete the last character
          cy.get('@monacoEditor').type('{backspace}')

          // invalid again
          cy.get('.expression-editor').should('have.class', 'invalid')
          // but the submit button is still enabled because we let the server handle uncaught errors
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'expr')
        })
      } // if routeFlavors?.expressions

      if (!routeFlavors || routeFlavors?.traditional) {
        // only test when there is trad tab
        it(`should show edit form, traditional ${configTabs}`, () => {
          interceptKonnect()
          interceptKonnectServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKonnect,
              routeId: route.id,
              routeFlavors,
            },
          })

          cy.wait('@getRoute')
          cy.wait('@getServices')
          cy.get('.kong-ui-entities-route-form').should('be.visible')

          // button state
          cy.getTestId('route-edit-form-cancel').should('be.visible')
          cy.getTestId('route-edit-form-submit').should('be.visible')
          cy.getTestId('route-edit-form-cancel').should('be.enabled')
          cy.getTestId('route-edit-form-submit').should('be.disabled')

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad tab should be active by default
            cy.get('#traditional-tab').should('have.class', 'active')
          }

          // form fields
          cy.getTestId('route-form-name').should('have.value', route.name)
          cy.getTestId('route-form-service-id').should('have.value', route.service.id)
          cy.getTestId('route-form-tags').should('have.value', route.tags.join(', '))

          cy.getTestId('collapse-trigger-content').click()
          cy.getTestId('route-form-path-handling').should('have.value', route.path_handling)
          cy.getTestId('route-form-regex-priority').should('have.value', route.regex_priority)
          cy.getTestId('route-form-strip-path').should(`${route.strip_path ? '' : 'not.'}be.checked`)
          cy.getTestId('route-form-preserve-host').should(`${route.preserve_host ? '' : 'not.'}be.checked`)

          cy.getTestId('route-form-paths-input-1').should('have.value', route.paths[0])
          cy.getTestId('route-form-paths-input-2').should('have.value', route.paths[1])
          cy.getTestId(`${route.methods[0].toLowerCase()}-method-toggle`).should('be.checked')
          cy.getTestId(`${route.methods[1].toLowerCase()}-method-toggle`).should('be.checked')
          cy.getTestId('route-form-headers-name-input-1').should('have.value', Object.keys(route.headers)[0])
          cy.getTestId('route-form-headers-values-input-1').should('have.value', route.headers.Header1.join(','))

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // switch to expr tab
            cy.get('#expressions-tab').click()
            // should not see the expression editor
            cy.get('.expression-editor').should('not.exist')
            // should be reminded that the route type cannot be changed
            cy.getTestId('route-config-type-immutable-alert').should('contain.text', 'cannot be changed after creation')
          }
        })

        it(`should correctly handle button state - edit traditional, ${configTabs}`, () => {
          interceptKonnect()
          interceptKonnectServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKonnect,
              routeId: route.id,
              routeFlavors,
            },
          })

          cy.wait('@getRoute')
          cy.wait('@getServices')

          cy.get('.kong-ui-entities-route-form').should('be.visible')

          // default button state
          cy.getTestId('route-edit-form-cancel').should('be.visible')
          cy.getTestId('route-edit-form-submit').should('be.visible')
          cy.getTestId('route-edit-form-cancel').should('be.enabled')
          cy.getTestId('route-edit-form-submit').should('be.disabled')

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad tab should be active by default
            cy.get('#traditional-tab').should('have.class', 'active')
          }

          cy.getTestId('routing-rules-warning').should('not.exist')

          // enables save when form has changes
          cy.getTestId('route-form-service-id').click({ force: true })
          cy.get("[data-testid='select-item-2']").click()
          cy.getTestId('route-edit-form-submit').should('be.enabled').click()
          cy.wait('@editRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('remove-methods').click()
          cy.getTestId('remove-paths').first().click()
          cy.getTestId('remove-paths').click()
          cy.getTestId('remove-headers').click()
          cy.getTestId('routing-rules-warning').should('be.visible')
          cy.getTestId('route-edit-form-submit').should('be.disabled')
        })
      } // if !routeFlavors || routeFlavors?.traditional

      if (routeFlavors?.expressions) {
        // only test when there is trad tab
        it(`should show edit form, expressions ${configTabs}`, () => {
          interceptKonnect({ mockData: routeExpressions })
          interceptKonnectServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKonnect,
              routeId: routeExpressions.id,
              routeFlavors,
            },
          })

          cy.wait('@getRoute')
          cy.wait('@getServices')
          cy.get('.kong-ui-entities-route-form').should('be.visible')

          // button state
          cy.getTestId('route-edit-form-cancel').should('be.visible')
          cy.getTestId('route-edit-form-submit').should('be.visible')
          cy.getTestId('route-edit-form-cancel').should('be.enabled')
          cy.getTestId('route-edit-form-submit').should('be.disabled')

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // expr tab should be active by default
            cy.get('#expressions-tab').should('have.class', 'active')
          }

          // form fields
          cy.getTestId('route-form-name').should('have.value', routeExpressions.name)
          cy.getTestId('route-form-service-id').should('have.value', routeExpressions.service.id)
          cy.getTestId('route-form-tags').should('have.value', routeExpressions.tags.join(', '))

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            cy.getTestId('collapse-trigger-content').click()
            // switch to trad tab
            cy.get('#traditional-tab').click()
            // should not see trad fields
            cy.getTestId('route-form-path-handling').should('not.exist')
            cy.getTestId('route-form-regex-priority').should('not.exist')
            // should be reminded that the route type cannot be changed
            cy.getTestId('route-config-type-immutable-alert').should('contain.text', 'cannot be changed after creation')
          }
        })

        it(`should correctly handle button state - edit expressions, ${configTabs}`, () => {
          interceptKonnect({ mockData: routeExpressions })
          interceptKonnectServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKonnect,
              routeId: routeExpressions.id,
              routeFlavors,
            },
          })

          cy.wait('@getRoute')
          cy.wait('@getServices')

          cy.get('.kong-ui-entities-route-form').should('be.visible')

          // default button state
          cy.getTestId('route-edit-form-cancel').should('be.visible')
          cy.getTestId('route-edit-form-submit').should('be.visible')
          cy.getTestId('route-edit-form-cancel').should('be.enabled')
          cy.getTestId('route-edit-form-submit').should('be.disabled')

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad tab should be active by default
            cy.get('#expressions-tab').should('have.class', 'active')
          }

          // enables save when form has changes
          cy.getTestId('route-form-service-id').click({ force: true })
          cy.get("[data-testid='select-item-2']").click()
          cy.getTestId('route-edit-form-submit').should('be.enabled').click()
          cy.wait('@editRoute').then((res) => res.response?.body?.kind).should('eq', 'expr')

          // type a valid expression
          cy.get('.monaco-editor').first().as('monacoEditor').click()
          // delete the last character
          cy.get('@monacoEditor').type('{backspace}')

          // the editor should become invalid
          cy.get('.expression-editor').should('have.class', 'invalid')
          // but the submit button is still enabled because we let the server handle uncaught errors
          cy.getTestId('route-edit-form-submit').should('be.enabled').click()
          cy.wait('@editRoute').then((res) => res.response?.body?.kind).should('eq', 'expr')
        })
      } // if routeFlavors?.expressions

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
        cy.getTestId('route-edit-form-cancel').should('be.visible')
        cy.getTestId('route-edit-form-submit').should('be.visible')
        cy.getTestId('route-edit-form-cancel').should('be.enabled')
        cy.getTestId('route-edit-form-submit').should('be.disabled')
        cy.getTestId('routing-rules-warning').should('not.exist')

        // enables save when form has changes
        cy.getTestId('route-form-service-id').click({ force: true })
        cy.get("[data-testid='select-item-2']").click()
        cy.getTestId('route-edit-form-submit').should('be.enabled')
        cy.getTestId('remove-methods').click()
        cy.getTestId('remove-paths').first().click()
        cy.getTestId('remove-paths').click()
        cy.getTestId('remove-headers').click()
        cy.getTestId('routing-rules-warning').should('be.visible')
        cy.getTestId('route-edit-form-submit').should('be.disabled')
      })

      it('should handle error state - failed to load route', () => {
        interceptKonnectServices()

        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/routes/*`,
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
        cy.getTestId('route-edit-form-cancel').should('not.exist')
        cy.getTestId('route-edit-form-submit').should('not.exist')
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
        cy.getTestId(`select-item-${services[1].id}`).should('be.visible')
        cy.get(`[data-testid="select-item-${services[1].id}"] button`).click()
        cy.getTestId('route-form-service-id').should('have.value', services[1].id)
      })

      it('should handle error state - failed to load services', () => {
        cy.intercept(
          {
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/services*`,
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
        cy.getTestId('collapse-trigger-content').click()
        cy.getTestId('route-form-tags').should('be.visible')

        // service id field should be hidden when serviceId is provided
        cy.getTestId('route-form-service-id').should('not.exist')

        // sections info should be hidden when hideSectionsInfo is true
        cy.get('.form-section-info sticky').should('not.exist')

        // default buttons should be replaced with slotted content
        cy.getTestId('route-create-form-cancel').should('not.exist')
        cy.getTestId('route-create-form-submit').should('not.exist')
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

        cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
          .vm.$emit('submit'))

        cy.wait('@updateRoute')

        cy.get('@onUpdateSpy').should('have.been.calledOnce')
      })

      describe('RoutePlayground', () => {
        beforeEach(() => {
          cy.on('uncaught:exception', err => !err.message.includes('ResizeObserver loop completed with undelivered notifications.'))
        })

        it('route playground entry should hide if select stream-based protocols', () => {
          cy.mount(RouteForm, {
            props: {
              config: baseConfigKonnect,
              routeFlavors: TRADITIONAL_EXPRESSIONS,
              showExpressionsModalEntry: true,
            },
          })

          cy.get('#expressions-tab').click()

          STREAM_BASED_PROTOCOLS.forEach((protocol) => {
            cy.getTestId('route-form-protocols').click({ force: true })
            cy.get(`[data-testid='select-item-${protocol}']`).click()
            cy.getTestId('open-router-playground').should('have.class', 'disabled')
            cy.getTestId('open-router-playground').click()
            cy.get('.router-playground-wrapper').should('not.exist')
          })
        })

        it('route playground entry should show if select http-based protocols', () => {
          cy.mount(RouteForm, {
            props: {
              config: baseConfigKonnect,
              routeFlavors: TRADITIONAL_EXPRESSIONS,
              showExpressionsModalEntry: true,
            },
          })

          cy.get('#expressions-tab').click()

          HTTP_BASED_PROTOCOLS.forEach((protocol) => {
            cy.getTestId('route-form-protocols').click({ force: true })
            cy.get(`[data-testid='select-item-${protocol}']`).click()
            cy.getTestId('open-router-playground').should('not.have.class', 'disabled')
          })
        })

        it('route playground should have initial expression value', () => {
          cy.mount(RouteForm, {
            props: {
              config: baseConfigKonnect,
              routeFlavors: TRADITIONAL_EXPRESSIONS,
              showExpressionsModalEntry: true,
            },
          })

          cy.get('#expressions-tab').click()
          cy.get('.monaco-editor').first().as('monacoEditor').click()
          cy.get('@monacoEditor').type('http.path == "/kong"')
          cy.getTestId('open-router-playground').click()
          cy.get('.router-playground > [data-testid="expressions-editor"]').contains('http.path == "/kong"')
        })

        it('should expression updated when save in route playground', () => {
          cy.mount(RouteForm, {
            props: {
              config: baseConfigKonnect,
              routeFlavors: TRADITIONAL_EXPRESSIONS,
              showExpressionsModalEntry: true,
            },
          })
          cy.get('#expressions-tab').click()
          cy.get('.monaco-editor').first().as('monacoEditor').click()
          cy.get('@monacoEditor').type('http.path == "/kong"')
          cy.getTestId('open-router-playground').click()
          cy.get('.router-playground > [data-testid="expressions-editor"]').type(' && http.method == "GET"')
          cy.getTestId('modal-action-button').click()
          cy.get('@monacoEditor').contains('http.path == "/kong" && http.method == "GET"')
        })
      })
    } // for RouteFlavors[]
  })
})
