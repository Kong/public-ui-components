import type { KonnectRouteFormConfig, KongManagerRouteFormConfig, RouteFlavors } from '../types'
import RouteForm from './RouteForm.vue'
import { route, routeExpressions, services } from '../../fixtures/mockData'
import { EntityBaseForm } from '@kong-ui-public/entities-shared'
import type { RouteHandler } from 'cypress/types/net-stubbing'
import { HTTP_BASED_PROTOCOLS, STREAM_BASED_PROTOCOLS } from '@kong-ui-public/expressions'
import { DEFAULT_PROTOCOL } from '../constants'

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

    it('should default to Basic config type with Path, Strip Path, Methods, and Host fields when creating a route', () => {
      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
          routeFlavors: TRADITIONAL_EXPRESSIONS,
        },
      })

      cy.getTestId('route-form-config-type-basic').should('be.checked')

      // Verify fields are present
      cy.getTestId('route-form-paths-input-1').should('be.visible')
      cy.getTestId('route-form-strip-path').should('be.visible')
      cy.getTestId('route-form-methods').should('be.visible')
      cy.getTestId('route-form-hosts-input-1').should('be.visible')

      // Name is prepopulated with pattern "new-route-<timestamp>"
      cy.getTestId('route-form-name').invoke('val').should('match', /^new-route-\d+$/)

      cy.getTestId('add-paths').should('not.exist')
      cy.getTestId('add-hosts').should('not.exist')
    })

    it('should default protocols to https when creating a route', () => {
      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
          routeFlavors: TRADITIONAL_EXPRESSIONS,
        },
      })

      cy.getTestId('route-form-config-type-advanced').click()
      cy.getTestId('route-form-protocols').should('have.value', DEFAULT_PROTOCOL.toUpperCase())
    })

    it('should preserve entered path when switching to Advanced config type and remove additional paths when switching back to Basic', () => {
      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
          routeFlavors: TRADITIONAL_EXPRESSIONS,
        },
      })

      cy.getTestId('route-form-paths-input-1').type('/example-path')
      cy.getTestId('route-form-config-type-advanced').click()
      cy.getTestId('route-form-paths-input-1').should('have.value', '/example-path')

      // Add another path
      cy.getTestId('add-paths').click()
      cy.getTestId('route-form-paths-input-2').type('/another-path')

      cy.getTestId('route-form-config-type-basic').click()
      cy.getTestId('route-form-paths-input-2').should('not.exist')
      cy.getTestId('route-form-paths-input-1').should('have.value', '/example-path')
    })

    it('should default to Advanced config type when editing a route with non-http/https protocol', () => {
      const mockRoute = {
        protocols: ['tcp'],
      }

      interceptKM({ mockData: mockRoute })

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
          routeId: '123',
          routeFlavors: TRADITIONAL_EXPRESSIONS,
        },
      })

      cy.wait('@getRoute')

      cy.getTestId('route-form-config-type-advanced').should('be.checked')
      // trad flavor should be active by default
      cy.getTestId('traditional-option').should('have.class', 'selected')
    })

    it('should default to Advanced config type and Expression Editor segment when editing a route with expression', () => {
      const mockRoute = {
        expression: 'http.method == "GET"',
      }

      interceptKM({ mockData: mockRoute })

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKM,
          routeId: '123',
          routeFlavors: TRADITIONAL_EXPRESSIONS,
        },
      })

      cy.wait('@getRoute')

      cy.getTestId('route-form-config-type-advanced').should('be.checked')
      // expr flavor should be active by default
      cy.getTestId('expressions-option').should('have.class', 'selected')
    })

    // Tests 4 possible RouteFlavors: <not-set>, <trad only>, <expr only>, <trad+expr>
    for (const routeFlavors of [undefined, TRADITIONAL_ONLY, EXPRESSIONS_ONLY, TRADITIONAL_EXPRESSIONS]) {
      const configFlavor = `flavor=${formatRouteFlavors(routeFlavors)}`

      it(`should show create form, ${configFlavor}`, () => {
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

        if (!routeFlavors?.traditional && routeFlavors?.expressions) {
          // only expr flavor
          // basic config type is disabled and advanced is selected
          cy.getTestId('route-form-config-type-basic').should('be.disabled')
          cy.getTestId('route-form-config-type-advanced').should('be.checked')
        }

        // switch to the advanced config type
        cy.getTestId('route-form-config-type-advanced').click()
        // flavor control is hidden when there is only one flavor
        cy.getTestId('route-form-config-flavor')
          .should(routeFlavors?.traditional && routeFlavors?.expressions ? 'be.visible' : 'not.exist')

        // base + base advanced fields
        cy.getTestId('route-form-name').should('be.visible')
        cy.getTestId('route-form-service-id').should('be.visible')
        cy.getTestId('route-form-tags').should('be.visible')
        cy.getTestId('route-form-protocols').should('be.visible')

        if (routeFlavors?.traditional) {
          // base advanced fields
          cy.getTestId('route-form-http-redirect-status-code').should('be.visible')
          cy.getTestId('route-form-preserve-host').should('be.visible')
          cy.getTestId('route-form-strip-path').should('be.visible')
          cy.getTestId('route-form-request-buffering').should('be.visible')
          cy.getTestId('route-form-response-buffering').should('be.visible')

          // other advanced fields
          cy.getTestId('route-form-path-handling').should('not.exist') // path-handling will only be shown when at least one path is added
          cy.getTestId('route-form-regex-priority').should('be.visible')

          // paths
          cy.getTestId('route-form-paths-input-1').should('be.visible')
          cy.getTestId('add-paths').click()
          cy.getTestId('route-form-paths-input-2').should('be.visible')
          cy.getTestId('remove-paths').first().click()
          cy.getTestId('route-form-paths-input-2').should('not.exist')

          cy.getTestId('route-form-paths-input-1').should('be.visible')
          cy.getTestId('remove-paths').first().should('be.disabled')

          // snis
          cy.getTestId('route-form-snis-input-1').should('be.visible')
          cy.getTestId('add-snis').click()
          cy.getTestId('route-form-snis-input-2').should('be.visible')
          cy.getTestId('remove-snis').first().click()
          cy.getTestId('route-form-snis-input-2').should('not.exist')

          // hosts
          cy.getTestId('route-form-hosts-input-1').should('be.visible')
          cy.getTestId('add-hosts').click()
          cy.getTestId('route-form-hosts-input-2').should('be.visible')
          cy.getTestId('remove-hosts').first().click()
          cy.getTestId('route-form-hosts-input-2').should('not.exist')

          // methods and custom methods
          cy.getTestId('route-form-methods').find('.multiselect-trigger').click()
          cy.getTestId('route-form-methods').find('button[value="GET"]').should('be.visible')
          cy.getTestId('route-form-methods').find('button[value="POST"]').should('be.visible')
          cy.getTestId('route-form-methods').find('button[value="PUT"]').should('be.visible')
          cy.getTestId('route-form-methods').findTestId('multiselect-dropdown-input').type('custom')
          cy.getTestId('route-form-methods').find('button[value="add_item"]').click()
          cy.getTestId('route-form-methods').find('.multiselect-selection-badge').should('contain.text', 'custom')
          cy.getTestId('route-form-methods').find('.multiselect-selection-badge').findTestId('badge-dismiss-button').click()
          cy.getTestId('route-form-methods').find('.multiselect-selection-badge').should('not.exist')

          // headers
          cy.getTestId('route-form-headers-name-input-1').should('be.visible')
          cy.getTestId('route-form-headers-values-input-1').should('be.visible')
          cy.getTestId('add-headers').click()
          cy.getTestId('route-form-headers-name-input-2').should('be.visible')
          cy.getTestId('route-form-headers-values-input-2').should('be.visible')
          cy.getTestId('remove-headers').first().click()
          cy.getTestId('route-form-headers-name-input-2').should('not.exist')
          cy.getTestId('route-form-headers-values-input-2').should('not.exist')

          cy.getTestId('route-form-protocols').click({ force: true })
          cy.get("[data-testid='select-item-tcp,tls,udp'] button").click({ force: true })
          cy.getTestId('route-form-paths-input-1').should('not.exist')
          cy.getTestId('route-form-hosts-input-1').should('not.exist')
          cy.getTestId('route-form-methods').should('not.exist')
          cy.getTestId('route-form-headers-name-input-1').should('not.exist')

          // sources
          cy.getTestId('route-form-sources-ip-input-1').should('be.visible')
          cy.getTestId('route-form-sources-port-input-1').should('be.visible')
          cy.getTestId('add-sources').click()
          cy.getTestId('route-form-sources-ip-input-2').should('be.visible')
          cy.getTestId('route-form-sources-port-input-2').should('be.visible')
          cy.getTestId('remove-sources').first().click()
          cy.getTestId('route-form-sources-ip-input-2').should('not.exist')
          cy.getTestId('route-form-sources-port-input-2').should('not.exist')

          // destinations
          cy.getTestId('route-form-destinations-ip-input-1').should('be.visible')
          cy.getTestId('route-form-destinations-port-input-1').should('be.visible')
          cy.getTestId('add-destinations').click()
          cy.getTestId('route-form-destinations-ip-input-2').should('be.visible')
          cy.getTestId('route-form-destinations-port-input-2').should('be.visible')
          cy.getTestId('remove-destinations').first().click()
          cy.getTestId('route-form-destinations-ip-input-2').should('not.exist')
          cy.getTestId('route-form-destinations-port-input-2').should('not.exist')
        }

        if (routeFlavors?.traditional && routeFlavors?.expressions) {
          // trad + expr 2 flavors
          // switch to expr flavor
          cy.getTestId('route-form-config-flavor').findTestId('expressions-option').click()
          cy.getTestId('collapse-trigger-content').click()
        }

        if (routeFlavors?.expressions) {
          // negative: traditional fields should not exist
          cy.getTestId('route-form-path-handling').should('not.exist')
          cy.getTestId('route-form-regex-priority').should('not.exist')
          cy.getTestId('route-form-paths-input-1').should('not.exist')

          // expressions editor
          cy.get('.expression-editor .monaco-editor').should('be.visible')

          // base advanced fields
          cy.getTestId('collapse-trigger-content').click()
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

          cy.getTestId('route-form-config-type-advanced').click()
          cy.getTestId('route-form-config-flavor').findTestId('traditional-option').should('contain.text', 'For traditional routes')
          cy.getTestId('route-form-config-flavor').findTestId('expressions-option').should('contain.text', 'For expressions routes')
        })
      }

      if (!routeFlavors || routeFlavors?.traditional) {
        // only test when there is trad tab
        it(`should correctly handle button state - create traditional, ${configFlavor}`, () => {
          interceptKMServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKM,
              routeFlavors,
            },
          })

          cy.get('.kong-ui-entities-route-form').should('be.visible')
          cy.getTestId('route-form-config-type-advanced').click()

          // default button state
          cy.getTestId('route-create-form-cancel').should('be.visible')
          cy.getTestId('route-create-form-submit').should('be.visible')
          cy.getTestId('route-create-form-cancel').should('be.enabled')
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // flavor control is hidden when there is only one flavor
          cy.getTestId('route-form-config-flavor')
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
          cy.getTestId('route-form-snis-input-1').type('sni')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-snis-input-1').clear()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // hosts
          cy.getTestId('route-form-hosts-input-1').type('host')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-hosts-input-1').clear()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // methods and custom methods
          cy.getTestId('route-form-methods').find('.multiselect-trigger').click()
          cy.getTestId('route-form-methods').find('button[value="GET"]').click()
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-methods').find('.multiselect-selection-badge').findTestId('badge-dismiss-button').click()
          cy.getTestId('route-create-form-submit').should('be.disabled')
          cy.getTestId('route-form-methods').find('.multiselect-trigger').click()
          cy.getTestId('route-form-methods').findTestId('multiselect-dropdown-input').type('custom')
          cy.getTestId('route-form-methods').find('button[value="add_item"]').click()
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-methods').find('.multiselect-selection-badge').findTestId('badge-dismiss-button').click()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // headers
          cy.getTestId('route-form-headers-name-input-1').type(Object.keys(route.headers)[0])
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-headers-name-input-1').clear()
          cy.getTestId('route-form-headers-values-input-1').type(route.headers.Header1[0])
          cy.getTestId('route-create-form-submit').should('be.disabled')

          cy.getTestId('route-form-protocols').click({ force: true })
          cy.get("[data-testid='select-item-tcp,tls,udp'] button").click({ force: true })

          // sources
          cy.getTestId('route-form-sources-ip-input-1').type('127.0.0.1')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-sources-ip-input-1').clear()
          cy.getTestId('route-form-sources-port-input-1').type('8080')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          // destinations
          cy.getTestId('route-form-destinations-ip-input-1').type('127.0.0.2')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-destinations-ip-input-1').clear()
          cy.getTestId('route-form-destinations-port-input-1').type('8000')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')
        })
      } // if !routeFlavors || routeFlavors?.traditional

      if (routeFlavors?.expressions) {
        // only test when there is expr tab
        it(`should correctly handle button state - create expressions, ${configFlavor}`, () => {
          interceptKMServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKM,
              routeFlavors,
            },
          })

          cy.get('.kong-ui-entities-route-form').should('be.visible')
          cy.getTestId('route-form-config-type-advanced').click()

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad + expr 2 flavors
            // switch to expr flavor
            cy.getTestId('route-form-config-flavor').findTestId('expressions-option').click()
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
        it(`should show edit form, traditional ${configFlavor}`, () => {
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
          cy.getTestId('route-form-config-type-advanced').click()

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad flavor should be active by default
            cy.getTestId('traditional-option').should('have.class', 'selected')
          }

          // form fields
          cy.getTestId('route-form-name').should('have.value', route.name)
          cy.getTestId('route-form-service-id').should('have.value', route.service.id)
          cy.getTestId('route-form-tags').should('have.value', route.tags.join(', '))

          cy.getTestId('route-form-path-handling').should('have.value', route.path_handling)
          cy.getTestId('route-form-regex-priority').should('have.value', route.regex_priority)
          cy.getTestId('route-form-strip-path').should(`${route.strip_path ? '' : 'not.'}be.checked`)
          cy.getTestId('route-form-preserve-host').should(`${route.preserve_host ? '' : 'not.'}be.checked`)

          cy.getTestId('route-form-paths-input-1').should('have.value', route.paths[0])
          cy.getTestId('route-form-paths-input-2').should('have.value', route.paths[1])
          cy.getTestId('route-form-methods').find('.selection-badges-container').should('contain.text', route.methods[0])
          cy.getTestId('route-form-methods').find('.selection-badges-container').should('contain.text', route.methods[1])
          cy.getTestId('route-form-headers-name-input-1').should('have.value', Object.keys(route.headers)[0])
          cy.getTestId('route-form-headers-values-input-1').should('have.value', route.headers.Header1.join(','))

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // switch to expr flavor
            cy.getTestId('expressions-option').click()
            // should not see the expression editor
            cy.get('.expression-editor').should('not.exist')
            // should be reminded that the route type cannot be changed
            cy.getTestId('route-config-type-immutable-alert').should('contain.text', 'cannot be changed after creation')
          }
        })

        it(`should correctly handle button state - edit traditional, ${configFlavor}`, () => {
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
          cy.getTestId('route-form-config-type-advanced').click()

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad flavor should be active by default
            cy.getTestId('traditional-option').should('have.class', 'selected')
          }

          // enables save when form has changes
          cy.getTestId('route-form-service-id').click({ force: true })
          cy.get("[data-testid='select-item-2']").scrollIntoView()
          cy.get("[data-testid='select-item-2']").click()
          cy.getTestId('route-edit-form-submit').should('be.enabled').click()
          cy.wait('@editRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-methods').find('.multiselect-trigger').click()
          cy.getTestId('route-form-methods').findTestId('multiselect-clear-icon').click()
          cy.getTestId('remove-paths').first().click()
          cy.getTestId('route-form-paths-input-1').clear()
          cy.getTestId('route-form-headers-name-input-1').clear()
          cy.getTestId('route-form-headers-values-input-1').clear()
          cy.getTestId('route-edit-form-submit').should('be.disabled')
        })
      } // if !routeFlavors || routeFlavors?.traditional

      if (routeFlavors?.expressions) {
        // only test when there is trad tab
        it(`should show edit form, expressions ${configFlavor}`, () => {
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
            // expr flavor should be active by default
            cy.getTestId('expressions-option').should('have.class', 'selected')
          }

          // form fields
          cy.getTestId('route-form-name').should('have.value', routeExpressions.name)
          cy.getTestId('route-form-service-id').should('have.value', routeExpressions.service.id)
          cy.getTestId('route-form-tags').should('have.value', routeExpressions.tags.join(', '))

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // switch to trad tab
            cy.getTestId('traditional-option').click()
            // should not see trad fields
            cy.getTestId('route-form-path-handling').should('not.exist')
            cy.getTestId('route-form-regex-priority').should('not.exist')
            // should be reminded that the route type cannot be changed
            cy.getTestId('route-config-type-immutable-alert').should('contain.text', 'cannot be changed after creation')
          }
        })

        it(`should correctly handle button state - edit expressions, ${configFlavor}`, () => {
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
            // trad flavor should be active by default
            cy.getTestId('expressions-option').should('have.class', 'selected')
            cy.getTestId('route-form-expressions-editor-loader-loading').should('not.exist')
          }

          // enables save when form has changes
          cy.getTestId('route-form-service-id').click({ force: true })
          cy.get("[data-testid='select-item-2']").scrollIntoView()
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

      it(`should handle error state - failed to load route, ${configFlavor}`, () => {
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

      it(`should allow exact match filtering of services, ${configFlavor}`, () => {
        interceptKMServices()

        cy.mount(RouteForm, {
          props: {
            config: baseConfigKM,
            routeFlavors,
          },
        })

        cy.wait('@getServices')
        cy.get('.kong-ui-entities-route-form').should('be.visible')
        cy.getTestId('route-form-config-type-advanced').click()

        // flavor control is hidden when there is only one flavor
        cy.getTestId('route-form-config-flavor')
          .should(routeFlavors?.traditional && routeFlavors?.expressions ? 'be.visible' : 'not.exist')

        // search
        cy.getTestId('route-form-service-id').should('be.visible')
        cy.getTestId('route-form-service-id').type(services[1].name)

        // click kselect item
        cy.getTestId(`select-item-${services[1].id}`).should('be.visible')
        cy.get(`[data-testid="select-item-${services[1].id}"] button`).click()
        cy.getTestId('route-form-service-id').should('have.value', services[1].id)
      })

      it(`should handle error state - failed to load services, ${configFlavor}`, () => {
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

      it(`should correctly render with all props and slot content, ${configFlavor}`, () => {
        cy.mount(RouteForm, {
          props: {
            config: baseConfigKM,
            serviceId: services[0].id,
            hideSectionsInfo: true,
            hideNameField: true,
            routeFlavors,
          },
          slots: {
            'form-actions': '<button data-testid="slotted-cancel-button">Cancel</button><button data-testid="slotted-submit-button">Submit</button>',
          },
        })

        cy.get('.kong-ui-entities-route-form').should('be.visible')
        cy.get('.kong-ui-entities-route-form form').should('be.visible')
        cy.getTestId('route-form-config-type-advanced').click()

        // flavor control is hidden when there is only one flavor
        cy.getTestId('route-form-config-flavor')
          .should(routeFlavors?.traditional && routeFlavors?.expressions ? 'be.visible' : 'not.exist')

        // name field should be hidden when hideNameField is true
        cy.getTestId('route-form-name').should('not.exist')

        // tags field should always be visible
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

      it(`update event should be emitted when Route was edited, ${configFlavor}`, () => {
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
      cy.getTestId('route-form-config-type-advanced').click()

      // flavor control is hidden when there is only one flavor
      cy.getTestId('route-form-config-flavor').should('not.exist')

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

        cy.getTestId('route-form-config-type-advanced').click()
        cy.getTestId('expressions-option').click()

        STREAM_BASED_PROTOCOLS.forEach((protocol) => {
          cy.getTestId('route-form-protocols').click({ force: true })
          cy.get(`[data-testid='select-item-${protocol}'] button`).click()
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

        cy.getTestId('route-form-config-type-advanced').click()
        cy.getTestId('expressions-option').click()

        HTTP_BASED_PROTOCOLS.forEach((protocol) => {
          cy.getTestId('route-form-protocols').click({ force: true })
          cy.get(`[data-testid='select-item-${protocol}'] button`).click()
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

        cy.getTestId('route-form-config-type-advanced').click()
        cy.getTestId('expressions-option').click()
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

        cy.getTestId('route-form-config-type-advanced').click()
        cy.getTestId('expressions-option').click()
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

    it('should default to Basic config type with Path, Strip Path, Methods, and Host fields when creating a route', () => {
      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
          routeFlavors: TRADITIONAL_EXPRESSIONS,
        },
      })

      cy.getTestId('route-form-config-type-basic').should('be.checked')

      // Verify fields are present
      cy.getTestId('route-form-paths-input-1').should('be.visible')
      cy.getTestId('route-form-strip-path').should('be.visible')
      cy.getTestId('route-form-methods').should('be.visible')
      cy.getTestId('route-form-hosts-input-1').should('be.visible')

      // Name is prepopulated with pattern "new-route-<timestamp>"
      cy.getTestId('route-form-name').invoke('val').should('match', /^new-route-\d+$/)

      cy.getTestId('add-paths').should('not.exist')
      cy.getTestId('add-hosts').should('not.exist')
    })

    it('should default protocols to https when creating a route', () => {
      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
          routeFlavors: TRADITIONAL_EXPRESSIONS,
        },
      })

      cy.getTestId('route-form-config-type-advanced').click()
      // the value passed to KSelect is lowercase but somehow the input value is the uppercase label rather than the lowercase value.
      cy.getTestId('route-form-protocols').should('have.value', DEFAULT_PROTOCOL.toUpperCase())
    })

    it('should preserve entered path when switching to Advanced config type and remove additional paths when switching back to Basic', () => {
      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
          routeFlavors: TRADITIONAL_EXPRESSIONS,
        },
      })

      cy.getTestId('route-form-paths-input-1').type('/example-path')
      cy.getTestId('route-form-config-type-advanced').click()
      cy.getTestId('route-form-paths-input-1').should('have.value', '/example-path')

      // Add another path
      cy.getTestId('add-paths').click()
      cy.getTestId('route-form-paths-input-2').type('/another-path')

      cy.getTestId('route-form-config-type-basic').click()
      cy.getTestId('route-form-paths-input-2').should('not.exist')
      cy.getTestId('route-form-paths-input-1').should('have.value', '/example-path')
    })

    it('should default to Advanced config type when editing a route with non-http/https protocol', () => {
      const mockRoute = {
        protocols: ['tcp'],
      }

      interceptKonnect({ mockData: mockRoute })

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
          routeId: '123',
          routeFlavors: TRADITIONAL_EXPRESSIONS,
        },
      })

      cy.wait('@getRoute')

      cy.getTestId('route-form-config-type-advanced').should('be.checked')
      // trad flavor should be active by default
      cy.getTestId('traditional-option').should('have.class', 'selected')
    })

    it('should default to Advanced config type and Expression Editor segment when editing a route with expression', () => {
      const mockRoute = {
        expression: 'http.method == "GET"',
      }

      interceptKonnect({ mockData: mockRoute })

      cy.mount(RouteForm, {
        props: {
          config: baseConfigKonnect,
          routeId: '123',
          routeFlavors: TRADITIONAL_EXPRESSIONS,
        },
      })

      cy.wait('@getRoute')

      cy.getTestId('route-form-config-type-advanced').should('be.checked')
      // expr flavor should be active by default
      cy.getTestId('expressions-option').should('have.class', 'selected')
    })

    // Tests 4 possible RouteFlavors: <not-set>, <trad only>, <expr only>, <trad+expr>
    for (const routeFlavors of [undefined, TRADITIONAL_ONLY, EXPRESSIONS_ONLY, TRADITIONAL_EXPRESSIONS]) {
      const configFlavor = `flavor=${formatRouteFlavors(routeFlavors)}`

      it(`should show create form, ${configFlavor}`, () => {
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

        if (!routeFlavors?.traditional && routeFlavors?.expressions) {
          // only expr flavor
          // basic config type is disabled and advanced is selected
          cy.getTestId('route-form-config-type-basic').should('be.disabled')
          cy.getTestId('route-form-config-type-advanced').should('be.checked')
        }

        // switch to the advanced config type
        cy.getTestId('route-form-config-type-advanced').click()
        // flavor control is hidden when there is only one flavor
        cy.getTestId('route-form-config-flavor')
          .should(routeFlavors?.traditional && routeFlavors?.expressions ? 'be.visible' : 'not.exist')

        // base + base advanced fields
        cy.getTestId('route-form-name').should('be.visible')
        cy.getTestId('route-form-service-id').should('be.visible')
        cy.getTestId('route-form-tags').should('be.visible')
        cy.getTestId('route-form-protocols').should('be.visible')

        if (routeFlavors?.traditional) {
          // base advanced fields
          cy.getTestId('route-form-http-redirect-status-code').should('be.visible')
          cy.getTestId('route-form-preserve-host').should('be.visible')
          cy.getTestId('route-form-strip-path').should('be.visible')
          cy.getTestId('route-form-request-buffering').should('be.visible')
          cy.getTestId('route-form-response-buffering').should('be.visible')

          // other advanced fields
          cy.getTestId('route-form-path-handling').should('not.exist') // path-handling will only be shown when at least one path is added
          cy.getTestId('route-form-regex-priority').should('be.visible')

          // paths
          cy.getTestId('route-form-paths-input-1').should('be.visible')
          cy.getTestId('add-paths').click()
          cy.getTestId('route-form-paths-input-2').should('be.visible')
          cy.getTestId('remove-paths').first().click()
          cy.getTestId('route-form-paths-input-2').should('not.exist')

          cy.getTestId('route-form-paths-input-1').should('be.visible')
          cy.getTestId('remove-paths').first().should('be.disabled')

          // snis
          cy.getTestId('route-form-snis-input-1').should('be.visible')
          cy.getTestId('add-snis').click()
          cy.getTestId('route-form-snis-input-2').should('be.visible')
          cy.getTestId('remove-snis').first().click()
          cy.getTestId('route-form-snis-input-2').should('not.exist')

          // hosts
          cy.getTestId('route-form-hosts-input-1').should('be.visible')
          cy.getTestId('add-hosts').click()
          cy.getTestId('route-form-hosts-input-2').should('be.visible')
          cy.getTestId('remove-hosts').first().click()
          cy.getTestId('route-form-hosts-input-2').should('not.exist')

          // methods and custom methods
          cy.getTestId('route-form-methods').find('.multiselect-trigger').click()
          cy.getTestId('route-form-methods').find('button[value="GET"]').should('be.visible')
          cy.getTestId('route-form-methods').find('button[value="POST"]').should('be.visible')
          cy.getTestId('route-form-methods').find('button[value="PUT"]').should('be.visible')
          cy.getTestId('route-form-methods').findTestId('multiselect-dropdown-input').type('custom')
          cy.getTestId('route-form-methods').find('button[value="add_item"]').click()
          cy.getTestId('route-form-methods').find('.multiselect-selection-badge').should('contain.text', 'custom')
          cy.getTestId('route-form-methods').find('.multiselect-selection-badge').findTestId('badge-dismiss-button').click()
          cy.getTestId('route-form-methods').find('.multiselect-selection-badge').should('not.exist')

          // headers
          cy.getTestId('route-form-headers-name-input-1').should('be.visible')
          cy.getTestId('route-form-headers-values-input-1').should('be.visible')
          cy.getTestId('add-headers').click()
          cy.getTestId('route-form-headers-name-input-2').should('be.visible')
          cy.getTestId('route-form-headers-values-input-2').should('be.visible')
          cy.getTestId('remove-headers').first().click()
          cy.getTestId('route-form-headers-name-input-2').should('not.exist')
          cy.getTestId('route-form-headers-values-input-2').should('not.exist')

          cy.getTestId('route-form-protocols').click({ force: true })
          cy.get("[data-testid='select-item-tcp,tls,udp'] button").click({ force: true })
          cy.getTestId('route-form-paths-input-1').should('not.exist')
          cy.getTestId('route-form-hosts-input-1').should('not.exist')
          cy.getTestId('route-form-methods').should('not.exist')
          cy.getTestId('route-form-headers-name-input-1').should('not.exist')

          // sources
          cy.getTestId('route-form-sources-ip-input-1').should('be.visible')
          cy.getTestId('route-form-sources-port-input-1').should('be.visible')
          cy.getTestId('add-sources').click()
          cy.getTestId('route-form-sources-ip-input-2').should('be.visible')
          cy.getTestId('route-form-sources-port-input-2').should('be.visible')
          cy.getTestId('remove-sources').first().click()
          cy.getTestId('route-form-sources-ip-input-2').should('not.exist')
          cy.getTestId('route-form-sources-port-input-2').should('not.exist')

          // destinations
          cy.getTestId('route-form-destinations-ip-input-1').should('be.visible')
          cy.getTestId('route-form-destinations-port-input-1').should('be.visible')
          cy.getTestId('add-destinations').click()
          cy.getTestId('route-form-destinations-ip-input-2').should('be.visible')
          cy.getTestId('route-form-destinations-port-input-2').should('be.visible')
          cy.getTestId('remove-destinations').first().click()
          cy.getTestId('route-form-destinations-ip-input-2').should('not.exist')
          cy.getTestId('route-form-destinations-port-input-2').should('not.exist')
        } // if routeFlavors?.traditional

        if (routeFlavors?.traditional && routeFlavors?.expressions) {
          // trad + expr 2 flavors
          // switch to expr flavor
          cy.getTestId('route-form-config-flavor').findTestId('expressions-option').click()
          cy.getTestId('collapse-trigger-content').click()
        }

        if (routeFlavors?.expressions) {
          // negative: traditional fields should not exist
          cy.getTestId('route-form-path-handling').should('not.exist')
          cy.getTestId('route-form-regex-priority').should('not.exist')
          cy.getTestId('route-form-paths-input-1').should('not.exist')

          // expressions editor
          cy.get('.expression-editor .monaco-editor').should('be.visible')

          // base advanced fields
          cy.getTestId('collapse-trigger-content').click()
          cy.getTestId('route-form-http-redirect-status-code').should('be.visible')
          cy.getTestId('route-form-preserve-host').should('be.visible')
          cy.getTestId('route-form-strip-path').should('be.visible')
          cy.getTestId('route-form-request-buffering').should('be.visible')
          cy.getTestId('route-form-response-buffering').should('be.visible')
        } // if routeFlavors?.expressions
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

          cy.getTestId('route-form-config-type-advanced').click()
          cy.getTestId('route-form-config-flavor').findTestId('traditional-option').should('contain.text', 'For traditional routes')
          cy.getTestId('route-form-config-flavor').findTestId('expressions-option').should('contain.text', 'For expressions routes')
        })
      }

      if (!routeFlavors || routeFlavors?.traditional) {
        // only test when there is trad tab
        it(`should correctly handle button state - create traditional, ${configFlavor}`, () => {
          interceptKonnectServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKonnect,
              routeFlavors,
            },
          })

          cy.get('.kong-ui-entities-route-form').should('be.visible')
          cy.getTestId('route-form-config-type-advanced').click()

          // default button state
          cy.getTestId('route-create-form-cancel').should('be.visible')
          cy.getTestId('route-create-form-submit').should('be.visible')
          cy.getTestId('route-create-form-cancel').should('be.enabled')
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // flavor control is hidden when there is only one flavor
          cy.getTestId('route-form-config-flavor')
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
          cy.getTestId('route-form-snis-input-1').type('sni')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-snis-input-1').clear()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // hosts
          cy.getTestId('route-form-hosts-input-1').type('host')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-hosts-input-1').clear()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // methods and custom methods
          cy.getTestId('route-form-methods').find('.multiselect-trigger').click()
          cy.getTestId('route-form-methods').find('button[value="GET"]').click()
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-methods').find('.multiselect-selection-badge').findTestId('badge-dismiss-button').click()
          cy.getTestId('route-create-form-submit').should('be.disabled')
          cy.getTestId('route-form-methods').find('.multiselect-trigger').click()
          cy.getTestId('route-form-methods').findTestId('multiselect-dropdown-input').type('custom')
          cy.getTestId('route-form-methods').find('button[value="add_item"]').click()
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-methods').find('.multiselect-selection-badge').findTestId('badge-dismiss-button').click()
          cy.getTestId('route-create-form-submit').should('be.disabled')

          // headers
          cy.getTestId('route-form-headers-name-input-1').type(Object.keys(route.headers)[0])
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-headers-name-input-1').clear()
          cy.getTestId('route-form-headers-values-input-1').type(route.headers.Header1[0])
          cy.getTestId('route-create-form-submit').should('be.disabled')

          cy.getTestId('route-form-protocols').click({ force: true })
          cy.get("[data-testid='select-item-tcp,tls,udp'] button").click({ force: true })

          // sources
          cy.getTestId('route-form-sources-ip-input-1').type('127.0.0.1')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-sources-ip-input-1').clear()
          cy.getTestId('route-form-sources-port-input-1').type('8080')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          // destinations
          cy.getTestId('route-form-destinations-ip-input-1').type('127.0.0.2')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-destinations-ip-input-1').clear()
          cy.getTestId('route-form-destinations-port-input-1').type('8000')
          cy.getTestId('route-create-form-submit').should('be.enabled').click()
          cy.wait('@createRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')
        })
      } // if !routeFlavors || routeFlavors?.traditional

      if (routeFlavors?.expressions) {
        // only test when there is expr tab
        it(`should correctly handle button state - create expressions, ${configFlavor}`, () => {
          interceptKonnectServices()
          stubCreateEdit()

          cy.mount(RouteForm, {
            props: {
              config: baseConfigKonnect,
              routeFlavors,
            },
          })

          cy.get('.kong-ui-entities-route-form').should('be.visible')
          cy.getTestId('route-form-config-type-advanced').click()

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad + expr 2 flavors
            // switch to expr flavor
            cy.getTestId('route-form-config-flavor').findTestId('expressions-option').click()
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
        it(`should show edit form, traditional ${configFlavor}`, () => {
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
          cy.getTestId('route-form-config-type-advanced').click()

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad flavor should be active by default
            cy.getTestId('traditional-option').should('have.class', 'selected')
          }

          // form fields
          cy.getTestId('route-form-name').should('have.value', route.name)
          cy.getTestId('route-form-service-id').should('have.value', route.service.id)
          cy.getTestId('route-form-tags').should('have.value', route.tags.join(', '))

          cy.getTestId('route-form-path-handling').should('have.value', route.path_handling)
          cy.getTestId('route-form-regex-priority').should('have.value', route.regex_priority)
          cy.getTestId('route-form-strip-path').should(`${route.strip_path ? '' : 'not.'}be.checked`)
          cy.getTestId('route-form-preserve-host').should(`${route.preserve_host ? '' : 'not.'}be.checked`)

          cy.getTestId('route-form-paths-input-1').should('have.value', route.paths[0])
          cy.getTestId('route-form-paths-input-2').should('have.value', route.paths[1])
          cy.getTestId('route-form-methods').find('.selection-badges-container').should('contain.text', route.methods[0])
          cy.getTestId('route-form-methods').find('.selection-badges-container').should('contain.text', route.methods[1])
          cy.getTestId('route-form-headers-name-input-1').should('have.value', Object.keys(route.headers)[0])
          cy.getTestId('route-form-headers-values-input-1').should('have.value', route.headers.Header1.join(','))

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // switch to expr flavor
            cy.getTestId('expressions-option').click()
            // should not see the expression editor
            cy.get('.expression-editor').should('not.exist')
            // should be reminded that the route type cannot be changed
            cy.getTestId('route-config-type-immutable-alert').should('contain.text', 'cannot be changed after creation')
          }
        })

        it(`should correctly handle button state - edit traditional, ${configFlavor}`, () => {
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
          cy.getTestId('route-form-config-type-advanced').click()

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // trad flavor should be active by default
            cy.getTestId('traditional-option').should('have.class', 'selected')
          }

          // enables save when form has changes
          cy.getTestId('route-form-service-id').click({ force: true })
          cy.get("[data-testid='select-item-2']").scrollIntoView()
          cy.get("[data-testid='select-item-2']").click()
          cy.getTestId('route-edit-form-submit').should('be.enabled').click()
          cy.wait('@editRoute').then((res) => res.response?.body?.kind).should('eq', 'trad')

          cy.getTestId('route-form-methods').find('.multiselect-trigger').click()
          cy.getTestId('route-form-methods').findTestId('multiselect-clear-icon').click()
          cy.getTestId('remove-paths').first().click()
          cy.getTestId('route-form-paths-input-1').clear()
          cy.getTestId('route-form-headers-name-input-1').clear()
          cy.getTestId('route-form-headers-values-input-1').clear()
          cy.getTestId('route-edit-form-submit').should('be.disabled')
        })
      } // if !routeFlavors || routeFlavors?.traditional

      if (routeFlavors?.expressions) {
        // only test when there is trad tab
        it(`should show edit form, expressions ${configFlavor}`, () => {
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
            // expr flavor should be active by default
            cy.getTestId('expressions-option').should('have.class', 'selected')
          }

          // form fields
          cy.getTestId('route-form-name').should('have.value', routeExpressions.name)
          cy.getTestId('route-form-service-id').should('have.value', routeExpressions.service.id)
          cy.getTestId('route-form-tags').should('have.value', routeExpressions.tags.join(', '))

          if (routeFlavors?.traditional && routeFlavors?.expressions) {
            // switch to trad tab
            cy.getTestId('traditional-option').click()
            // should not see trad fields
            cy.getTestId('route-form-path-handling').should('not.exist')
            cy.getTestId('route-form-regex-priority').should('not.exist')
            // should be reminded that the route type cannot be changed
            cy.getTestId('route-config-type-immutable-alert').should('contain.text', 'cannot be changed after creation')
          }
        })

        it(`should correctly handle button state - edit expressions, ${configFlavor}`, () => {
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
            // trad flavor should be active by default
            cy.getTestId('expressions-option').should('have.class', 'selected')
            cy.getTestId('route-form-expressions-editor-loader-loading').should('not.exist')
          }

          // enables save when form has changes
          cy.getTestId('route-form-service-id').click({ force: true })
          cy.get("[data-testid='select-item-2']").scrollIntoView()
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

      it(`should handle error state - failed to load route, ${configFlavor}`, () => {
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

      it(`should allow exact match filtering of services, ${configFlavor}`, () => {
        interceptKonnectServices()

        cy.mount(RouteForm, {
          props: {
            config: baseConfigKonnect,
            routeFlavors,
          },
        })

        cy.wait('@getServices')
        cy.get('.kong-ui-entities-route-form').should('be.visible')
        cy.getTestId('route-form-config-type-advanced').click()

        // flavor control is hidden when there is only one flavor
        cy.getTestId('route-form-config-flavor')
          .should(routeFlavors?.traditional && routeFlavors?.expressions ? 'be.visible' : 'not.exist')

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

      it(`should correctly render with all props and slot content, ${configFlavor}`, () => {
        cy.mount(RouteForm, {
          props: {
            config: baseConfigKonnect,
            serviceId: services[0].id,
            hideSectionsInfo: true,
            hideNameField: true,
            routeFlavors,
          },
          slots: {
            'form-actions': '<button data-testid="slotted-cancel-button">Cancel</button><button data-testid="slotted-submit-button">Submit</button>',
          },
        })

        cy.get('.kong-ui-entities-route-form').should('be.visible')
        cy.get('.kong-ui-entities-route-form form').should('be.visible')
        cy.getTestId('route-form-config-type-advanced').click()

        // flavor control is hidden when there is only one flavor
        cy.getTestId('route-form-config-flavor')
          .should(routeFlavors?.traditional && routeFlavors?.expressions ? 'be.visible' : 'not.exist')

        // name field should be hidden when hideNameField is true
        cy.getTestId('route-form-name').should('not.exist')

        // tags field should always be visible
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

      it(`update event should be emitted when Route was edited, ${configFlavor}`, () => {
        interceptKonnect()
        interceptUpdate()

        cy.mount(RouteForm, {
          props: {
            config: baseConfigKonnect,
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

        cy.getTestId('route-form-config-type-advanced').click()
        cy.getTestId('expressions-option').click()

        STREAM_BASED_PROTOCOLS.forEach((protocol) => {
          cy.getTestId('route-form-protocols').click({ force: true })
          cy.get(`[data-testid='select-item-${protocol}'] button`).click()
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

        cy.getTestId('route-form-config-type-advanced').click()
        cy.getTestId('expressions-option').click()

        HTTP_BASED_PROTOCOLS.forEach((protocol) => {
          cy.getTestId('route-form-protocols').click({ force: true })
          cy.get(`[data-testid='select-item-${protocol}'] button`).click()
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

        cy.getTestId('route-form-config-type-advanced').click()
        cy.getTestId('expressions-option').click()
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

        cy.getTestId('route-form-config-type-advanced').click()
        cy.getTestId('expressions-option').click()
        cy.get('.monaco-editor').first().as('monacoEditor').click()
        cy.get('@monacoEditor').type('http.path == "/kong"')
        cy.getTestId('open-router-playground').click()
        cy.get('.router-playground > [data-testid="expressions-editor"]').type(' && http.method == "GET"')
        cy.getTestId('modal-action-button').click()
        cy.get('@monacoEditor').contains('http.path == "/kong" && http.method == "GET"')
      })
    })
  })
})
