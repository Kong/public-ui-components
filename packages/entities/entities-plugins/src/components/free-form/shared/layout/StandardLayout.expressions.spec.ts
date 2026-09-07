import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import StandardLayout from './StandardLayout.vue'
import rawSchema from '../../../../../fixtures/schemas/rate-limiting'
import { appendEntityChecksFromMetadata, distributeEntityChecks } from '../schema-enhancement'
import ConfigForm from '../../Common/ConfigForm.vue'

import type { FormSchema } from '../../../../types/plugins/form-schema'

/**
 * Regression guard for the layout, not the field.
 *
 * `StandardLayout` filters the plugin schema down to the root fields the
 * freeform engine owns, and picks the model down to the keys it controls. Both
 * lists silently disable every expression control if `expressions` is missing
 * from them, and neither is visible from a test that mounts `Form` directly —
 * which is exactly how this shipped broken once.
 */
// The real form never sees the raw schema: `PluginEntityForm` runs it through
// the same two steps first, which is what moves the plugin's `at_least_one_of`
// into `config` and so decides which fields are default-visible.
const schema = distributeEntityChecks(
  appendEntityChecksFromMetadata('rate-limiting', rawSchema as unknown as FormSchema),
)

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

function mountLayout(model: Record<string, any> = {}) {
  const changes: any[] = []

  const wrapper = mount(defineComponent({
    setup() {
      return () => h(
        StandardLayout,
        {
          schema,
          model,
          pluginName: 'rate-limiting',
          isEditing: Object.keys(model).length > 0,
          onFormChange: (value: any) => changes.push(value),
          formSchema: { fields: [] },
          formModel: {},
        },
        { default: () => h(ConfigForm) },
      )
    },
  }))

  return { wrapper, lastChange: () => changes[changes.length - 1] }
}

const EXPRESSIBLE = ['second', 'minute', 'hour', 'day', 'month', 'year', 'custom_key']

describe('StandardLayout — expression fields', () => {
  it('keeps `expressions` in the schema it hands to the form', () => {
    const { wrapper } = mountLayout()

    for (const field of EXPRESSIBLE) {
      expect(
        wrapper.find(`[data-testid="ff-expression-add-config.${field}"]`).exists(),
        `expected an expression trigger for config.${field}`,
      ).toBe(true)
    }
  })

  it('renders each expressible field once, value input and expression together', () => {
    const { wrapper } = mountLayout()

    for (const field of EXPRESSIBLE) {
      expect(
        wrapper.findAll(`[data-testid="ff-config.${field}"]`).length,
        `expected exactly one value input for config.${field}`,
      ).toBe(1)
    }
  })

  it('loads a saved expression from the model instead of pruning it away', () => {
    const { wrapper } = mountLayout({
      config: { minute: 60, policy: 'local' },
      expressions: { minute: 'req.size * 2' },
    })

    // Seeded and expanded, rather than collapsed behind the trigger.
    expect(wrapper.get('[data-testid="ff-expressions.minute"]').element)
      .toHaveProperty('value', 'req.size * 2')
    expect(wrapper.find('[data-testid="ff-expression-add-config.minute"]').exists()).toBe(false)
  })

  it('emits the expression back out with the rest of the plugin data', async () => {
    const { wrapper, lastChange } = mountLayout()

    await wrapper.get('[data-testid="ff-expression-add-config.minute"]').trigger('click')
    await wrapper.get('[data-testid="ff-expressions.minute"]').setValue('req.size')

    expect(lastChange().expressions).toEqual({ minute: 'req.size' })
  })
})
