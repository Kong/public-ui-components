import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref, type Component, type FunctionalComponent } from 'vue'
import { KInput } from '@kong/kongponents'
import { defineCelKind } from '@kong-ui-public/monaco-editor/languages/cel'
import { FIELD_RENDERERS, isExpressionFieldSchema } from '../composables'
import FieldRenderer from './FieldRenderer.vue'
import type { ExpressionFieldSchema, FormSchema } from '../form-schema'
import Form from './Form.vue'
import CelField from './CelField.vue'
import StringField from './StringField.vue'
import EnumField from './EnumField.vue'
import EnhancedInput from './EnhancedInput.vue'
import CelInput from './CelInput.vue'

vi.mock('monaco-editor', () => ({}))
enableAutoUnmount(afterEach)

const kind = defineCelKind([])

describe('CelField', () => {
  it('switches only the selected field and preserves the value across rollout changes', async () => {
    const enabled = ref(false)
    const schema: FormSchema = { type: 'record', fields: [{ condition: { type: 'string' } }] }
    const wrapper = mount(Form, {
      props: { schema, data: { condition: 'true' } },
      slots: { default: () => enabled.value ? h(CelField, { name: 'condition', kind }) : h(StringField, { name: 'condition' }) },
      global: { stubs: { MonacoEditor: true } },
    })
    expect(wrapper.get('input').element.value).toBe('true')
    enabled.value = true
    await nextTick()
    expect(wrapper.getComponent(CelInput).props('kind')).toBe(kind)
    expect(wrapper.findComponent(StringField).exists()).toBe(false)
    expect(wrapper.findComponent(EnhancedInput).exists()).toBe(false)
    wrapper.getComponent(CelInput).vm.$emit('update:modelValue', 'false')
    await nextTick()
    expect(wrapper.emitted('change')?.at(-1)).toEqual([{ condition: 'false' }])
    enabled.value = false
    await nextTick()
    expect(wrapper.get('input').element.value).toBe('false')
    wrapper.unmount()
  })

  it('uses the existing schema type dispatch without guessing field names', () => {
    const schema: FormSchema = { type: 'record', fields: [
      { condition: { type: 'string' } },
      { allow_when: { type: 'string' } },
      { choice: { type: 'string', one_of: ['true', 'false'] } },
    ] }
    const wrapper = mount(Form, {
      props: { schema },
      global: { stubs: { EnumField: true } },
    })
    expect(wrapper.get('[data-testid="ff-condition"]').element.tagName).toBe('INPUT')
    expect(wrapper.get('[data-testid="ff-allow_when"]').element.tagName).toBe('INPUT')
    expect(wrapper.findComponent(CelInput).exists()).toBe(false)
    expect(wrapper.getComponent(EnumField).props('name')).toContain('choice')
    wrapper.unmount()
  })

  it.each(['null', 'undefined'] as const)('commits on blur and clears using the %s empty sentinel', async (emptyFieldValue) => {
    const wrapper = mount(Form, {
      props: {
        schema: { type: 'record', fields: [{ rule: { type: 'string' } }] },
        data: { rule: 'true' },
        config: { updateOnChange: true, emptyFieldValue },
      },
      slots: { default: () => h(CelField, { name: 'rule', kind }) },
      global: { stubs: { MonacoEditor: true } },
    })
    const input = wrapper.getComponent(CelInput)
    input.vm.$emit('update:modelValue', 'false')
    await nextTick()
    expect(wrapper.emitted('change')?.at(-1)).toEqual([{ rule: 'true' }])
    input.vm.$emit('change')
    await nextTick()
    expect(wrapper.emitted('change')?.at(-1)).toEqual([{ rule: 'false' }])
    input.vm.$emit('update:modelValue', '')
    input.vm.$emit('change')
    await nextTick()
    expect(wrapper.emitted('change')?.at(-1)).toEqual([{ rule: emptyFieldValue === 'null' ? null : undefined }])
  })

  it('preserves labels across CEL rollout changes and forwards help and errors', async () => {
    const enabled = ref(true)
    const wrapper = mount(Form, {
      props: { data: { nested: { rule: 'true' } }, schema: { type: 'record', fields: [{ nested: { type: 'record', fields: [
        { rule: { type: 'string', required: true, description: 'Rule description' } },
      ] } }] } },
      slots: { default: () => enabled.value ? h(CelField, { name: '$.nested.rule', kind }) : h(StringField, { name: '$.nested.rule' }) },
      global: { stubs: { MonacoEditor: true } },
    })
    const label = wrapper.getComponent(CelInput).props('label')
    expect(label).toBe('Rule')
    expect(wrapper.getComponent(CelInput).props('required')).toBe(true)
    enabled.value = false
    await nextTick()
    expect(wrapper.getComponent(KInput).props('label')).toBe(label)
    enabled.value = true
    await nextTick()
    expect(wrapper.getComponent(CelInput).props('label')).toBe(label)

    const explicit = mount(Form, {
      props: { schema: { type: 'record', fields: [{ rule: { type: 'string' } }] } },
      slots: { default: () => h(CelField, { name: 'rule', kind, inputId: 'rule-id', error: true, errorMessage: 'Invalid rule' }, {
        tooltip: () => 'Custom tooltip', help: () => 'Custom help',
      }) },
      global: { stubs: { MonacoEditor: true } },
    })
    expect(explicit.getComponent(CelInput).props('id')).toBe('rule-id')
    expect(explicit.text()).toContain('Invalid rule')
    expect(explicit.text()).not.toContain('Custom help')
  })

  it('shows and clears server errors using the shared field error rendering', async () => {
    const wrapper = mount(Form, {
      props: {
        schema: { type: 'record', fields: [{ rule: { type: 'string' } }] },
        errors: [{ path: 'rule', message: 'Invalid CEL expression' }],
      },
      slots: { default: () => h(CelField, { name: 'rule', kind }) },
      global: { stubs: { MonacoEditor: true } },
    })
    await nextTick()
    expect(wrapper.getComponent(CelInput).props('error')).toBe(true)
    expect(wrapper.get('[data-testid="ff-field-errors-rule"]').text()).toBe('Invalid CEL expression')
    await wrapper.setProps({ errors: [] })
    expect(wrapper.getComponent(CelInput).props('error')).toBe(false)
    expect(wrapper.find('[data-testid="ff-field-errors-rule"]').exists()).toBe(false)
  })

  it('preserves version locks and hidden-field behavior', async () => {
    const wrapper = mount(Form, {
      props: {
        schema: { type: 'record', fields: [
          { visible: { type: 'boolean', default: false } },
          { rule: { type: 'string', min_ai_gateway_version: '2.3' } },
        ] },
        data: { visible: false, rule: 'true' },
        config: { minRuntimeVersion: '2.2' },
        renderRules: { dependencies: { rule: ['visible', true] } },
      },
      slots: { default: () => h(CelField, { name: 'rule', kind }) },
      global: { stubs: { MonacoEditor: true } },
    })
    const input = wrapper.getComponent(CelInput)
    expect(input.props('disabled')).toBe(true)
    expect(input.attributes('style')).toContain('display: none')
    const before = wrapper.emitted('change')?.length ?? 0
    input.vm.$emit('update:modelValue', 'false')
    await nextTick()
    expect(wrapper.emitted('change')?.length ?? 0).toBe(before)
  })

  it('normalizes expression array slots when the renderer writes and clears CEL', async () => {
    const schema: FormSchema = { type: 'record', fields: [
      { config: { type: 'record', fields: [{ limit: { type: 'array', expressible: true, elements: { type: 'number' } } }] } },
      { expressions: { type: 'record', fields: [{ limit: { type: 'array', elements: {
        type: 'string', expressible_kong_type: 'number',
      } as ExpressionFieldSchema } }] } },
    ] }
    const ExpressionInput: FunctionalComponent<{ name: string }> = (attrs, { slots }) => h(CelField, { ...attrs, kind }, slots)
    ExpressionInput.inheritAttrs = false
    const wrapper = mount(Form, {
      props: { schema, data: { config: { limit: [10, 20] } } },
      slots: { [FIELD_RENDERERS]: () => h(FieldRenderer, { component: ExpressionInput, match: ({ schema }) => isExpressionFieldSchema(schema) }) },
      global: { stubs: { MonacoEditor: true } },
    })
    expect(wrapper.findComponent(CelInput).exists()).toBe(false)
    await wrapper.get('[data-testid="ff-expression-add-config.limit.1"]').trigger('click')
    const input = wrapper.getComponent(CelInput)
    expect(input.get('.cel-input-help').text()).toContain('number')
    input.vm.$emit('update:modelValue', '30')
    await nextTick()
    expect(wrapper.emitted('change')?.at(-1)).toEqual([{ config: { limit: [10, 20] }, expressions: { limit: ['', '30'] } }])
    input.vm.$emit('update:modelValue', '')
    await nextTick()
    expect(wrapper.emitted('change')?.at(-1)).toEqual([{ config: { limit: [10, 20] }, expressions: { limit: ['', ''] } }])
  })

  it('replaces the expanded expression input only with a registered component', async () => {
    const schema: FormSchema = { type: 'record', fields: [
      { config: { type: 'record', fields: [{ limit: { type: 'number', expressible: true } }] } },
      { expressions: { type: 'record', fields: [{ limit: { type: 'string', expressible_kong_type: 'number' } as ExpressionFieldSchema }] } },
    ] }
    const ExpressionInput: FunctionalComponent<{ name: string }> = (attrs, { slots }) => h(CelField, { ...attrs, kind }, slots)
    ExpressionInput.inheritAttrs = false
    const expand = async (component?: Component) => {
      const wrapper = mount(Form, {
        props: { schema, data: { config: { limit: 10 } } },
        slots: { [FIELD_RENDERERS]: () => [
          // A slot cannot receive the expression's tooltip and help slots, so it never replaces the twin input.
          h(FieldRenderer, { match: ({ schema }) => isExpressionFieldSchema(schema) }, { default: () => h('span', { class: 'slot-renderer' }) }),
          component && h(FieldRenderer, { component, match: ({ schema }) => isExpressionFieldSchema(schema) }),
        ] },
        global: { stubs: { MonacoEditor: true } },
      })
      await wrapper.get('[data-testid="ff-expression-add-config.limit"]').trigger('click')
      expect(wrapper.find('.slot-renderer').exists()).toBe(false)
      return wrapper
    }

    expect((await expand()).get('[data-testid="ff-expressions.limit"]').element.tagName).toBe('TEXTAREA')
    expect((await expand(ExpressionInput)).getComponent(CelInput).get('.cel-input-help').text()).toContain('number')
  })
})
