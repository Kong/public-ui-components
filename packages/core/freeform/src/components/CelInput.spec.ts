import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { attachCelLanguage, defineCelLanguage, kongHttp } from '@kong-ui-public/monaco-editor/languages/cel'
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
  it('works without a Form parent and forwards values and live language configuration', async () => {
    const language = defineCelLanguage([])
    const wrapper = mount(CelInput, { props: { language, modelValue: 'true', label: 'Rule', id: 'rule' } })
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
    expect(options.language()).toEqual(language)
    const nextLanguage = defineCelLanguage([kongHttp()])
    await wrapper.setProps({ language: nextLanguage })
    expect(options.language()).toEqual(nextLanguage)
    blur()
    expect(wrapper.emitted('change')).toHaveLength(1)

    const languageDispose = vi.mocked(attachCelLanguage).mock.results.at(-1)!.value.dispose
    wrapper.unmount()
    expect(resizeDispose).toHaveBeenCalledOnce()
    expect(blurDispose).toHaveBeenCalledOnce()
    expect(languageDispose).toHaveBeenCalledOnce()
  })

  it('uses the supplied dialect for hints and respects disabled fields', async () => {
    const wrapper = mount(CelInput, { props: {
      language: defineCelLanguage([kongHttp()]), modelValue: 'http.custom', disabled: true,
      error: true, errorMessage: 'Invalid rule', help: 'Enter a rule',
    } })
    await vi.waitFor(() => expect(wrapper.find('textarea').exists()).toBe(true))
    expect(wrapper.getComponent({ name: 'MonacoEditor' }).props('options').readOnly).toBe(true)
    expect(wrapper.text()).toContain('Invalid rule')
    expect(wrapper.text()).not.toContain('Enter a rule')
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    await wrapper.get('textarea').setValue('false')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ language: defineCelLanguage([{
      variables: { http: { kind: 'record', fields: { custom: { kind: 'string' } } } },
    }]) })
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
