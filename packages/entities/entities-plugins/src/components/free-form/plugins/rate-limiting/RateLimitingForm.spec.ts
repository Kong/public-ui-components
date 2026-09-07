import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import RateLimitingForm from './RateLimitingForm.vue'
import schema from '../../../../../fixtures/schemas/rate-limiting'
import { FEATURE_FLAGS } from '../../../../constants'

import type { FormSchema } from '../../../../types/plugins/form-schema'

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

function mountForm(model: Record<string, any> = {}) {
  return mount(defineComponent({
    setup() {
      return () => h(RateLimitingForm, {
        schema: schema as unknown as FormSchema,
        model,
        pluginName: 'rate-limiting',
        isEditing: Object.keys(model).length > 0,
        onFormChange: () => {},
        formSchema: { fields: [] },
        formModel: {},
      })
    },
  }), {
    global: { provide: { [FEATURE_FLAGS.KM_3034_FEATURES_316]: true } },
  })
}

describe('RateLimitingForm', () => {
  it('leads the form with `limit_by`, then the counter key it overrides', () => {
    const wrapper = mountForm()

    const visible = wrapper.get('.ff-default-visible-fields')
    const order = visible.findAll('[data-testid^="ff-config."]')
      .map((el) => el.attributes('data-testid'))

    expect(order[0]).toBe('ff-config.limit_by')
    expect(order[1]).toBe('ff-config.custom_key')
  })

  it('gives `custom_key` its own expression wording', async () => {
    const wrapper = mountForm()

    // Registered through `fieldRenderers`, so it has to render as a field like
    // any other — it lost its input entirely once, when the component it is
    // built from changed what it rendered.
    expect(wrapper.find('[data-testid="ff-config.custom_key"]').exists()).toBe(true)

    const add = wrapper.findAll('[data-testid="ff-expression-add-config.custom_key"]')
    // Exactly one: a second trigger appeared when the field was both placed by
    // the plugin and wrapped by the dispatch.
    expect(add).toHaveLength(1)

    await add[0].trigger('click')

    expect(wrapper.get('[data-testid="ff-expression-config.custom_key"] textarea').attributes('placeholder'))
      .toBe('e.g. principal.metadata.ff_id ? principal.metadata.ff_id : principal.id')
  })

  it('keeps the shared editor on the limits', () => {
    const wrapper = mountForm()

    expect(wrapper.find('[data-testid="ff-expression-add-config.minute"]').exists()).toBe(true)
  })
})
