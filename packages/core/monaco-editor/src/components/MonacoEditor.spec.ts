import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, reactive, shallowRef } from 'vue'
import MonacoEditor from './MonacoEditor.vue'
import { KEmptyState } from '@kong/kongponents'
import type { UseMonacoEditorOptions } from '../types'
import { DEFAULT_MONACO_OPTIONS } from '../constants'

// mock i18n
vi.mock('../composables/useI18n', () => ({
  default: () => ({
    i18n: {
      t: vi.fn((key: string) => key),
    },
  }),
}))

// mock useMonacoEditor
const editorStates = reactive({
  editorStatus: 'loading',
  hasContent: false,
})

const mockSetLanguage = vi.fn()
const mockUpdateOptions = vi.fn()
let lastUseMonacoOptions: UseMonacoEditorOptions | null = null

vi.mock('../composables/useMonacoEditor', () => ({
  useMonacoEditor: (_target: unknown, options: UseMonacoEditorOptions) => {
    lastUseMonacoOptions = options
    return {
      editor: shallowRef({
        updateOptions: mockUpdateOptions,
      }),
      editorStates,
      setContent: (value: string) => {
      // Update the code ref that was passed to the composable
        options.code.value = value
        editorStates.hasContent = !!value
        editorStates.editorStatus = 'ready'
      },
      setLanguage: mockSetLanguage,
    }
  },
}))

