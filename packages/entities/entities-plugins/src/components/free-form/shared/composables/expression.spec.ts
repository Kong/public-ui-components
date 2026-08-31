import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Form from '../Form.vue'
import Field from '../Field.vue'
import { EXPRESSIONS_FIELD, toExpressionPath } from './expression'

import type { FormSchema } from '../../../../types/plugins/form-schema'
import type { FormConfig } from '../types'

/** Shaped like rate-limiting's: expressible fields in `config`, twins in `expressions`. */
const schema = {
  type: 'record',
  fields: [
    {
      config: {
        type: 'record',
        required: true,
        fields: [
          { minute: { type: 'number', expressible: true, gt: 0 } },
          { plain: { type: 'number' } },
          { key: { type: 'string', expressible: true } },
          { limit: { type: 'array', expressible: true, elements: { type: 'number' } } },
        ],
      },
    },
    {
      expressions: {
        type: 'record',
        required: false,
        fields: [
          {
            minute: {
              type: 'string',
              len_min: 0,
              len_max: 1024,
              expressible_kong_type: 'number',
              source_field: { type: 'number', gt: 0 },
            },
          },
          {
            key: {
              type: 'string',
              len_min: 0,
              len_max: 1024,
              expressible_kong_type: 'string',
              source_field: { type: 'string' },
            },
          },
          {
            limit: {
              type: 'array',
              elements: {
                type: 'string',
                len_min: 0,
                len_max: 1024,
                expressible_kong_type: 'number',
                source_field: { type: 'number' },
              },
            },
          },
        ],
      },
    },
  ],
} as FormSchema

function mountField(options: {
  name: string
  schema?: FormSchema
  data?: Record<string, unknown>
  config?: FormConfig
}) {
  const onChangeSpy = (value: unknown) => onChangeSpy.calls.push(value)
  onChangeSpy.calls = [] as any[]

  const wrapper = mount(defineComponent({
    setup() {
      return () => h(
        Form,
        {
          schema: options.schema ?? schema,
          data: options.data,
          config: options.config,
          onChange: onChangeSpy,
        },
        { default: () => h(Field, { name: options.name }) },
      )
    },
  }))

  const lastChange = () => onChangeSpy.calls[onChangeSpy.calls.length - 1] as Record<string, any>

  return { wrapper, lastChange }
}

describe('toExpressionPath', () => {
  it('swaps the first segment for the expressions record', () => {
    expect(toExpressionPath('config.minute')).toBe('expressions.minute')
    expect(toExpressionPath('config.redis.host')).toBe('expressions.redis.host')
  })

  it('keeps array indices, so twins stay aligned with their source elements', () => {
    expect(toExpressionPath('config.limit.0')).toBe('expressions.limit.0')
    expect(toExpressionPath('config.limit.12')).toBe('expressions.limit.12')
  })

  it('tolerates the root prefix', () => {
    expect(toExpressionPath('$.config.minute')).toBe('expressions.minute')
  })

  it('has no twin for a field at the root, which nothing mirrors', () => {
    expect(toExpressionPath('minute')).toBeUndefined()
    expect(toExpressionPath('$.minute')).toBeUndefined()
  })

  it('exposes the record name it maps into', () => {
    expect(EXPRESSIONS_FIELD).toBe('expressions')
  })
})

describe('ExpressionField dispatch', () => {
  it('renders the plain value input and the expression as one field', () => {
    const { wrapper } = mountField({ name: 'config.minute' })

    // Both halves, from a single `Field` — the expression is not a second field.
    expect(wrapper.find('[data-testid="ff-config.minute"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="ff-expression-add-config.minute"]').exists()).toBe(true)
  })

  it('picks the value input from the source field\'s own type', () => {
    const number = mountField({ name: 'config.minute' })
    expect(number.wrapper.get('[data-testid="ff-config.minute"]').attributes('type')).toBe('number')

    // A string-typed expressible field must not inherit the number input.
    const string = mountField({ name: 'config.key' })
    expect(string.wrapper.get('[data-testid="ff-config.key"]').attributes('type')).toBe('text')
    expect(string.wrapper.find('[data-testid="ff-expression-add-config.key"]').exists()).toBe(true)
  })

  it('leaves a field with no twin rendering only its value input', () => {
    const { wrapper } = mountField({ name: 'config.plain' })

    expect(wrapper.find('[data-testid="ff-config.plain"]').exists()).toBe(true)
    expect(wrapper.find('[data-expression-for]').exists()).toBe(false)
  })
})

