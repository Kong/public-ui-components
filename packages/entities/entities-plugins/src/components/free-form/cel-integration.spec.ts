import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KTabs } from '@kong/kongponents'
import PluginEntityForm from '../PluginEntityForm.vue'
import { FEATURE_FLAGS } from '../../constants'
import schema from '../../../fixtures/schemas/acl'
import { CelInput, Form } from '@kong-ui-public/freeform'
import { getCelSuggestions } from '@kong-ui-public/monaco-editor/languages/cel'
import type { FormSchema, RecordFieldSchema } from '@kong-ui-public/freeform'

enableAutoUnmount(afterEach)
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})
afterEach(() => vi.unstubAllGlobals())

const config = { app: 'konnect' as const, apiBaseUrl: '', controlPlaneId: 'cp' }
const global = {
  components: { KTabs },
  provide: { [FEATURE_FLAGS.KM_PLUGINS_CEL_EXPRESSION_EDITOR]: true },
  stubs: { VaultSecretPicker: true, MonacoEditor: true },
}

describe('plugin form CEL rollout', () => {
  it.each(['acl', 'cloned-acl'])('switches %s rows together and loads only host-provided subjects', async (pluginName) => {
    const enabled = ref(false)
    const getCelSubjects = vi.fn().mockResolvedValue({ consumerGroups: [{ id: 'g', name: 'team' }] })
    const wrapper = mount(PluginEntityForm, {
      props: {
        config: { app: 'konnect', apiBaseUrl: '', controlPlaneId: 'cp', getCelSubjects },
        pluginName,
        ...(pluginName === 'cloned-acl' && { sourcePlugin: 'acl' }),
        rawSchema: schema,
        record: { config: { allow_when: ['true', 'false'] } },
      },
      global: {
        provide: { [FEATURE_FLAGS.KM_PLUGINS_CEL_EXPRESSION_EDITOR]: enabled },
        stubs: { VaultSecretPicker: true, MonacoEditor: true },
      },
    })

    try {
      const row = () => wrapper.get('[data-testid="ff-config.allow_when.0"]')
      expect(row().element.tagName).toBe('TEXTAREA')
      expect(getCelSubjects).not.toHaveBeenCalled()
      enabled.value = true
      await vi.waitFor(() => expect(wrapper.findAll('.cel-input')).toHaveLength(2))
      await flushPromises()
      expect(getCelSubjects).toHaveBeenCalledTimes(1)
      expect(row().classes()).toContain('cel-input')
      expect(wrapper.find('[data-testid="ff-condition"]').exists()).toBe(false)

      enabled.value = false
      await flushPromises()
      expect(row().element.tagName).toBe('TEXTAREA')
      expect((row().element as HTMLTextAreaElement).value).toBe('true')
    } finally {
      wrapper.unmount()
      vi.unstubAllGlobals()
    }
  })

  it('does not turn similarly named backend fields in a custom plugin into CEL inputs', () => {
    const wrapper = mount(PluginEntityForm, {
      props: { config, pluginName: 'custom-plugin', rawSchema: schema, record: { config: { allow_when: ['true'] } } },
      global,
    })
    expect(wrapper.find('.cel-input').exists()).toBe(false)
    expect(wrapper.get('[data-testid="ff-config.allow_when.0"]').element.tagName).toBe('INPUT')
  })

  it('selects the condition renderer without changing its string schema or value', async () => {
    const enabled = ref(true)
    const wrapper = mount(PluginEntityForm, {
      props: {
        config: { ...config, dataPlaneVersions: ['3.15.0.0'] },
        pluginName: 'custom-plugin',
        rawSchema: schema,
        record: { condition: 'true', config: { allow: ['team'] } },
      },
      global: { ...global, provide: {
        [FEATURE_FLAGS.KM_PLUGINS_CEL_EXPRESSION_EDITOR]: enabled,
        [FEATURE_FLAGS.KM_2306_CONDITION_FIELD_314]: true,
      } },
    })
    const conditionSchema = () => (wrapper.getComponent(Form).props('schema') as FormSchema).fields.find(field => field.condition)?.condition
    const expectStringSchema = () => expect(conditionSchema()).toEqual({ type: 'string', description: expect.any(String) })
    const principalFields = () => getCelSuggestions('principal.', wrapper.getComponent(CelInput).props('language')).map(s => s.label)

    expectStringSchema()
    await vi.waitFor(() => expect(wrapper.get('[data-testid="ff-condition"]').classes()).toContain('cel-input'))
    expect(principalFields()).not.toContain('groups')
    wrapper.getComponent(CelInput).vm.$emit('update:modelValue', 'http.path == "/test"')
    await flushPromises()
    expect(wrapper.getComponent(Form).emitted('change')?.at(-1)?.[0]).toMatchObject({ condition: 'http.path == "/test"' })

    enabled.value = false
    await flushPromises()
    const input = wrapper.get('[data-testid="ff-condition"]').element as HTMLInputElement
    expect(input.tagName).toBe('INPUT')
    expect(input.value).toBe('http.path == "/test"')
    expectStringSchema()

    enabled.value = true
    await flushPromises()
    expect(wrapper.get('[data-testid="ff-condition"]').classes()).toContain('cel-input')
    expect(wrapper.getComponent(CelInput).props('modelValue')).toBe('http.path == "/test"')

    await wrapper.setProps({ config: { ...config, dataPlaneVersions: ['3.17.0.0'] } })
    expect(principalFields()).toContain('groups')
    expect(wrapper.getComponent(CelInput).props('modelValue')).toBe('http.path == "/test"')

    // A mixed-version sandbox must retain the ATC-compatible plain input.
    await wrapper.setProps({ config: { ...config, dataPlaneVersions: ['3.14.0.1', '3.15.0.0'] } })
    expect(wrapper.get('[data-testid="ff-condition"]').element.tagName).toBe('INPUT')
    expectStringSchema()

    await wrapper.setProps({ config: { ...config, dataPlaneVersions: ['3.15.0.0'] } })
    expect(wrapper.get('[data-testid="ff-condition"]').classes()).toContain('cel-input')
    expectStringSchema()
  })

  it('selects CEL explicitly for MCP default and tool ACL rows', async () => {
    const enabled = ref(true)
    const acl: RecordFieldSchema = { type: 'record', fields: [
      { allow_when: { type: 'array', elements: { type: 'string' } } },
      { deny_when: { type: 'array', elements: { type: 'string' } } },
    ] }
    const mcpSchema: FormSchema = { type: 'record', fields: [{ config: { type: 'record', fields: [
      { default_acl: { type: 'array', elements: acl } },
      { tools: { type: 'array', elements: { type: 'record', fields: [{ acl }] } } },
      { notifications: acl },
    ] } }] }
    const rules = { allow_when: ['true'], deny_when: ['false'] }
    const wrapper = mount(PluginEntityForm, {
      props: {
        config,
        pluginName: 'ai-mcp-proxy',
        rawSchema: mcpSchema,
        record: { config: { default_acl: [rules], tools: [{ acl: rules }], notifications: rules } },
      },
      global: { ...global, provide: { [FEATURE_FLAGS.KM_PLUGINS_CEL_EXPRESSION_EDITOR]: enabled } },
    })
    await vi.waitFor(() => expect(wrapper.findAll('.cel-input')).toHaveLength(4))
    for (const prefix of ['config.default_acl.0', 'config.tools.0.acl']) {
      for (const field of ['allow_when', 'deny_when']) {
        expect(wrapper.get(`[data-testid="ff-${prefix}.${field}.0"]`).classes()).toContain('cel-input')
      }
    }
    expect(wrapper.get('[data-testid="ff-config.notifications.allow_when.0"]').element.tagName).toBe('INPUT')
    enabled.value = false
    await flushPromises()
    expect(wrapper.find('.cel-input').exists()).toBe(false)
    expect((wrapper.get('[data-testid="ff-config.tools.0.acl.allow_when.0"]').element as HTMLInputElement).value).toBe('true')
  })
})
