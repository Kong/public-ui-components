import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, reactive, shallowRef } from 'vue'
import MonacoDiffEditor from './MonacoDiffEditor.vue'
import { KEmptyState } from '@kong/kongponents'
import type { UseMonacoDiffEditorOptions } from '../types'
import { DEFAULT_MONACO_OPTIONS } from '../constants'

// mock i18n
vi.mock('../composables/useI18n', () => ({
  default: () => ({
    i18n: {
      t: vi.fn((key: string) => key),
    },
  }),
}))

// mock useMonacoDiffEditor
const editorStates = reactive({
  editorStatus: 'loading',
  currentLanguage: 'markdown',
})

const mockSetLanguage = vi.fn()
const mockUpdateOptions = vi.fn()
let lastUseMonacoDiffOptions: UseMonacoDiffEditorOptions | null = null

vi.mock('../composables/useMonacoDiffEditor', () => ({
  useMonacoDiffEditor: (_target: unknown, options: UseMonacoDiffEditorOptions) => {
    lastUseMonacoDiffOptions = options
    return {
      diffEditor: shallowRef({
        updateOptions: mockUpdateOptions,
      }),
      editorStates,
      setLanguage: mockSetLanguage,
      remeasureFonts: vi.fn(),
    }
  },
}))

describe('MonacoDiffEditor.vue', () => {
  beforeEach(() => {
    lastUseMonacoDiffOptions = null
    mockSetLanguage.mockClear()
    mockUpdateOptions.mockClear()
    editorStates.editorStatus = 'loading'
    editorStates.currentLanguage = 'markdown'
  })

  const mountComponent = (overrides: Record<string, any> = {}) =>
    mount(MonacoDiffEditor, {
      props: { original: '', modified: '', ...overrides.props },
      global: {
        stubs: {
          KEmptyState,
          Transition: false,
        },
        ...overrides.global,
      },
    })

  it('should always render monaco-diff-editor-target', () => {
    editorStates.editorStatus = 'loading'

    const wrapper = mountComponent()

    expect(wrapper.findTestId('monaco-diff-editor-target').exists()).toBe(true)
  })

  it('should show loading state when editorStatus=loading', () => {
    editorStates.editorStatus = 'loading'

    const wrapper = mountComponent({ props: { language: 'yaml' } })

    expect(wrapper.findTestId('monaco-diff-editor-status-overlay-loading').exists()).toBe(true)
    expect(wrapper.text()).toContain('editor.messages.loading_title')
    expect(wrapper.text()).toContain('editor.messages.loading_message')
    expect(wrapper.find('.progress-icon').exists()).toBe(true)
  })

  it('should not show loading overlay when editor is ready', () => {
    editorStates.editorStatus = 'ready'

    const wrapper = mountComponent()

    expect(wrapper.findTestId('monaco-diff-editor-status-overlay-loading').exists()).toBe(false)
  })

  it('should apply loading class to container', () => {
    editorStates.editorStatus = 'loading'

    const wrapper = mountComponent()

    expect(wrapper.getTestId('monaco-diff-editor-container').classes()).toContain('loading')
  })

  it('should not apply loading class when editor is ready', () => {
    editorStates.editorStatus = 'ready'

    const wrapper = mountComponent()

    expect(wrapper.getTestId('monaco-diff-editor-container').classes()).not.toContain('loading')
  })

  it('should force the loading state via the loading prop even when the editor is ready', () => {
    editorStates.editorStatus = 'ready'

    const wrapper = mountComponent({ props: { loading: true } })

    expect(wrapper.getTestId('monaco-diff-editor-container').classes()).toContain('loading')
    expect(wrapper.findTestId('monaco-diff-editor-status-overlay-loading').exists()).toBe(true)
  })

  it('should not show loading state overlay when showLoadingState is false, but still apply the loading class', () => {
    editorStates.editorStatus = 'loading'

    const wrapper = mountComponent({ props: { showLoadingState: false } })

    expect(wrapper.findTestId('monaco-diff-editor-status-overlay-loading').exists()).toBe(false)
    expect(wrapper.getTestId('monaco-diff-editor-container').classes()).toContain('loading')
  })

  it('should apply appearance classes on render', () => {
    editorStates.editorStatus = 'ready'

    const embedded = mountComponent()
    expect(embedded.getTestId('monaco-diff-editor-container').classes()).toContain('embedded')

    const standalone = mountComponent({ props: { appearance: 'standalone' } })
    expect(standalone.getTestId('monaco-diff-editor-container').classes()).toContain('standalone')
  })

  it('should call setLanguage when language prop changes', async () => {
    const wrapper = mountComponent({ props: { language: 'javascript' } })
    await nextTick()

    expect(mockSetLanguage).not.toHaveBeenCalled()

    await wrapper.setProps({ language: 'typescript' })
    await nextTick()

    expect(mockSetLanguage).toHaveBeenCalledWith('typescript')
  })

  it('should emit ready with the diff editor instance', () => {
    const diffEditorInstance = { getOriginalEditor: vi.fn(), getModifiedEditor: vi.fn() }

    const wrapper = mountComponent()
    // Simulate the composable calling its `onReady` callback.
    lastUseMonacoDiffOptions?.onReady?.(diffEditorInstance as any)

    expect(wrapper.emitted('ready')).toBeTruthy()
    expect(wrapper.emitted('ready')?.[0]).toEqual([diffEditorInstance])
  })

  it('should expose monacoDiffEditor instance through defineExpose', () => {
    const wrapper = mountComponent()

    expect(wrapper.vm.monacoDiffEditor).toBeDefined()
    expect(wrapper.vm.monacoDiffEditor).toHaveProperty('editorStates')
    expect(wrapper.vm.monacoDiffEditor).toHaveProperty('setLanguage')
  })

  it('should use standalone defaults, then reset to embedded defaults when toggled', async () => {
    editorStates.editorStatus = 'ready'

    const wrapper = mountComponent({
      props: { original: 'a\nb\nc', modified: 'a\nb' },
    })

    await wrapper.setProps({ appearance: 'standalone' })
    await nextTick()

    const lineCountDigits = String(3).length // longer side has 3 lines
    const expectedMinChars = Math.max(DEFAULT_MONACO_OPTIONS.lineNumbersMinChars, lineCountDigits) + 2

    const [standaloneOptions] = mockUpdateOptions.mock.calls[mockUpdateOptions.mock.calls.length - 1]
    expect(standaloneOptions.lineNumbersMinChars).toBe(expectedMinChars)
    expect(standaloneOptions.padding.top).toBeGreaterThan(0)
    expect(standaloneOptions.padding.bottom).toBeGreaterThan(0)

    await wrapper.setProps({ appearance: 'embedded', options: { readOnly: true } })
    await nextTick()

    const [embeddedOptions] = mockUpdateOptions.mock.calls[mockUpdateOptions.mock.calls.length - 1]
    expect(embeddedOptions.readOnly).toBe(true)
    expect(embeddedOptions.lineNumbersMinChars).toBe(DEFAULT_MONACO_OPTIONS.lineNumbersMinChars)
    expect(embeddedOptions.padding.top).toBe(DEFAULT_MONACO_OPTIONS.padding.top)
    expect(embeddedOptions.padding.bottom).toBe(DEFAULT_MONACO_OPTIONS.padding.bottom)
  })

  it('computes standalone lineNumbersMinChars from whichever side has more lines', () => {
    editorStates.editorStatus = 'ready'

    const original = Array.from({ length: 500 }, (_, i) => `line${i}`).join('\n')
    const modified = 'one line'

    mountComponent({ props: { original, modified, appearance: 'standalone' } })

    const options = lastUseMonacoDiffOptions?.monacoOptions
    const lineCountDigits = String(500).length
    const expectedMinChars = Math.max(DEFAULT_MONACO_OPTIONS.lineNumbersMinChars, lineCountDigits) + 2
    expect(options?.lineNumbersMinChars).toBe(expectedMinChars)
  })

  it('should ignore user-provided padding and lineNumbersMinChars in standalone', () => {
    editorStates.editorStatus = 'ready'

    mountComponent({
      props: {
        original: 'line1\nline2',
        modified: 'line1',
        appearance: 'standalone',
        options: {
          padding: { top: 12, bottom: 8 },
          lineNumbersMinChars: 9,
        },
      },
    })

    const options = lastUseMonacoDiffOptions?.monacoOptions
    expect(options?.padding?.top).toBeGreaterThan(0)
    expect(options?.padding?.bottom).toBeGreaterThan(0)
  })

  it('should allow user-provided padding and lineNumbersMinChars in embedded', () => {
    editorStates.editorStatus = 'ready'

    const customPadding = { top: 6, bottom: 4 }
    const customMinChars = 12
    mountComponent({
      props: {
        original: 'line1\nline2',
        modified: 'line1',
        appearance: 'embedded',
        options: {
          padding: customPadding,
          lineNumbersMinChars: customMinChars,
        },
      },
    })

    const options = lastUseMonacoDiffOptions?.monacoOptions
    expect(options?.lineNumbersMinChars).toBe(customMinChars)
    expect(options?.padding?.top).toBe(customPadding.top)
    expect(options?.padding?.bottom).toBe(customPadding.bottom)
  })
})
