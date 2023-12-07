import { mount } from 'cypress/vue'
import type { ComponentPublicInstance, App } from 'vue'
import defaultRouter from '../fixtures/routes'
import RouterLink from '../fixtures/RouterLink.vue'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

interface VueError {
  err: unknown
  instance: ComponentPublicInstance | null
  info: string
}

Cypress.Commands.add('getTestId', (dataTestId: string): any => {
  return cy.get(`[data-testid=${dataTestId}]`)
})

Cypress.Commands.add('findTestId', { prevSubject: 'element' }, (subject, dataTestId: string): any => {
  return cy.wrap(subject).find(`[data-testid="${dataTestId}"]`)
})

Cypress.Commands.add('onVueError', (vueError: VueError) => {
  console.error(vueError?.err)

  // Ensure the test fails
  // @ts-ignore
  assert.fail(vueError.err.stack)
})

Cypress.Commands.add('mount', (component, options = {}) => {
  // Setup options object
  options.global = options.global || {}
  options.global.stubs = options.global.stubs || {}
  options.global.stubs.transition = false
  options.global.components = options.global.components || {}
  options.global.plugins = options.global.plugins || []

  // Add plugins
  options.global.plugins.push({
    install(app: App) {
      /**
       * Vue Router instance (mainly for testing <router-link> usage)
       * See `cypress/fixtures/routes.ts` for existing routes, or to add new routes as needed.
       *
       * NOTE: If you enable the route via the line below, you need to comment out the line that
       * registers the RouterLink stub component `options.global.components.RouterLink = RouterLink`.
       *
       * You will then have to ensure that ALL routes referenced by packages
       * with <router-link> or router.push are registered in `cypress/fixtures/routes.ts`.
       *
       * (This is why this is disabled for now)
       *
       */
      if (options.router) {
        app.use(options.router)
      } else {
        options.router = defaultRouter
        options.global.components.RouterLink = RouterLink
      }

      // Kongponents
      app.use(Kongponents)

      // Register error handler
      // TODO: IMPORTANT: if you get a Cypress error in the assertion output, disable this app.config.errorHandler and Cypress will output the actual error
      app.config.errorHandler = (error, instance, info) => {
        cy.onVueError({ err: error, instance, info })
      }
    },
  })

  return mount(component, options)
})
