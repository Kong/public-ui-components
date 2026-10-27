import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import StandardLayout from './StandardLayout.vue'
import rawSchema from '../../../../fixtures/schemas/rate-limiting'
import { appendEntityChecksFromMetadata, distributeEntityChecks } from '../schema-enhancement'
import ConfigForm from '../components/ConfigForm.vue'

import type { VueWrapper } from '@vue/test-utils'
import type { FormConfig, FormSchema, NamedFieldSchema, RecordFieldSchema, UnionFieldSchema } from '@kong-ui-public/freeform'

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

function mountLayout(
  model: Record<string, unknown> = {},
  options: { schema?: FormSchema, formConfig?: FormConfig } = {},
) {
  const changes: Array<Record<string, unknown>> = []

  const wrapper = mount(defineComponent({
    setup() {
      return () => h(
        StandardLayout,
        {
          schema: options.schema ?? schema,
          model,
          pluginName: 'rate-limiting',
          isEditing: Object.keys(model).length > 0,
          onFormChange: (value: Record<string, unknown>) => changes.push(value),
          formSchema: { fields: [] },
          formModel: {},
          formConfig: options.formConfig,
        },
        { default: () => h(ConfigForm) },
      )
    },
  }))

  return { wrapper, lastChange: (): Record<string, unknown> => changes[changes.length - 1] }
}

function assertTriggerState(wrapper: VueWrapper, field: string, disabled: boolean) {
  const button = wrapper.get(`[data-testid="ff-expression-add-config.${field}"]`).element as HTMLButtonElement
  expect(button.disabled, `expected the config.${field} expression trigger to be ${disabled ? 'disabled' : 'enabled'}`).toBe(disabled)
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

describe('StandardLayout — expression version gating by app mode', () => {
  /**
   * The AI Gateway schema shape (kong-ee aigw-master): the expressible
   * `custom_key` carries its own requirement, and the root `expressions`
   * record is tagged too, so untagged expressible fields inherit a lock.
   * API Gateway schemas look the same minus the annotations.
   *
   * The two modes differ only in what the app passes:
   * - API Gateway apps (gateway-manager, Kong Manager) pass no
   *   `formConfig.minRuntimeVersion` — annotations must be inert.
   * - AI Gateway apps (ai-manager) pass the gateway's `min_runtime_version`,
   *   which is compared against the annotations.
   */
  const taggedSchema = (): FormSchema => {
    const clone = structuredClone(schema)

    const rootRecord = (name: string): RecordFieldSchema => {
      const field = clone.fields.find(entry => name in entry)?.[name]
      if (!field || field.type !== 'record') {
        throw new Error(`test fixture: expected a root '${name}' record`)
      }
      return field
    }

    const target = (record: RecordFieldSchema, name: string): UnionFieldSchema => {
      const field = record.fields.find((entry: NamedFieldSchema) => name in entry)?.[name]
      if (!field) {
        throw new Error(`test fixture: no '${name}' field in record`)
      }
      return field
    }

    target(rootRecord('config'), 'custom_key').min_ai_gateway_version = '2.3'
    rootRecord('expressions').min_ai_gateway_version = '2.3'

    return clone
  }

  it('API Gateway mode: no minRuntimeVersion, annotations are ignored entirely', () => {
    const { wrapper } = mountLayout({}, { schema: taggedSchema() })

    // custom_key is tagged and would lock at this runtime — but API Gateway
    // never supplies one, so nothing gates.
    assertTriggerState(wrapper, 'custom_key', false)
    assertTriggerState(wrapper, 'minute', false)
  })

  it('AI Gateway mode: renders ungated when the gateway satisfies the requirement', () => {
    const { wrapper } = mountLayout(
      {},
      { schema: taggedSchema(), formConfig: { minRuntimeVersion: '2.3' } },
    )

    assertTriggerState(wrapper, 'custom_key', false)
    assertTriggerState(wrapper, 'minute', false)
  })

  it('AI Gateway mode: gates tagged and inheriting fields when the gateway is below the requirement', () => {
    const { wrapper } = mountLayout(
      {},
      { schema: taggedSchema(), formConfig: { minRuntimeVersion: '2.2' } },
    )

    // custom_key: locked through its own annotation...
    assertTriggerState(wrapper, 'custom_key', true)
    // ...minute: no annotation of its own, inherits the root expressions
    // record's lock — the expression feature itself is version-gated.
    assertTriggerState(wrapper, 'minute', true)
    // The value input of an untagged field stays usable even while its
    // expression affordance is locked.
    expect((wrapper.get('[data-testid="ff-config.minute"]').element as HTMLInputElement).disabled).toBe(false)
  })
})
