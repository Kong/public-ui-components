import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import PluginConfigurationForm from './layout/PluginConfigurationForm.vue'
import ExpressionField from './ExpressionField.vue'

import type { FormSchema } from '../../../types/plugins/form-schema'

/**
 * An `expressible` field renders as a pair: the plain value, and the expression
 * that can override it on every request. These cover who owns that pair when a
 * plugin customizes the field — the question raised in review on PR #3760.
 */
const schema = {
  fields: [
    {
      config: {
        type: 'record',
        required: true,
        fields: [
          { minute: { type: 'number', expressible: true } },
          { custom_key: { type: 'string', expressible: true } },
        ],
      },
    },
    {
      expressions: {
        type: 'record',
        required: true,
        fields: [
          {
            minute: {
              type: 'string',
              len_min: 0,
              len_max: 1024,
              expressible_kong_type: 'number',
              source_field: { type: 'number' },
            },
          },
          {
            custom_key: {
              type: 'string',
              len_min: 0,
              len_max: 1024,
              expressible_kong_type: 'string',
              source_field: { type: 'string' },
            },
          },
        ],
      },
    },
  ],
} as unknown as FormSchema

function mountForm(fieldRenderers: any[] = []) {
  return mount(PluginConfigurationForm as any, {
    props: {
      schema,
      model: {},
      pluginName: 'probe',
      onFormChange: () => {},
      fieldRenderers,
    },
  })
}

describe('expressible fields', () => {
  it('pairs the value input with an expression, with no plugin code', () => {
    const wrapper = mountForm()

    expect(wrapper.find('[data-testid="ff-config.minute"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="ff-expression-add-config.minute"]').exists()).toBe(true)
  })

  it('hands the whole field, expression included, to a registered renderer', () => {
    const ValueOnly = defineComponent({
      props: { name: { type: String, required: true }, marker: { type: String, default: 'none' } },
      setup: (props) => () => h('div', { 'data-testid': 'value-only' }, props.marker),
    })

    const wrapper = mountForm([{
      match: 'config.minute',
      component: ValueOnly,
      propsOverrides: { marker: 'overridden' },
    }])

    // `propsOverrides` reaches the renderer as usual.
    expect(wrapper.find('[data-testid="value-only"]').text()).toBe('overridden')
    // And the renderer owns the field: nothing appends an expression to it. A
    // renderer that wants one renders `ExpressionField`/`ExpressionEditor`
    // itself — see `CustomKeyField` below, and rate-limiting-advanced's limit
    // rows, which pair each limit with its own editor.
    expect(wrapper.find('[data-testid="ff-expression-add-config.minute"]').exists()).toBe(false)
  })

  it('is usable as a `fieldRenderers` component, configured by `propsOverrides`', () => {
    const wrapper = mountForm([{
      match: 'config.custom_key',
      component: ExpressionField as any,
      propsOverrides: { placeholder: 'e.g. principal.id' },
    }])

    // The field component for an expressible field, registered for one path and
    // configured through `propsOverrides` — the same shape as `datadog`
    // registering `ArrayField` for `config.metrics`.
    expect(wrapper.find('[data-testid="ff-config.custom_key"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="ff-expression-add-config.custom_key"]')).toHaveLength(1)

    // Sibling fields keep the shared editor.
    expect(wrapper.find('[data-testid="ff-expression-add-config.minute"]').exists()).toBe(true)
  })
})
