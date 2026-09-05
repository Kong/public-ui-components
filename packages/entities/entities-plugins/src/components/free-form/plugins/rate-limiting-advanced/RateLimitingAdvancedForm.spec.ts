import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
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

function mountForm(initialModel: Record<string, any> = {}, expressibleFields = true) {
  const changes: any[] = []
  const model = ref(initialModel)

  const wrapper = mount(defineComponent({
    setup() {
      return () => h(RateLimitingAdvancedForm, {
        schema: schema as unknown as FormSchema,
        model: model.value,
        pluginName: 'rate-limiting-advanced',
        isEditing: Object.keys(model.value).length > 0,
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

  return {
    wrapper,
    lastChange: () => changes[changes.length - 1],
    /** Mirrors a host that hands the emitted value back down as `model`. */
    setModel: (next: Record<string, any>) => {
      model.value = next
    },
  }
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

    // Clearing a row leaves its slot behind, so the array would otherwise be
    // submitted as nothing but empty strings. Unset says the same thing, and
    // matches a plugin that never carried an expression at all.
    expect(lastChange().expressions.limit).toBeUndefined()
  })

  it('keeps a cleared expression cleared once the host echoes the payload back', async () => {
    const { wrapper, lastChange, setModel } = mountForm({
      config: twoLimits,
      expressions: { limit: ['req.size', ''] },
    })

    await wrapper.get('[data-testid="ff-expression-remove-config.limit.0"]').trigger('click')

    // A host that re-passes what the form emitted must be a no-op. It is not
    // when the emitted payload disagrees with the form's own state: the form
    // treats the echo as a real change and re-initializes from it, putting the
    // expression the user just deleted straight back.
    setModel(lastChange())
    await nextTick()
    await nextTick()

    expect(lastChange().expressions.limit).toBeUndefined()
    expect(lastChange().config.limit).toEqual(twoLimits.limit)
  })

  it('leaves the limits untouched when an expression is cleared', async () => {
    const { wrapper, lastChange } = mountForm({
      config: twoLimits,
      expressions: { limit: ['req.size', ''] },
    })

    await wrapper.get('[data-testid="ff-expression-remove-config.limit.0"]').trigger('click')

    // The two arrays are paired but independent: editing one row's expression
    // is not an edit to any limit. Nothing crossed these two before, which is
    // how a payload that silently dropped the limits went unnoticed.
    expect(lastChange().config.limit).toEqual(twoLimits.limit)
    expect(lastChange().config.window_size).toEqual(twoLimits.window_size)
  })

  it('leaves the limits untouched when an expression is typed', async () => {
    const { wrapper, lastChange } = mountForm({ config: twoLimits })

    await wrapper.get('[data-testid="ff-expression-add-config.limit.1"]').trigger('click')
    await wrapper.get('textarea').setValue('principal.metadata.limit')

    expect(lastChange().config.limit).toEqual(twoLimits.limit)
    expect(lastChange().config.window_size).toEqual(twoLimits.window_size)
    expect(lastChange().expressions.limit).toEqual(['', 'principal.metadata.limit'])
  })

  it('keeps the record while any row still holds an expression', async () => {
    const { wrapper, lastChange } = mountForm({
      config: { ...twoLimits, limit: [10, 20, 30], window_size: [60, 120, 180] },
      expressions: { limit: ['req.size', 'other', ''] },
    })

    await wrapper.get('[data-testid="ff-expression-remove-config.limit.0"]').trigger('click')

    expect(lastChange().expressions.limit).toEqual(['', 'other', ''])
  })

  it('gives `custom_key` its own expression wording', async () => {
    const { wrapper } = mountForm({ config: twoLimits })

    expect(wrapper.find('[data-testid="ff-config.custom_key"]').exists()).toBe(true)

    const add = wrapper.findAll('[data-testid="ff-expression-add-config.custom_key"]')
    // Exactly one: the field is registered through `fieldRenderers`, so nothing
    // else may add an editor beside the one it renders.
    expect(add).toHaveLength(1)

    await add[0].trigger('click')

    expect(wrapper.get('[data-testid="ff-expression-config.custom_key"] textarea').attributes('placeholder'))
      .toBe('e.g. principal.metadata.ff_id ? principal.metadata.ff_id : principal.id')
  })

  it('still deletes a null namespace, which the server generates', async () => {
    const { lastChange } = mountForm({ config: twoLimits })

    expect(lastChange().config).not.toHaveProperty('namespace')
  })
})
