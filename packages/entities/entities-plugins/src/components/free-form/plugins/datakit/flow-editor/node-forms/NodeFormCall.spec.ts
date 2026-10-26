import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { KAlert, KCheckbox, KLabel } from '@kong/kongponents'
import { Form } from '@kong-ui-public/freeform'
import type { FormSchema } from '@kong-ui-public/freeform'

import NodeFormCall from './NodeFormCall.vue'
import { provideEditorStore } from '../store/store'
import { FEATURE_FLAGS } from '../../../../../../constants'
import { CONFIRM_MODAL_PROVIDE_KEY } from '../constants'

import type { DatakitPluginData, NodeId } from '../../types'

const callSchema = {
  type: 'record',
  fields: [
    { name: { type: 'string' } },
    { type: { type: 'string' } },
    { url: { type: 'string' } },
    { method: { type: 'string', default: 'GET' } },
    { timeout: { type: 'integer' } },
    { ssl_server_name: { type: 'string' } },
    { ssl_verify: { type: 'boolean', default: true } },
    {
      continue_on_error: {
        type: 'boolean',
        default: false,
        description: 'Whether the node completes and continues the flow after a failed call, instead of stopping the flow with an error.',
      },
    },
    {
      retry: {
        type: 'record',
        required: false,
        fields: [
          { count: { type: 'integer', default: 0, between: [0, 10] } },
          { interval: { type: 'number', default: 0, between: [0, 30] } },
          { status_codes: { type: 'array', required: false, len_min: 1, len_max: 32, elements: { type: 'string' } } },
        ],
      },
    },
  ],
}

const pluginSchema = {
  type: 'record',
  fields: [{
    config: {
      type: 'record',
      fields: [{
        nodes: {
          type: 'array',
          elements: {
            type: 'record',
            fields: [],
            subschema_definitions: { call: callSchema },
          },
        },
      }],
    },
  }],
} as unknown as FormSchema

function mountCallForm({ flag = true, node = {}, otherNodes = [] }: {
  flag?: boolean
  node?: Record<string, unknown>
  otherNodes?: Array<Record<string, unknown>>
} = {}) {
  const pluginData = {
    config: {
      nodes: [{ type: 'call', name: 'CALL', url: 'https://example.com', ...node }, ...otherNodes],
    },
  } as unknown as DatakitPluginData

  let store!: ReturnType<typeof provideEditorStore>

  const Harness = defineComponent({
    setup() {
      store = provideEditorStore(pluginData, { enableCallErrorHandling: flag })
      const nodeId = store.state.value.nodes.find(({ name }) => name === 'CALL')!.id as NodeId
      return () => h(NodeFormCall, { nodeId })
    },
  })

  const wrapper = mount(Form, {
    props: { schema: pluginSchema },
    slots: { default: () => h(Harness) },
    global: {
      provide: {
        [FEATURE_FLAGS.KM_3444_GATEWAY_317]: flag,
        [CONFIRM_MODAL_PROVIDE_KEY]: async () => true,
      },
      components: { KAlert, KCheckbox, KLabel },
      stubs: {
        InputsField: true,
        HttpMethodField: true,
        // `KCopy` needs `ResizeObserver`, which jsdom does not have
        KCopy: { props: ['text'], template: '<span>{{ text }}</span>' },
      },
    },
  })

  const callNode = () => store.state.value.nodes.find(({ name }) => name === 'CALL')!

  return { wrapper, callNode }
}

