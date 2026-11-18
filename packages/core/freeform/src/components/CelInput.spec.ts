import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { attachCelLanguage, defineCelKind, kongHttp } from '@kong-ui-public/monaco-editor/languages/cel'
import type * as CelLanguageApi from '@kong-ui-public/monaco-editor/languages/cel'
import type { editor } from 'monaco-editor'
import CelInput from './CelInput.vue'

vi.mock('monaco-editor', () => ({}))
vi.mock('@kong-ui-public/monaco-editor/languages/cel', async (importOriginal) => ({
  ...await importOriginal<typeof CelLanguageApi>(),
  attachCelLanguage: vi.fn(() => ({ dispose: vi.fn() })),
}))
vi.mock('@kong-ui-public/monaco-editor', async () => {
  const { defineComponent, h } = await import('vue')
  return { MonacoEditor: defineComponent({
    name: 'MonacoEditor',
    props: { modelValue: String, options: Object },
    emits: ['update:modelValue', 'ready'],
    setup: (props, { emit }) => () => h('textarea', {
      value: props.modelValue,
      onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
    }),
  }) }
})

describe('standalone CelInput', () => {
  it('works without a Form parent and forwards values and the live CEL kind', async () => {
    const kind = defineCelKind([])
    const wrapper = mount(CelInput, { props: { kind, modelValue: 'true', label: 'Rule', id: 'rule' } })
    await vi.waitFor(() => expect(wrapper.find('textarea').exists()).toBe(true))
    expect(wrapper.get('textarea').element.value).toBe('true')
    await wrapper.get('textarea').setValue('false')
    expect(wrapper.emitted('update:modelValue')).toEqual([['false']])

    let blur = () => {}
    const resizeDispose = vi.fn()
    const blurDispose = vi.fn()
    const instance = {
      getContentHeight: () => 100,
      getDomNode: () => wrapper.element,
      onDidContentSizeChange: () => ({ dispose: resizeDispose }),
      onDidBlurEditorText: (callback: () => void) => {
        blur = callback
        return { dispose: blurDispose }
      },
    } as unknown as editor.IStandaloneCodeEditor
    wrapper.getComponent({ name: 'MonacoEditor' }).vm.$emit('ready', instance)
    await flushPromises()
    expect(wrapper.get('textarea').attributes('id')).toBe('rule')
    expect(wrapper.get('label').attributes('for')).toBe('rule')
    const options = vi.mocked(attachCelLanguage).mock.calls.at(-1)![1]
    expect(options.kind()).toEqual(kind)
    const nextKind = defineCelKind([kongHttp()])
    await wrapper.setProps({ kind: nextKind })
    expect(options.kind()).toEqual(nextKind)
    blur()
    expect(wrapper.emitted('change')).toHaveLength(1)

    const languageDispose = vi.mocked(attachCelLanguage).mock.results.at(-1)!.value.dispose
    wrapper.unmount()
    expect(resizeDispose).toHaveBeenCalledOnce()
    expect(blurDispose).toHaveBeenCalledOnce()
    expect(languageDispose).toHaveBeenCalledOnce()
  })

  it('renders the messages for each built-in hint kind', async () => {
    const wrapper = mount(CelInput, { props: { kind: defineCelKind([]), modelValue: 'true' } })
    await vi.waitFor(() => expect(wrapper.find('textarea').exists()).toBe(true))

    for (const [hintKind, message] of [
      ['assignment', 'Use "==" to compare'],
      ['alias', 'Did you mean "consumer"?'],
      ['plugin-state', 'not supported in access control expressions'],
      ['header-name', 'Use "consumer" instead of "user"'],
      ['unguarded', 'has(consumer.id)'],
      ['default', '"default()" is not allowed here'],
      ['unknown-member', '"consumer.id" does not exist. "consumer" is string'],
      ['unknown-field', '"consumer.id" is not a field'],
    ]) {
      await wrapper.setProps({ kind: defineCelKind([{ check: () => ({
        kind: hintKind, typed: 'user', expected: 'consumer', field: 'consumer.id', base: 'consumer', type: 'string',
      }) }]) })
      expect(wrapper.get('[role="status"]').text()).toContain(message)
    }
    wrapper.unmount()
  })

  it('uses the supplied kind for hints and respects disabled fields', async () => {
    const wrapper = mount(CelInput, { props: {
      kind: defineCelKind([kongHttp()]), modelValue: 'http.custom', disabled: true,
      error: true, errorMessage: 'Invalid rule', help: 'Enter a rule',
    } })
    await vi.waitFor(() => expect(wrapper.find('textarea').exists()).toBe(true))
    expect(wrapper.getComponent({ name: 'MonacoEditor' }).props('options').readOnly).toBe(true)
    expect(wrapper.text()).toContain('Invalid rule')
    expect(wrapper.text()).not.toContain('Enter a rule')
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    await wrapper.get('textarea').setValue('false')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ kind: defineCelKind([{
      variables: { http: { kind: 'record', fields: { custom: { kind: 'string' } } } },
    }]) })
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
