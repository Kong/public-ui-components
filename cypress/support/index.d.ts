import type { mount, VueWrapper } from 'cypress/vue'
import type { ComponentPublicInstance } from 'vue'
import type { MountedVueWrapperOf } from '../types'

declare global {
  declare namespace Cypress {
    interface Chainable {
      /**
       * @description Custom alias command for cy.get() to select DOM element by data-testid attribute.
       * @param {string} dataTestId
       * @example cy.dataTestId('kong-auth-login-submit')
       */
      getTestId(dataTestId: string): Chainable<JQuery<HTMLElement>>

      /**
       * @description Custom alias command for cy.find() to select DOM element by data-testid attribute.
       * @param {string} dataTestId
       * @example cy.findTestId('kong-auth-login-submit')
       */
      findTestId(dataTestId: string): Chainable<JQuery<HTMLElement>>

      /**
       * @description Custom handling for errors thrown by the Vue application.
       * @example cy.onVueError(vueError)
       * @param {{ err: Error; vm: Vue; info: string }} vueError raised error object
       */
      onVueError(vueError: { err: unknown, instance: ComponentPublicInstance | null, info: string }): Chainable

      /**
       * @description Custom command to mount a Vue component inside Cypress browser.
       * @example cy.mount(component, optionsOrProps)
       * @param {Parameters<typeof mount>[0]} component target component
       * @param {Exclude<Parameters<typeof mount>[1], undefined> & { router?: Router }} [options] Options or props
       */
      mount: typeof mount

      /**
       * @description Custom command to get VueWrapper from Cypress alias
       * @param {'@vueWrapper'} alias
       * @example cy.get('@vueWrapper') // <== this returns a common VueWrapper without Component information
       * @example cy.get<VueWrapper>('@vueWrapper') // <== VueWrapper here is defined by the user, we just pass it to the Chainable
       * @example cy.get<typeof Component>('@vueWrapper') // <== VueWrapper returned by mount(Component) will be inferred
       * @example cy.get<typeof Component, typeof options>('@vueWrapper') // <== VueWrapper returned by mount(Component, options) will be inferred
       */
      get(alias: '@vueWrapper'): Chainable<VueWrapper<ComponentPublicInstance<any>>>
      get<W extends VueWrapper<any>>(alias: '@vueWrapper'): Chainable<W>
      get<Component, Options = any>(alias: '@vueWrapper'): Chainable<MountedVueWrapperOf<Component, Options>>
    }
  }
}
