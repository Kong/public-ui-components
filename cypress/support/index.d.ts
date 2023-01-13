declare namespace Cypress {
  interface Chainable {
    /**
     * @description Custom alias command for cy.get() to select DOM element by data-testid attribute.
     * @param {string} dataTestId
     * @example cy.dataTestId('kong-auth-login-submit')
     */
    getTestId(dataTestId: string): Chainable<Element>

    /**
     * @description Custom alias command for cy.find() to select DOM element by data-testid attribute.
     * @param {string} dataTestId
     * @example cy.findTestId('kong-auth-login-submit')
     */
    findTestId(dataTestId: string): Chainable<Element>

    /**
     * @description Custom handling for errors thrown by the Vue application.
     * @example cy.onVueError(vueError)
     * @param {{ err: Error; vm: Vue; info: string }} vueError raised error object
     */
    onVueError(vueError: { err: unknown; instance: ComponentPublicInstance | null; info: string }): Chainable

    /**
     * @description Custom command to mount a Vue component inside Cypress browser.
     * @example cy.mount(component, optionsOrProps)
     * @param {any} component target component
     * @param {any} options Options or props
     */
    mount(component: any, options?: any): Chainable
  }
}
