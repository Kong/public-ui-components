import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { provideEditorStore } from '../flow-editor/store/store'
import { mergeFlowChange } from '../flow-editor/store/helpers'

import type { useEditorStore } from '../flow-editor/store/store'
import type { ConfigNode, DatakitConfig, DatakitPluginData, DatakitUIData } from '../types'

export type EditorStore = ReturnType<typeof useEditorStore>

export interface StoreChange {
  configNodes: ConfigNode[]
  uiData: DatakitUIData
  resources: DatakitConfig['resources']
  partialId?: string
}

/**
 * Create an editor store outside of the editor UI (for Vitest).
 *
 * The store relies on `provide`, so it is created inside a renderless harness component.
 * Every `onChange` emitted by the store is recorded in `changes`.
 */
export function createTestStore(pluginData: DatakitPluginData, options: { isEditing?: boolean } = {}) {
  const changes: StoreChange[] = []
  let store!: EditorStore

  const wrapper = mount(defineComponent({
    setup() {
      store = provideEditorStore(pluginData, {
        isEditing: options.isEditing,
        onChange: (configNodes, uiData, resources, partialId) => {
          changes.push({ configNodes, uiData, resources, partialId })
        },
      })
      return () => null
    },
  }))

  return {
    store,
    changes,
    unmount: () => wrapper.unmount(),
  }
}

/**
 * Serialize the store and merge it into `base`, exactly as the flow editor writes back to the form.
 */
export function toPluginData(store: EditorStore, base: DatakitPluginData): DatakitPluginData {
  return mergeFlowChange(base, store.toConfigNodes(), store.toUIData(), store.toResources())
}
