/* eslint-disable vue/one-component-per-file */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, defineComponent } from 'vue'
import Form from './Form.vue'
import CelField from './CelField.vue'
import type { FormSchema } from '../form-schema'
import { CEL_INPUT_KEY } from '../constants'

const FIELD_NAME = 'condition'

/** A stand-in for the host's CEL editor. */
const FakeCelEditor = defineComponent({
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
})

function mountCelField(data?: Record<string, unknown>, editor?: typeof FakeCelEditor) {
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

  const wrapper = mount(Wrapper, {
    global: { provide: editor ? { [CEL_INPUT_KEY as symbol]: editor } : {} },
  })

  return { wrapper, lastChange: () => changes[changes.length - 1] }
}

describe('CelField', () => {
  it('renders a textarea without a host editor', async () => {
    const { wrapper, lastChange } = mountCelField()

    const textarea = wrapper.get('textarea')
    await textarea.setValue('consumer.username == "alice"')
    expect(lastChange()).toEqual({ [FIELD_NAME]: 'consumer.username == "alice"' })
  })

  it('renders the host editor with the field path', async () => {
    const { wrapper, lastChange } = mountCelField({ [FIELD_NAME]: 'true' }, FakeCelEditor)

    expect(wrapper.find('textarea').exists()).toBe(false)
    const input = wrapper.get('.fake-cel-editor')
    expect(input.attributes('data-path')).toBe(FIELD_NAME)
    expect((input.element as HTMLInputElement).value).toBe('true')

    await input.setValue('http.method == "GET"')
    expect(lastChange()).toEqual({ [FIELD_NAME]: 'http.method == "GET"' })
  })

  it('writes the empty value when cleared', async () => {
    const { wrapper, lastChange } = mountCelField({ [FIELD_NAME]: 'true' }, FakeCelEditor)

    await wrapper.get('.fake-cel-editor').setValue('')
    expect(lastChange()).toEqual({ [FIELD_NAME]: null })
  })
})