describe('NodeFormCall', () => {
  describe('feature flag', () => {
    it('hides error handling and the `error` output when the flag is off', () => {
      const { wrapper, callNode } = mountCallForm({ flag: false })

      expect(wrapper.find('[data-testid="ff-continue_on_error"]').exists()).toBe(false)
      expect(wrapper.findTestId('dk-call-retry-toggle').exists()).toBe(false)
      expect(callNode().fields.output.map(({ name }) => name)).not.toContain('error')
    })

    it('shows error handling and the `error` output when the flag is on', () => {
      const { wrapper, callNode } = mountCallForm()

      expect(wrapper.find('[data-testid="ff-continue_on_error"]').exists()).toBe(true)
      expect(wrapper.findTestId('dk-call-retry-toggle').exists()).toBe(true)
      expect(callNode().fields.output.map(({ name }) => name)).toContain('error')
    })
  })

  describe('continue on error', () => {
    it('shows the failure check hint only when enabled', () => {
      expect(mountCallForm().wrapper.findTestId('dk-call-failure-hint').exists()).toBe(false)

      const { wrapper } = mountCallForm({ node: { continue_on_error: true } })
      expect(wrapper.findTestId('dk-call-failure-hint').text())
        .toContain('.error != null or (.status // 0) < 200 or (.status // 0) > 299')
    })

    describe('error output hint', () => {
      const errorConsumer = { type: 'jq', name: 'CHECK', jq: '.error', inputs: { error: 'CALL.error' } }
      const bodyConsumer = { type: 'jq', name: 'CHECK', jq: '.body', inputs: { body: 'CALL.body' } }

      it('shows when the error output is connected but continue on error is off', () => {
        const { wrapper } = mountCallForm({ otherNodes: [errorConsumer] })

        expect(wrapper.findTestId('dk-call-error-output-hint').exists()).toBe(true)
      })

      it('hides when continue on error is on', () => {
        const { wrapper } = mountCallForm({ node: { continue_on_error: true }, otherNodes: [errorConsumer] })

        expect(wrapper.findTestId('dk-call-error-output-hint').exists()).toBe(false)
      })

      it('hides when only other outputs are connected', () => {
        const { wrapper } = mountCallForm({ otherNodes: [bodyConsumer] })

        expect(wrapper.findTestId('dk-call-error-output-hint').exists()).toBe(false)
      })
    })
  })

  describe('retry', () => {
    it('adds the backend defaults when enabled and removes `retry` when disabled', async () => {
      const { wrapper, callNode } = mountCallForm()

      expect(wrapper.find('[data-testid="ff-retry.count"]').exists()).toBe(false)

      await wrapper.getTestId('dk-call-retry-toggle').setValue(true)
      await flushPromises()

      expect(callNode().config.retry).toEqual({ count: 0, interval: 0 })
      expect(wrapper.find('[data-testid="ff-retry.count"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="ff-retry.interval"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="ff-retry.status_codes"]').exists()).toBe(true)

      await wrapper.getTestId('dk-call-retry-toggle').setValue(false)
      await flushPromises()

      expect(callNode().config).not.toHaveProperty('retry')
      expect(wrapper.find('[data-testid="ff-retry.count"]').exists()).toBe(false)
    })

    it('splits comma-separated status codes', async () => {
      const { wrapper, callNode } = mountCallForm({ node: { retry: { count: 3 } } })

      await wrapper.get('[data-testid="ff-retry.status_codes"]').setValue('429, 5xx')

      expect((callNode().config.retry as Record<string, unknown>).status_codes).toEqual(['429', '5xx'])
    })

    it('rejects an invalid status code', async () => {
      const { wrapper } = mountCallForm({ node: { retry: { count: 3 } } })

      const input = wrapper.get('[data-testid="ff-retry.status_codes"]')
      await input.setValue('429, 5XX')
      await input.trigger('blur')

      expect(wrapper.text()).toContain('Retry status codes must be exact codes such as 429, or ranges such as 5xx')
    })

    it.each([
      ['POST', true],
      ['PATCH', true],
      ['GET', false],
      ['PUT', false],
      ['DELETE', false],
    ])('shows the repeat warning for %s: %s', (method, shown) => {
      const { wrapper } = mountCallForm({ node: { method, retry: { count: 3 } } })

      expect(wrapper.findTestId('dk-call-retry-warning').exists()).toBe(shown)
    })

    it('does not show the repeat warning for the default method', () => {
      const { wrapper } = mountCallForm({ node: { retry: { count: 3 } } })

      expect(wrapper.findTestId('dk-call-retry-warning').exists()).toBe(false)
    })
  })
})
