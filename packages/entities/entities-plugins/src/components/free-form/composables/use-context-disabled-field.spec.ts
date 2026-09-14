import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { Form } from '@kong-ui-public/freeform'
import type { FormSchema } from '@kong-ui-public/freeform'
import { useContextDisabledField } from './use-context-disabled-field'

const schema = {
  fields: [
    {
      config: {
        type: 'record',
        required: true,
        fields: [
          { anonymous: { type: 'string', default: 'default-anon-id' } },
          { other: { type: 'string' } },
        ],
      },
    },
  ],
} as unknown as FormSchema

function mountProbe(options: { enabled: boolean, data?: Record<string, unknown> }) {
  const Probe = defineComponent({
    setup() {
      useContextDisabledField('anonymous', ref(options.enabled))
      return () => null
    },
  })

  const wrapper = mount(defineComponent({
    setup() {
      return () => h(
        Form,
        { schema, data: options.data },
        { default: () => h(Probe) },
      )
    },
  }))

  const formVm = wrapper.findComponent(Form as any).vm as any

  return { rawValue: () => formVm.getRawValue() }
}

describe('useContextDisabledField', () => {
  it('leaves a schema-computed default in place when enabled', async () => {
    const { rawValue } = mountProbe({ enabled: true })
    await nextTick()

    expect(rawValue().config.anonymous).toBe('default-anon-id')
  })

  it('strips a schema-computed default when disabled', async () => {
    const { rawValue } = mountProbe({ enabled: false })
    await nextTick()

    expect(rawValue().config.anonymous).toBeUndefined()
  })

  it('leaves real data untouched when disabled, since it is not schema-computed', async () => {
    const { rawValue } = mountProbe({
      enabled: false,
      data: { config: { anonymous: 'real-consumer-id', other: 'x' } },
    })
    await nextTick()

    expect(rawValue().config.anonymous).toBe('real-consumer-id')
  })
})
