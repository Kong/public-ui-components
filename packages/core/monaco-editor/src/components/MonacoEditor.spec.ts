import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, reactive, shallowRef } from 'vue'
import MonacoEditor from './MonacoEditor.vue'
import { KEmptyState } from '@kong/kongponents'
import type { editor } from 'monaco-editor'
import type { UseMonacoEditorOptions } from '../types'

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

const expectStandaloneOptions = (
  options: Partial<editor.IStandaloneEditorConstructionOptions> | undefined,
  expectedMinChars: number,
): void => {
  expect(options?.lineNumbersMinChars).toBe(expectedMinChars)
  expect(typeof options?.padding?.top).toBe('number')
  expect(typeof options?.padding?.bottom).toBe('number')
}

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

  it('should apply embedded appearance class by default', () => {
    editorStates.editorStatus = 'ready'

    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="monaco-editor-container"]').classes()).toContain('embedded')
  })

  it('should apply standalone appearance class when appearance is standalone', () => {
    editorStates.editorStatus = 'ready'

    const wrapper = mountComponent({ props: { modelValue: '', appearance: 'standalone' } })

    expect(wrapper.find('[data-testid="monaco-editor-container"]').classes()).toContain('standalone')
  })

  it('should update editor options with standalone padding and lineNumbersMinChars', async () => {
    editorStates.editorStatus = 'ready'

    const wrapper = mountComponent({ props: { modelValue: 'line1\nline2' } })

    await wrapper.setProps({ appearance: 'standalone' })
    await nextTick()

    const [options] = mockUpdateOptions.mock.calls[mockUpdateOptions.mock.calls.length - 1]
    expectStandaloneOptions(options, 3)
  })

  it('should pass standalone options on initial mount when appearance is standalone', () => {
    editorStates.editorStatus = 'ready'

    mountComponent({ props: { modelValue: 'line1\nline2', appearance: 'standalone' } })

    expectStandaloneOptions(lastUseMonacoOptions?.monacoOptions, 3)
  })

  it('should not inject standalone options when appearance is embedded', async () => {
    editorStates.editorStatus = 'ready'

    const wrapper = mountComponent({ props: { modelValue: 'line1\nline2' } })

    await wrapper.setProps({ options: { readOnly: true } })
    await nextTick()

    expect(mockUpdateOptions).toHaveBeenCalled()
    const [options] = mockUpdateOptions.mock.calls[mockUpdateOptions.mock.calls.length - 1]
    expect(options).toEqual({ readOnly: true })
  })
})
