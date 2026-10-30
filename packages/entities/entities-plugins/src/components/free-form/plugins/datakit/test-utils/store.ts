import { expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { provideEditorStore } from '../flow-editor/store/store'
import { findFieldByName, mergeFlowChange } from '../flow-editor/store/helpers'
import { DatakitConfigSchema as DatakitConfigCompatSchema } from '../schema/compat'

import type { useEditorStore } from '../flow-editor/store/store'
import type {
  ConfigNode,
  DatakitConfig,
  DatakitPluginData,
  DatakitUIData,
  FieldId,
  FieldName,
  NodeId,
  NodeName,
} from '../types'

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

/** Look up a node id by name, failing the test if it does not exist. */
export function nodeIdOf(store: EditorStore, name: string): NodeId {
  const node = store.getNodeByName(name as NodeName)
  if (!node) throw new Error(`Node "${name}" not found`)
  return node.id
}

/** Look up a field id by node name and field name, failing the test if it does not exist. */
export function fieldIdOf(store: EditorStore, nodeName: string, io: 'input' | 'output', fieldName: string): FieldId {
  const node = store.getNodeByName(nodeName as NodeName)
  const field = node && findFieldByName(node, io, fieldName as FieldName)
  if (!field) throw new Error(`Field "${nodeName}.${fieldName}" (${io}) not found`)
  return field.id
}

/** Serialized config nodes keyed by name, for concise assertions. */
export function configNodesByName(store: EditorStore): Record<string, ConfigNode> {
  return Object.fromEntries(store.toConfigNodes().map((node) => [node.name, node]))
}

/**
 * Invariants every editor state must satisfy after any operation:
 * - the graph is valid and node names are unique
 * - the output can be reopened in the flow editor (accepted by the compat schema)
 * - reloading the output yields the same output
 */
export function expectConsistent(store: EditorStore) {
  expect(store.validateGraph()).toEqual({ ok: true })

  const names = store.state.value.nodes.map(({ name }) => name)
  expect(new Set(names).size).toBe(names.length)

  const output = toPluginData(store, { config: {} } as DatakitPluginData)
  expect(DatakitConfigCompatSchema.safeParse(output.config).error).toBeUndefined()

  // UI node order carries no meaning, so compare it sorted by name
  const normalize = (data: DatakitPluginData) => ({
    ...data,
    __ui_data: {
      ...data.__ui_data,
      nodes: [...data.__ui_data?.nodes ?? []].sort((a, b) => a.name.localeCompare(b.name)),
    },
  })
  const reloaded = createTestStore(output)
  expect(normalize(toPluginData(reloaded.store, output))).toEqual(normalize(output))
  reloaded.unmount()
}
