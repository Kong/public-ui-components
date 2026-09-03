import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Form from '../../shared/Form.vue'
import ObjectField from '../../shared/ObjectField.vue'
import RequestLimitsForm from './RequestLimitsForm.vue'
import schema from '../../../../../fixtures/schemas/rate-limiting-advanced'

import type { FormSchema } from '../../../../types/plugins/form-schema'

function mountRequestLimits(data?: Record<string, unknown>) {
  const onChangeSpy = (value: unknown) => onChangeSpy.calls.push(value)
  onChangeSpy.calls = [] as any[]

  const wrapper = mount(defineComponent({
    setup() {
      return () => h(
        Form,
        { schema: schema as unknown as FormSchema, data, onChange: onChangeSpy },
        {
          // Mirrors `ConfigForm.vue`, which is what gives the form's relative
          // `window_type` name its `config` context.
          default: () => h(
            ObjectField,
            { asChild: true, name: 'config' },
            { default: () => h(RequestLimitsForm) },
          ),
        },
      )
    },
  }))

  const lastChange = () => onChangeSpy.calls[onChangeSpy.calls.length - 1] as Record<string, any>

  return { wrapper, lastChange }
}

const twoLimits = {
  config: {
    window_type: 'sliding',
    limit: [10, 20],
    window_size: [60, 120],
  },
}

describe('RequestLimitsForm (rate-limiting-advanced)', () => {
  describe('window type', () => {
    it('renders the schema\'s options as cards, default first, with descriptions', () => {
      const { wrapper } = mountRequestLimits()

      const radios = wrapper.findAll('input[data-testid^="ff-radio-config.window_type-"]')
      expect(radios).toHaveLength(2)
      // `sliding` is the schema default, so it leads.
      expect(radios[0].attributes('data-testid')).toBe('ff-radio-config.window_type-sliding')
      expect(radios[1].attributes('data-testid')).toBe('ff-radio-config.window_type-fixed')

      expect(wrapper.text()).toContain('Sliding')
      expect(wrapper.text()).toContain('rolling window')
    })
  })

  describe('limits', () => {
    it('shows one row and no remove control when there is a single limit', () => {
      const { wrapper } = mountRequestLimits()

      expect(wrapper.findAll('[data-testid^="ff-config.limit."]')).toHaveLength(1)
      expect(wrapper.find('[data-testid^="rla-form-remove-limit-"]').exists()).toBe(false)
    })

    it('appends a row, growing both paired arrays', async () => {
      const { wrapper, lastChange } = mountRequestLimits()

      await wrapper.get('[data-testid="rla-form-add-limit"]').trigger('click')

      expect(lastChange().config.limit).toHaveLength(2)
      expect(lastChange().config.window_size).toHaveLength(2)
      expect(wrapper.findAll('[data-testid^="rla-form-remove-limit-"]')).toHaveLength(2)
    })

    it('removes a row from both paired arrays', async () => {
      const { wrapper, lastChange } = mountRequestLimits(twoLimits)

      await wrapper.get('[data-testid="rla-form-remove-limit-0"]').trigger('click')

      expect(lastChange().config.limit).toEqual([20])
      expect(lastChange().config.window_size).toEqual([120])
    })
  })

  describe('expressions', () => {
    it('gives every row its own expression, keyed by index', async () => {
      const { wrapper, lastChange } = mountRequestLimits(twoLimits)

      expect(wrapper.findAll('[data-testid^="ff-expression-add-config.limit."]')).toHaveLength(2)

      await wrapper.get('[data-testid="ff-expression-add-config.limit.1"]').trigger('click')
      await wrapper.get('textarea').setValue('req.size * 2')

      expect(lastChange().expressions.limit[1]).toBe('req.size * 2')
    })

    it('supplies its own placeholder, which the shared editor has none of', async () => {
      const { wrapper } = mountRequestLimits(twoLimits)

      await wrapper.get('[data-testid="ff-expression-add-config.limit.0"]').trigger('click')

      expect(wrapper.get('textarea').attributes('placeholder'))
        .toBe('Define an expression for the limit. eg: ‘principal.metadata.60s_custom_rate_limit * 2’')
    })

    it('keeps the expression aligned with its row when a row above is removed', async () => {
      const { wrapper, lastChange } = mountRequestLimits({
        config: { ...twoLimits.config, limit: [10, 20, 30], window_size: [60, 120, 180] },
        expressions: { limit: ['', 'req.size', ''] },
      })

      await wrapper.get('[data-testid="rla-form-remove-limit-0"]').trigger('click')

      // The expression belonged to the second row, which is now the first.
      expect(lastChange().config.limit).toEqual([20, 30])
      expect(lastChange().expressions.limit).toEqual(['req.size', ''])
    })

    it('keeps the expression aligned with its row when a row is appended', async () => {
      const { wrapper, lastChange } = mountRequestLimits({
        config: twoLimits.config,
        expressions: { limit: ['', 'req.size'] },
      })

      await wrapper.get('[data-testid="rla-form-add-limit"]').trigger('click')

      expect(lastChange().config.limit).toHaveLength(3)
      expect(lastChange().expressions.limit).toEqual(['', 'req.size', ''])
    })

    it('leaves the twin array unset while no row has an expression', async () => {
      const { wrapper, lastChange } = mountRequestLimits(twoLimits)

      await wrapper.get('[data-testid="rla-form-add-limit"]').trigger('click')

      // Nothing should fabricate a run of empty slots just because rows exist.
      expect(lastChange().expressions?.limit).toBeUndefined()
    })

    it('closes an open editor when a use case wipes its expression', async () => {
      const { wrapper } = mountRequestLimits({
        config: twoLimits.config,
        expressions: { limit: ['req.size', ''] },
      })

      // Row 0 starts expanded, seeded from the saved expression.
      expect(wrapper.findAll('textarea')).toHaveLength(1)

      await wrapper.findAll('.rla-form-request-limits-examples-badge')[0].trigger('click')

      // The preset replaced the limits and cleared the expressions, so no row
      // should be left showing an editor with nothing in it.
      expect(wrapper.findAll('textarea')).toHaveLength(0)
    })

    it('drops the expressions when a use case replaces the limits', async () => {
      const { wrapper, lastChange } = mountRequestLimits({
        config: twoLimits.config,
        expressions: { limit: ['req.size', ''] },
      })

      const badge = wrapper.findAll('.rla-form-request-limits-examples-badge')[0]
      await badge.trigger('click')

      expect(lastChange().config.limit).toHaveLength(1)
      expect(lastChange().expressions.limit).toBeNull()
    })
  })
})
