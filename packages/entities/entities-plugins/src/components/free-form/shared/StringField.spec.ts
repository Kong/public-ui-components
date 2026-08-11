import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, defineComponent } from 'vue'
import Form from './Form.vue'
import StringField from './StringField.vue'
import type { FormSchema } from 'src/types/plugins/form-schema'

const FIELD_NAME = 'name'

const schema: FormSchema = {
  type: 'record',
  fields: [
    { [FIELD_NAME]: { type: 'string' } },
  ],
}

function mountStringField(data?: Record<string, unknown>) {
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

  const wrapper = mount(Wrapper)

  return { wrapper, onChangeSpy }
}

function lastChange(onChangeSpy: { calls: unknown[] }) {
  return onChangeSpy.calls[onChangeSpy.calls.length - 1]
}

describe('StringField', () => {
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
})
