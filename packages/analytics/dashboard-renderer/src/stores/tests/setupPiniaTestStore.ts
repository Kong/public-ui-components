import { setActivePinia, createPinia } from 'pinia'
import { createApp } from 'vue'
import type { App } from 'vue'

interface SetupPiniaTestStoreOptions {
  /** Should a Vue app be created and initialized? */
  createVueApp?: boolean
}

/**
 * Set up the Pinia test store instance for the given runner (Cypress or Vitest).
 * @param {'cy.spy' | 'vi.fn} createSpy The test runner your spec file is using.
 * @param {TestingOptions} config @pinia/testing options https://pinia.vuejs.org/api/@pinia/testing/interfaces/TestingOptions.html
 */
export const setupPiniaTestStore = (options?: SetupPiniaTestStoreOptions) => {
  let app: App
  const pinia = createPinia()
  if (options?.createVueApp) {
    app = createApp({})
    app.use(pinia)
  }
  setActivePinia(pinia)
}
