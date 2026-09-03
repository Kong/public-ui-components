import { afterEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, defineComponent, ref } from 'vue'
import { KButton, KInput } from '@kong/kongponents'
import Form from './Form.vue'
import StringField from './StringField.vue'
import type { FormSchema, StringFieldSchema } from 'src/types/plugins/form-schema'
import { USE_SECRET_INPUT_KEY } from '../../../constants'

const FIELD_NAME = 'name'

function mountStringField(data?: Record<string, unknown>, fieldSchema: StringFieldSchema = { type: 'string' }, useSecretInput = false) {
  const schema: FormSchema = {
    type: 'record',
    fields: [
      { [FIELD_NAME]: fieldSchema },
    ],
  }
  const onChangeSpy = (value: unknown) => onChangeSpy.calls.push(value)
  onChangeSpy.calls = [] as unknown[]

  const Wrapper = defineComponent({
    setup() {
      return () => h(
        Form,
        { schema, data, onChange: onChangeSpy },
        { default: () => h(StringField, { name: FIELD_NAME }) },
      )
    },
  })

  const wrapper = mount(Wrapper, {
    global: {
      components: { KButton, KInput },
      provide: { [USE_SECRET_INPUT_KEY as symbol]: ref(useSecretInput) },
    },
  })

  return { wrapper, onChangeSpy }
}

function lastChange(onChangeSpy: { calls: unknown[] }) {
  return onChangeSpy.calls[onChangeSpy.calls.length - 1]
}

describe('StringField', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should emit null when clearing a field that has no initial value', async () => {
    const { wrapper, onChangeSpy } = mountStringField()

    const input = wrapper.get('input')
    await input.setValue('n')
    expect(lastChange(onChangeSpy)).toEqual({ [FIELD_NAME]: 'n' })

    await input.setValue('')
    expect(lastChange(onChangeSpy)).toEqual({ [FIELD_NAME]: null })
  })

  it('should emit null when clearing a field that has an initial value', async () => {
    const { wrapper, onChangeSpy } = mountStringField({ [FIELD_NAME]: 'Initial Name' })

    const input = wrapper.get('input')
    await input.setValue('')
    expect(lastChange(onChangeSpy)).toEqual({ [FIELD_NAME]: null })
  })

  it('should preserve surrounding whitespace instead of trimming it', async () => {
    const { wrapper, onChangeSpy } = mountStringField()

    const input = wrapper.get('input')
    await input.setValue('  hello  ')
    expect(lastChange(onChangeSpy)).toEqual({ [FIELD_NAME]: '  hello  ' })
  })

  it('should preserve a whitespace-only value instead of coercing it to null', async () => {
    const { wrapper, onChangeSpy } = mountStringField()

    const input = wrapper.get('input')
    await input.setValue('   ')
    expect(lastChange(onChangeSpy)).toEqual({ [FIELD_NAME]: '   ' })
  })

  it('uses the legacy password input for encrypted fields by default', () => {
    const { wrapper } = mountStringField(
      { [FIELD_NAME]: 'super-secret' },
      { type: 'string', encrypted: true },
    )

    expect(wrapper.get('input').attributes('type')).toBe('password')
    expect(wrapper.find('.mask-value-toggle-button').exists()).toBe(true)
    expect(wrapper.find('[data-testid="secret-input-toggle"]').exists()).toBe(false)
  })

  it('uses SecretInput for encrypted fields when opted in and text security is supported', () => {
    vi.stubGlobal('CSS', { supports: () => true })
    const { wrapper } = mountStringField(
      { [FIELD_NAME]: 'super-secret' },
      { type: 'string', encrypted: true },
      true,
    )

    expect(wrapper.get('input').attributes('type')).toBe('text')
    expect(wrapper.find('[data-testid="secret-input-toggle"]').exists()).toBe(true)
  })
})
