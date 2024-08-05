import type { mount } from 'cypress/vue'
import type { Router } from 'vue-router'

// add route to mount options
export type MountParams = Parameters<typeof mount>
export type OptionsParam = Exclude<MountParams[1], undefined> & { router?: Router }

// infer the VueWrapper type from the component and options
export type MountedReturnType<C, O = any> =
  (typeof mount) extends ((component: C, options: O) => infer R) ? R : never

export type MountedVueWrapperOf<C, O = any> =
  MountedReturnType<C, O> extends Cypress.Chainable<infer V>
    ? V extends { wrapper: infer W } ? W : never
    : never
