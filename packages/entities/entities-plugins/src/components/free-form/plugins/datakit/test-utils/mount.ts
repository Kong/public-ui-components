import { defineComponent, h } from 'vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { provideEditorStore } from '../flow-editor/store/store'

import type { Component } from 'vue'
import type { MountingOptions } from '@vue/test-utils'
import type { DatakitPluginData } from '../types'
import type { EditorStore } from './store'

interface MountWithStoreOptions {
  pluginData?: DatakitPluginData
  props?: Record<string, unknown>
  isEditing?: boolean
  global?: MountingOptions<any>['global']
}

/**
 * Mount a flow editor component under a real editor store (for Cypress component tests).
 *
 * Every store `onChange` is recorded by the `@storeChange` spy.
 * Yields the store so tests can assert on its state or serialization.
 */
export function mountWithStore(
  component: Component,
  { pluginData = { config: { nodes: [] } }, props = {}, isEditing = false, global = {} }: MountWithStoreOptions = {},
): Cypress.Chainable<EditorStore> {
  const onChange = cy.spy().as('storeChange')
  let store!: EditorStore

  const Harness = defineComponent({
    setup() {
      store = provideEditorStore(pluginData, { isEditing, onChange })
      return () => h(component, props)
    },
  })

  return cy.mount(Harness, {
    global: {
      ...global,
      provide: {
        [FORMS_CONFIG]: { app: 'konnect' },
        ...global.provide,
      },
    },
  }).then(() => store)
}