describe('MonacoEditor.vue', () => {
  beforeEach(() => {
    lastUseMonacoOptions = null
    mockSetLanguage.mockClear()
    mockUpdateOptions.mockClear()
  })

  const mountComponent = (overrides: Record<string, any> = {}) =>
    mount(MonacoEditor, {
      props: { modelValue: '', ...overrides.props },
      global: {
        stubs: {
          KEmptyState,
          Transition: false,
        },
        ...overrides.global,
      },
    })

  it('should show loading state when editorStatus=loading', async () => {
    editorStates.editorStatus = 'loading'
    // editor content should be irrelevant in loading state
    editorStates.hasContent = true

    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="monaco-editor-status-overlay-loading"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('editor.messages.loading_title')
    expect(wrapper.text()).toContain('editor.messages.loading_message')
    expect(wrapper.find('.progress-icon').exists()).toBe(true)
  })

  it('should show empty state when editorStatus=ready and has no content', () => {
    editorStates.editorStatus = 'ready'
    editorStates.hasContent = false

    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="monaco-editor-status-overlay-empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('editor.messages.empty_title')
    expect(wrapper.text()).toContain('editor.messages.empty_message')
    expect(wrapper.find('.codeblock-icon').exists()).toBe(true)
  })

  it('should not show empty state when editor has content and it\'s ready', () => {
    editorStates.editorStatus = 'ready'
    editorStates.hasContent = true

    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="monaco-editor-status-overlay-empty"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="monaco-editor-status-overlay-loading"]').exists()).toBe(false)
  })

  it('should apply loading class to container', () => {
    editorStates.editorStatus = 'loading'

    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="monaco-editor-container"]').classes()).toContain('loading')
  })

  it('should not apply loading class when editor is ready', () => {
    editorStates.editorStatus = 'ready'

    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="monaco-editor-container"]').classes()).not.toContain('loading')
  })

  it('should always render monaco-editor-target', () => {
    editorStates.editorStatus = 'loading'
    editorStates.hasContent = false

    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="monaco-editor-target"]').exists()).toBe(true)
  })

  it('shows loading, then renders content when fetched', async () => {
    vi.useFakeTimers()

    const wrapper = mountComponent()

    // Initially loading overlay should exist
    expect(wrapper.find('[data-testid="monaco-editor-status-overlay-loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="monaco-editor-container"]').classes()).toContain('loading')

    // Simulate async fetch of code
    setTimeout(() => {
      wrapper.vm.monacoEditor.setContent('fetched code')
    }, 150)

    // fast-forward time
    vi.advanceTimersByTime(150)
    await nextTick()

    // Editor should no longer have loading class
    expect(wrapper.find('[data-testid="monaco-editor-container"]').classes()).not.toContain('loading')
    // Empty state should not show
    expect(wrapper.find('[data-testid="monaco-editor-status-overlay-empty"]').exists()).toBe(false)
    // The model value should be updated via the internal ref
    expect(wrapper.vm.model).toBe('fetched code')

    vi.useRealTimers()
  })

  it('should call setLanguage when language prop changes', async () => {
    mockSetLanguage.mockClear()

    const wrapper = mountComponent({ props: { modelValue: 'test', language: 'javascript' } })
    await nextTick()

    // Initially setLanguage should not be called
    expect(mockSetLanguage).not.toHaveBeenCalled()

    // Update the language prop
    await wrapper.setProps({ language: 'typescript' })
    await nextTick()

    // setLanguage should be called with the new language
    expect(mockSetLanguage).toHaveBeenCalledWith('typescript')
  })

  it('should expose monacoEditor instance through defineExpose', async () => {
    const wrapper = mountComponent()

    expect(wrapper.vm.monacoEditor).toBeDefined()
    expect(wrapper.vm.monacoEditor).toHaveProperty('editorStates')
    expect(wrapper.vm.monacoEditor).toHaveProperty('setContent')
    expect(typeof wrapper.vm.monacoEditor.setContent).toBe('function')
  })

  it('should not show loading state overlay when showLoadingState is false', () => {
    editorStates.editorStatus = 'loading'

    const wrapper = mountComponent({ props: { modelValue: '', showLoadingState: false } })

    expect(wrapper.find('[data-testid="monaco-editor-status-overlay-loading"]').exists()).toBe(false)
  })

  it('should not show empty state overlay when showEmptyState is false', () => {
    editorStates.editorStatus = 'ready'
    editorStates.hasContent = false

    const wrapper = mountComponent({ props: { modelValue: '', showEmptyState: false } })

    expect(wrapper.find('[data-testid="monaco-editor-status-overlay-empty"]').exists()).toBe(false)
  })

  it('should show loading state by default when showLoadingState is not provided', () => {
    editorStates.editorStatus = 'loading'

    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="monaco-editor-status-overlay-loading"]').exists()).toBe(true)
  })

  it('should show empty state by default when showEmptyState is not provided', () => {
    editorStates.editorStatus = 'ready'
    editorStates.hasContent = false

    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="monaco-editor-status-overlay-empty"]').exists()).toBe(true)
  })

  it('should still apply loading class when showLoadingState is false but editor is loading', () => {
    editorStates.editorStatus = 'loading'

    const wrapper = mountComponent({ props: { modelValue: '', showLoadingState: false } })

    // The loading class should still be applied to the container
    expect(wrapper.find('[data-testid="monaco-editor-container"]').classes()).toContain('loading')
    // But the overlay should not be rendered
    expect(wrapper.find('[data-testid="monaco-editor-status-overlay-loading"]').exists()).toBe(false)
  })

  it('should apply appearance classes on render', () => {
    editorStates.editorStatus = 'ready'

    const embedded = mountComponent()
    expect(embedded.find('[data-testid="monaco-editor-container"]').classes()).toContain('embedded')

    const standalone = mountComponent({ props: { modelValue: '', appearance: 'standalone' } })
    expect(standalone.find('[data-testid="monaco-editor-container"]').classes()).toContain('standalone')
  })

  it('should use standalone defaults, then reset to embedded defaults when toggled', async () => {
    editorStates.editorStatus = 'ready'

    const code = 'line1\nline2'
    const lineCountDigits = String(code.split('\n').length).length
    const expectedMinChars = Math.max(DEFAULT_MONACO_OPTIONS.lineNumbersMinChars, lineCountDigits) + 2
    const wrapper = mountComponent({ props: { modelValue: code } })

    await wrapper.setProps({ appearance: 'standalone' })
    await nextTick()

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

  it('should apply standalone defaults on initial mount', () => {
    editorStates.editorStatus = 'ready'

    const code = Array.from({ length: 1000 }, (_, i) => `line${i}`).join('\n')
    const lineCountDigits = String(code.split('\n').length).length
    const expectedMinChars = Math.max(DEFAULT_MONACO_OPTIONS.lineNumbersMinChars, lineCountDigits) + 2
    mountComponent({ props: { modelValue: code, appearance: 'standalone' } })

    const options = lastUseMonacoOptions?.monacoOptions
    expect(options?.lineNumbersMinChars).toBe(expectedMinChars)
    expect(options?.padding?.top).toBeGreaterThan(0)
    expect(options?.padding?.bottom).toBeGreaterThan(0)
  })

  it('should ignore user-provided padding and lineNumbersMinChars in standalone', () => {
    editorStates.editorStatus = 'ready'

    const code = 'line1\nline2'
    const lineCountDigits = String(code.split('\n').length).length
    const expectedMinChars = Math.max(DEFAULT_MONACO_OPTIONS.lineNumbersMinChars, lineCountDigits) + 2
    const customPadding = { top: 12, bottom: 8 }
    const customMinChars = 9
    mountComponent({
      props: {
        modelValue: code,
        appearance: 'standalone',
        options: {
          padding: customPadding,
          lineNumbersMinChars: customMinChars,
        },
      },
    })

    const options = lastUseMonacoOptions?.monacoOptions
    expect(options?.lineNumbersMinChars).toBe(expectedMinChars)
    expect(options?.padding?.top).toBeGreaterThan(0)
    expect(options?.padding?.bottom).toBeGreaterThan(0)
  })

  it('should allow user-provided padding and lineNumbersMinChars in embedded', () => {
    editorStates.editorStatus = 'ready'

    const customPadding = { top: 6, bottom: 4 }
    const customMinChars = 12
    mountComponent({
      props: {
        modelValue: 'line1\nline2',
        appearance: 'embedded',
        options: {
          padding: customPadding,
          lineNumbersMinChars: customMinChars,
        },
      },
    })

    const options = lastUseMonacoOptions?.monacoOptions
    expect(options?.lineNumbersMinChars).toBe(customMinChars)
    expect(options?.padding?.top).toBe(customPadding.top)
    expect(options?.padding?.bottom).toBe(customPadding.bottom)
  })

})
