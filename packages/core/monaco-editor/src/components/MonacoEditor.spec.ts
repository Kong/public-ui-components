import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import MonacoEditor from './MonacoEditor.vue'
import { KEmptyState } from '@kong/kongponents'

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

const code = ref('')

vi.mock('../composables/useMonacoEditor', () => ({
  useMonacoEditor: () => ({
    editorStates,
    setContent: (value: string) => {
      code.value = value
      editorStates.hasContent = !!value
      editorStates.editorStatus = 'ready'
    },
  }),
}))

describe('MonacoEditor.vue', () => {
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
      // @ts-ignore - monacoEditor exists
      wrapper.vm.monacoEditor.setContent('fetched code')
    }, 150)

    // fast-forward time
    vi.advanceTimersByTime(150)
    await nextTick()

    // // Editor should no longer have loading class
    expect(wrapper.find('[data-testid="monaco-editor-container"]').classes()).not.toContain('loading')
    // // Empty state should not show
    expect(wrapper.find('[data-testid="monaco-editor-status-overlay-empty"]').exists()).toBe(false)
    // Code should now be populated
    expect(code.value).toBe('fetched code')

    vi.useRealTimers()
  })
})
