import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Form from '../Form.vue'
import Field from '../Field.vue'
import { EXPRESSIONS_FIELD, toExpressionPath } from './expression-paths'

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

  it('shows no placeholder of its own, and none derived from the field', async () => {
    const { wrapper } = mountField({
      name: 'config.minute',
      // A source field with a default, whose placeholder machinery would
      // otherwise offer `Default: 60` as the expression's placeholder.
      schema: {
        type: 'record',
        fields: [
          {
            config: {
              type: 'record',
              required: true,
              fields: [{ minute: { type: 'number', expressible: true, default: 60 } }],
            },
          },
          {
            expressions: {
              type: 'record',
              fields: [{
                minute: {
                  type: 'string',
                  expressible_kong_type: 'number',
                  source_field: { type: 'number', default: 60 },
                },
              }],
            },
          },
        ],
      } as FormSchema,
    })

    await wrapper.get('[data-testid="ff-expression-add-config.minute"]').trigger('click')

    // An example expression is specific to the plugin, so the shared editor
    // offers none — and a value is not an expression, so the field's own
    // default must not stand in for one either.
    expect(wrapper.get('textarea').attributes('placeholder') ?? '').toBe('')
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

  it('prunes the expression of a hidden field, not just its plain value', async () => {
    // Render rules name the source field, so nothing under `expressions` matches
    // one. Left unhandled, hiding the field resets `config.minute` but still
    // submits `expressions.minute`, and the Gateway applies it anyway.
    const onChangeSpy = (value: unknown) => onChangeSpy.calls.push(value)
    onChangeSpy.calls = [] as any[]

    const wrapper = mount(defineComponent({
      setup() {
        return () => h(
          Form,
          {
            schema,
            data: {
              config: { minute: 10, plain: null },
              expressions: { minute: 'req.size' },
            },
            renderRules: { dependencies: { 'config.minute': ['config.plain', 42] } },
            onChange: onChangeSpy,
          },
        )
      },
    }))

    const lastChange = () => onChangeSpy.calls[onChangeSpy.calls.length - 1] as Record<string, any>

    // `config.plain` is not 42, so `config.minute` is hidden.
    await wrapper.get('[data-testid="ff-config.plain"]').setValue('1')

    expect(lastChange().config.minute).toBeNull()
    expect(lastChange().expressions.minute).toBeNull()

    // Visible again: both halves survive.
    await wrapper.get('[data-testid="ff-config.plain"]').setValue('42')

    expect(lastChange().expressions.minute).toBe('req.size')
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

  describe('empty slots in a twin array', () => {
    it('fills the slots before a first expression with empty strings', async () => {
      const { wrapper, lastChange } = mountField({
        name: 'config.limit',
        data: { config: { minute: null, plain: null, limit: [10, 20, 30] } },
      })

      await wrapper.get('[data-testid="ff-expression-add-config.limit.2"]').trigger('click')
      await wrapper.get('textarea').setValue('myinput')

      // Not `[null, null, 'myinput']`: writing an index straight into a missing
      // array leaves holes, and the Gateway rejects a null element outright.
      expect(lastChange().expressions.limit).toEqual(['', '', 'myinput'])
    })

    it('sends a slot for every source element, not just up to the one set', async () => {
      const { wrapper, lastChange } = mountField({
        name: 'config.limit',
        data: { config: { minute: null, plain: null, limit: [10, 20, 30] } },
      })

      await wrapper.get('[data-testid="ff-expression-add-config.limit.0"]').trigger('click')
      await wrapper.get('textarea').setValue('first')

      // Full length, so each expression stays bound to its own pair through the
      // ascending sort the Gateway applies — right-padding is only safe when
      // the source array is already sorted.
      expect(lastChange().expressions.limit).toEqual(['first', '', ''])
    })

    // The Gateway pairs a twin array with its source by position and pads a
    // short one with `''` itself, so a slot with no expression has to hold an
    // empty string — the null sentinel would drop it and shift every later
    // expression onto the wrong limit.
    const twoRows = { config: { minute: null, plain: null, limit: [10, 20] } }

    it('clears an element to an empty string, not the null sentinel', async () => {
      const { wrapper, lastChange } = mountField({
        name: 'config.limit',
        data: { ...twoRows, expressions: { limit: ['req.size', 'other'] } },
      })

      await wrapper.get('[data-testid="ff-expression-remove-config.limit.0"]').trigger('click')

      expect(lastChange().expressions.limit).toEqual(['', 'other'])
    })

    it('keeps the slot when the textarea is emptied', async () => {
      const { wrapper, lastChange } = mountField({
        name: 'config.limit',
        data: { ...twoRows, expressions: { limit: ['req.size', 'other'] } },
      })

      await wrapper.findAll('textarea')[0].setValue('')

      expect(lastChange().expressions.limit).toEqual(['', 'other'])
    })

    it('keeps the record while any one slot still holds an expression', async () => {
      const { wrapper, lastChange } = mountField({
        name: 'config.limit',
        data: { ...twoRows, expressions: { limit: ['req.size', 'other'] } },
      })

      await wrapper.get('[data-testid="ff-expression-remove-config.limit.1"]').trigger('click')

      expect(lastChange().expressions.limit).toEqual(['req.size', ''])
    })

    it('still unsets a scalar twin with the configured sentinel', async () => {
      const { wrapper, lastChange } = mountField({
        name: 'config.minute',
        data: { config: { minute: 10 }, expressions: { minute: 'req.size' } },
      })

      await wrapper.get('[data-testid="ff-expression-remove-config.minute"]').trigger('click')

      // Not `''` — a scalar twin has no slot to hold, so it is genuinely unset.
      expect(lastChange().expressions.minute).toBeNull()
    })
  })

  it('pairs array elements individually', async () => {
    const { wrapper, lastChange } = mountField({
      name: 'config.limit',
      data: { config: { minute: null, plain: null, limit: [10, 20] } },
    })

    // The array itself is expressible only through its elements, so it gets no
    // control of its own.
    expect(wrapper.find('[data-testid="ff-expression-add-config.limit"]').exists()).toBe(false)

    await wrapper.get('[data-testid="ff-expression-add-config.limit.1"]').trigger('click')
    await wrapper.get('textarea').setValue('req.size')

    // The untouched slot holds `''` rather than being absent — see
    // "empty slots in a twin array" above.
    expect(lastChange().expressions.limit).toEqual(['', 'req.size'])
  })
})
