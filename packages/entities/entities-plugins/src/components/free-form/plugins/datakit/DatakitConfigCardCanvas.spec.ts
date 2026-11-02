import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

import DatakitConfigCardCanvas from './DatakitConfigCardCanvas.vue'
import { useEditorStore } from './flow-editor/store/store'

import type { DatakitPluginData } from './types'

const createPluginSchema = (callFields: Array<Record<string, unknown>>) => ({
  fields: [{
    config: {
      type: 'record',
      fields: [{
        nodes: {
          type: 'array',
          elements: {
            type: 'record',
            fields: [],
            subschema_definitions: { call: { type: 'record', fields: callFields } },
          },
        },
      }],
    },
  }],
})

const CALL_FIELDS = [{ url: { type: 'string' } }]
const CALL_FIELDS_317 = [...CALL_FIELDS, { continue_on_error: { type: 'boolean' } }]

/** Renders the output field names of the `CALL` node from the store the canvas provides. */
const OutputsProbe = defineComponent({
  setup() {
    const { state } = useEditorStore()
    return () => h('div', { 'data-testid': 'call-outputs' },
      state.value.nodes.find(({ name }) => name === 'CALL')!.fields.output.map(({ name }) => name).join(','))
  },
})

function mountCanvas(schema: Record<string, unknown>, otherNodes: Array<Record<string, unknown>> = []) {
  const pluginData = {
    config: {
      nodes: [{ type: 'call', name: 'CALL', url: 'https://example.com' }, ...otherNodes],
    },
  } as unknown as DatakitPluginData

  return mount(DatakitConfigCardCanvas, {
    props: { pluginData, item: {} as any, schema },
    global: {
      stubs: { FlowPanels: OutputsProbe, KLabel: true, ConfigCardItem: true },
    },
  })
}

const callOutputs = (wrapper: ReturnType<typeof mountCanvas>) =>
  wrapper.get('[data-testid="call-outputs"]').text().split(',')

describe('DatakitConfigCardCanvas', () => {
  it('shows the call node `error` output when the schema supports error handling', () => {
    const wrapper = mountCanvas(createPluginSchema(CALL_FIELDS_317))

    expect(callOutputs(wrapper)).toContain('error')
  })

  it('hides an unconnected `error` output when the schema does not support error handling', () => {
    const wrapper = mountCanvas(createPluginSchema(CALL_FIELDS))

    expect(callOutputs(wrapper)).not.toContain('error')
  })

  it('keeps a connected `error` output even when the schema does not support error handling', () => {
    const wrapper = mountCanvas(createPluginSchema(CALL_FIELDS), [
      { type: 'jq', name: 'CHECK', jq: '.error', inputs: { error: 'CALL.error' } },
    ])

    expect(callOutputs(wrapper)).toContain('error')
  })
})
