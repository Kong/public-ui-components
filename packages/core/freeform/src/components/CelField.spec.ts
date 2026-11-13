/* eslint-disable vue/one-component-per-file */
import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h, defineComponent } from 'vue'
import Form from './Form.vue'
import CelField from './CelField.vue'
import type { FormSchema } from '../form-schema'

// A stand-in for the Monaco CEL editor, which needs a browser.
vi.mock('./CelInput.vue', async () => {
  // vi.mock is hoisted above the static imports, so the factory imports its own.
  const { defineComponent, h } = await import('vue')
  return {
    // defineAsyncComponent takes `default` only from an ES module.
    __esModule: true,
    default: defineComponent({
      props: { modelValue: { type: String, default: '' }, path: { type: String, default: '' }, disabled: Boolean },
      emits: ['update:modelValue'],
      setup(props, { emit }) {
        return () => h('input', {
          class: 'fake-cel-editor',
          'data-path': props.path,
          disabled: props.disabled,
          value: props.modelValue,
          onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
        })
      },
    }),
  }
})

const FIELD_NAME = 'condition'

async function mountCelField(data?: Record<string, unknown>) {
  const schema: FormSchema = {
    type: 'record',
    fields: [{ [FIELD_NAME]: { type: 'string' } }],
  }
  const changes: unknown[] = []

  const Wrapper = defineComponent({
    setup() {
      return () => h(
        Form,
        { schema, data, onChange: (value: unknown) => changes.push(value) },
        { default: () => h(CelField, { name: FIELD_NAME }) },
      )
    },
  })

  const wrapper = mount(Wrapper)
  // The editor loads asynchronously.
  await flushPromises()

  return { wrapper, lastChange: () => changes[changes.length - 1] }
}

describe('CelField', () => {
  it('renders the CEL editor with the field path', async () => {
    const { wrapper, lastChange } = await mountCelField({ [FIELD_NAME]: 'true' })

    const input = wrapper.get('.fake-cel-editor')
    expect(input.attributes('data-path')).toBe(FIELD_NAME)
    expect((input.element as HTMLInputElement).value).toBe('true')

    await input.setValue('http.method == "GET"')
    expect(lastChange()).toEqual({ [FIELD_NAME]: 'http.method == "GET"' })
  })

  it('writes the empty value when cleared', async () => {
    const { wrapper, lastChange } = await mountCelField({ [FIELD_NAME]: 'true' })

    await wrapper.get('.fake-cel-editor').setValue('')
    expect(lastChange()).toEqual({ [FIELD_NAME]: null })
  })
})
