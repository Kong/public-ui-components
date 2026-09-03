import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import RateLimitingAdvancedForm from './RateLimitingAdvancedForm.vue'
import schema from '../../../../../fixtures/schemas/rate-limiting-advanced'
import { FEATURE_FLAGS } from '../../../../constants'

import type { FormSchema } from '../../../../types/plugins/form-schema'

/**
 * Covers the payload rules the form itself owns in `handleFormChange`, which a
 * spec mounting `RequestLimitsForm` under a bare `Form` never reaches.
 */
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

function mountForm(model: Record<string, any> = {}, expressibleFields = true) {
  const changes: any[] = []

  const wrapper = mount(defineComponent({
    setup() {
      return () => h(RateLimitingAdvancedForm, {
        schema: schema as unknown as FormSchema,
        model,
        pluginName: 'rate-limiting-advanced',
        isEditing: Object.keys(model).length > 0,
        onFormChange: (value: any) => changes.push(value),
        formSchema: { fields: [] },
        formModel: {},
      })
    },
  }), {
    global: {
      provide: { [FEATURE_FLAGS.KM_3034_FEATURES_316]: expressibleFields },
    },
  })

  return { wrapper, lastChange: () => changes[changes.length - 1] }
}

const twoLimits = {
  window_type: 'sliding',
  identifier: 'consumer',
  limit: [10, 20],
  window_size: [60, 120],
}

describe('RateLimitingAdvancedForm — feature gate', () => {
  it('renders no expression controls while the 3.16 flag is off', () => {
    const { wrapper } = mountForm({ config: twoLimits }, false)

    expect(wrapper.findAll('[data-testid^="ff-expression-add-"]')).toHaveLength(0)
    // The plain fields still render on their own.
    expect(wrapper.find('[data-testid="ff-config.limit.0"]').exists()).toBe(true)
  })

  it('renders them once the flag is on', () => {
    const { wrapper } = mountForm({ config: twoLimits }, true)

    expect(wrapper.findAll('[data-testid^="ff-expression-add-"]').length).toBeGreaterThan(0)
  })

  it('still round-trips a saved expression while the flag is off', () => {
    const { lastChange } = mountForm({
      config: twoLimits,
      expressions: { limit: ['req.size', ''] },
    }, false)

    // Withholding the schema hides the controls; it must not clear the data a
    // form that cannot show them is holding.
    expect(lastChange().expressions).toEqual({ limit: ['req.size', ''] })
  })
})

describe('RateLimitingAdvancedForm — emitted payload', () => {
  it('unsets the twin record once no row holds an expression', async () => {
    const { wrapper, lastChange } = mountForm({
      config: twoLimits,
      expressions: { limit: ['req.size', ''] },
    })

    await wrapper.get('[data-testid="ff-expression-remove-config.limit.0"]').trigger('click')

    // Clearing a row leaves its slot behind, so the record would otherwise be
    // submitted as nothing but empty strings.
    expect(lastChange().expressions).toBeNull()
  })

  it('keeps the record while any row still holds an expression', async () => {
    const { wrapper, lastChange } = mountForm({
      config: { ...twoLimits, limit: [10, 20, 30], window_size: [60, 120, 180] },
      expressions: { limit: ['req.size', 'other', ''] },
    })

    await wrapper.get('[data-testid="ff-expression-remove-config.limit.0"]').trigger('click')

    expect(lastChange().expressions.limit).toEqual(['', 'other', ''])
  })

  it('still deletes a null namespace, which the server generates', async () => {
    const { lastChange } = mountForm({ config: twoLimits })

    expect(lastChange().config).not.toHaveProperty('namespace')
  })
})