describe('useExpressionField', () => {
  it('writes the expression to the twin path', async () => {
    const { wrapper, lastChange } = mountField({ name: 'config.minute' })

    await wrapper.get('[data-testid="ff-expression-add-config.minute"]').trigger('click')
    await wrapper.get('textarea').setValue('req.size * 2')

    expect(lastChange().expressions).toEqual({ minute: 'req.size * 2' })
    // The plain value is untouched — the expression overrides it, it does not replace the field.
    expect(lastChange().config.minute).toBeNull()
  })

  it('creates the expressions record on first write, having started unset', async () => {
    const { wrapper, lastChange } = mountField({ name: 'config.minute' })

    // `expressions` is never `required`, so it initialises to the empty sentinel.
    expect(lastChange().expressions).toBeNull()

    await wrapper.get('[data-testid="ff-expression-add-config.minute"]').trigger('click')
    await wrapper.get('textarea').setValue('req.size')

    expect(lastChange().expressions).toEqual({ minute: 'req.size' })
  })

  it('unsets the expression when removed', async () => {
    const { wrapper, lastChange } = mountField({
      name: 'config.minute',
      data: { config: { minute: 10, plain: null, limit: [] }, expressions: { minute: 'req.size' } },
    })

    await wrapper.get('[data-testid="ff-expression-remove-config.minute"]').trigger('click')

    expect(lastChange().expressions).toEqual({ minute: null })
    expect(wrapper.find('textarea').exists()).toBe(false)
  })

  it('honours the configured empty sentinel when removed', async () => {
    const { wrapper, lastChange } = mountField({
      name: 'config.minute',
      config: { emptyFieldValue: 'undefined' },
      data: { config: { minute: 10 }, expressions: { minute: 'req.size' } },
    })

    await wrapper.get('[data-testid="ff-expression-remove-config.minute"]').trigger('click')

    expect(lastChange().expressions).toHaveProperty('minute', undefined)
  })

  it('starts expanded when the data already holds an expression', () => {
    const { wrapper } = mountField({
      name: 'config.minute',
      data: { config: { minute: 10 }, expressions: { minute: 'req.size' } },
    })

    expect(wrapper.get('textarea').element.value).toBe('req.size')
    expect(wrapper.find('[data-testid="ff-expression-add-config.minute"]').exists()).toBe(false)
  })

  it('offers no expression for a field the schema does not pair', () => {
    const { wrapper } = mountField({ name: 'config.plain' })

    expect(wrapper.find('[data-testid="ff-expression-config.plain"]').exists()).toBe(false)
  })

  it('offers no expression when the schema declares no expressions record', () => {
    const { wrapper } = mountField({
      name: 'config.minute',
      schema: {
        type: 'record',
        fields: [{
          config: {
            type: 'record',
            required: true,
            fields: [{ minute: { type: 'number', expressible: true } }],
          },
        }],
      } as FormSchema,
    })

    expect(wrapper.find('[data-testid="ff-expression-config.minute"]').exists()).toBe(false)
  })

  it('pairs array elements individually, leaving the others unset', async () => {
    const { wrapper, lastChange } = mountField({
      name: 'config.limit',
      data: { config: { minute: null, plain: null, limit: [10, 20] } },
    })

    // The array itself is expressible only through its elements, so it gets no
    // control of its own.
    expect(wrapper.find('[data-testid="ff-expression-add-config.limit"]').exists()).toBe(false)

    await wrapper.get('[data-testid="ff-expression-add-config.limit.1"]').trigger('click')
    await wrapper.get('textarea').setValue('req.size')

    expect(lastChange().expressions.limit[1]).toBe('req.size')
    expect(lastChange().expressions.limit[0]).toBeUndefined()
  })
})
