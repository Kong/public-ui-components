import { ref, nextTick, defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMonacoDiffEditor } from './useMonacoDiffEditor'
import { mount } from '@vue/test-utils'
import * as monaco from 'monaco-editor'
import type { UseMonacoDiffEditorOptions } from '../types'

// Mock shiki and shikijs/monaco
vi.mock('shiki', () => ({
  getSingletonHighlighter: vi.fn(() => Promise.resolve({
    getLoadedLanguages: vi.fn(() => ['javascript', 'typescript', 'json']),
  })),
  bundledLanguages: {},
  bundledThemes: {},
}))

vi.mock('@shikijs/monaco', () => ({
  shikiToMonaco: vi.fn(),
}))

const original = ref('original code')
const modified = ref('modified code')
const onReadySpy = vi.fn()

/** A single reusable test component so tests share one `defineComponent` call site. */
const createDiffEditorTestComponent = (overrides: Partial<UseMonacoDiffEditorOptions> = {}) => defineComponent({
  setup() {
    const target = ref<HTMLElement | null>(null)
    const show = ref(true)
    const diffEditorApi = useMonacoDiffEditor(target, {
      original,
      modified,
      language: 'javascript',
      onReady: onReadySpy,
      ...overrides,
    })
    return { target, diffEditorApi, show }
  },
  template: '<div v-if="show" ref="target" />',
})

const dummyComponent = createDiffEditorTestComponent()

/** The two mocked text models created by the composable, in [original, modified] order. */
const createdModels = () => vi.mocked(monaco.editor.createModel).mock.results.map(r => r.value)

describe('useMonacoDiffEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    original.value = 'original code'
    modified.value = 'modified code'
  })

  it('initializes the diff editor and exposes public methods', async () => {
    const wrapper = mount(dummyComponent)

    // wait for next tick so lifecycle hooks run
    await nextTick()

    const { diffEditorApi } = wrapper.vm

    expect(diffEditorApi).toHaveProperty('diffEditor')
    expect(diffEditorApi).toHaveProperty('editorStates')
    expect(diffEditorApi).toHaveProperty('setLanguage')
    expect(diffEditorApi).toHaveProperty('remeasureFonts')

    // methods should not throw even if called safely
    expect(() => diffEditorApi.setLanguage('yaml')).not.toThrow()
  })

  it('should call onReady with the diff editor instance when initialized', async () => {
    mount(dummyComponent)

    await nextTick()

    expect(onReadySpy).toHaveBeenCalledTimes(1)
    expect(onReadySpy).toHaveBeenCalledWith(expect.objectContaining({
      getOriginalEditor: expect.any(Function),
      getModifiedEditor: expect.any(Function),
      setModel: expect.any(Function),
    }))
  })

  it('never calls monaco.editor.create - only createDiffEditor', async () => {
    mount(dummyComponent)
    await nextTick()

    expect(monaco.editor.create).not.toHaveBeenCalled()
    expect(monaco.editor.createDiffEditor).toHaveBeenCalledTimes(1)
  })

  it('creates two models with distinct URIs, then the diff editor, then attaches them via setModel - in that order', async () => {
    mount(dummyComponent)
    await nextTick()

    const createModelMock = vi.mocked(monaco.editor.createModel)
    const createDiffEditorMock = vi.mocked(monaco.editor.createDiffEditor)
    const diffEditorMock = createDiffEditorMock.mock.results[0].value

    expect(createModelMock).toHaveBeenCalledTimes(2)

    // models created before the diff editor, which is created before setModel is called
    expect(createModelMock.mock.invocationCallOrder[1]).toBeLessThan(createDiffEditorMock.mock.invocationCallOrder[0])
    expect(createDiffEditorMock.mock.invocationCallOrder[0]).toBeLessThan(diffEditorMock.setModel.mock.invocationCallOrder[0])

    // the two models get distinct URIs
    const uriMock = vi.mocked(monaco.Uri.parse)
    const [[originalUri], [modifiedUri]] = uriMock.mock.calls
    expect(originalUri).not.toBe(modifiedUri)
    expect(originalUri).toContain('diff-original')
    expect(modifiedUri).toContain('diff-modified')

    const [originalModelMock, modifiedModelMock] = createdModels()
    expect(diffEditorMock.setModel).toHaveBeenCalledWith({ original: originalModelMock, modified: modifiedModelMock })
  })

  it('calls monaco.editor.setTheme before createDiffEditor', async () => {
    // @shikijs/monaco patches `create` but not `createDiffEditor`, and
    // StandaloneDiffEditor2 sets its theme directly via the theme service -
    // an explicit setTheme() call is required or tokenization uses a stale theme.
    mount(dummyComponent)
    await nextTick()

    const setThemeMock = vi.mocked(monaco.editor.setTheme)
    const createDiffEditorMock = vi.mocked(monaco.editor.createDiffEditor)

    expect(setThemeMock).toHaveBeenCalled()
    expect(setThemeMock.mock.invocationCallOrder[0]).toBeLessThan(createDiffEditorMock.mock.invocationCallOrder[0])
  })

  it('creates the diff editor in inline mode with automatic layout enabled', async () => {
    mount(dummyComponent)
    await nextTick()

    const [, options] = vi.mocked(monaco.editor.createDiffEditor).mock.calls[0]
    expect(options?.renderSideBySide).toBe(false)
    expect(options?.automaticLayout).toBe(true)
  })

  it('lets monacoOptions override the diff editor defaults', async () => {
    mount(createDiffEditorTestComponent({ monacoOptions: { renderSideBySide: true } }))
    await nextTick()

    const calls = vi.mocked(monaco.editor.createDiffEditor).mock.calls
    const [, options] = calls[calls.length - 1]
    expect(options?.renderSideBySide).toBe(true)
  })

  it('applies external original/modified changes to the correct model via setValue', async () => {
    mount(dummyComponent)
    await nextTick()

    const [originalModelMock, modifiedModelMock] = createdModels()

    original.value = 'new original'
    await nextTick()
    expect(originalModelMock.setValue).toHaveBeenCalledWith('new original')
    expect(modifiedModelMock.setValue).not.toHaveBeenCalledWith('new original')

    modified.value = 'new modified'
    await nextTick()
    expect(modifiedModelMock.setValue).toHaveBeenCalledWith('new modified')
    expect(originalModelMock.setValue).not.toHaveBeenCalledWith('new modified')
  })

  it('does not re-apply an external value that already equals the model content', async () => {
    mount(dummyComponent)
    await nextTick()

    const [originalModelMock] = createdModels()
    originalModelMock.getValue.mockReturnValue('already this value')
    originalModelMock.setValue.mockClear()

    original.value = 'already this value'
    await nextTick()

    expect(originalModelMock.setValue).not.toHaveBeenCalled()
  })

  it('setLanguage updates the language on both models', async () => {
    const wrapper = mount(dummyComponent)
    await nextTick()

    const setModelLanguageMock = vi.mocked(monaco.editor.setModelLanguage)
    setModelLanguageMock.mockClear()

    wrapper.vm.diffEditorApi.setLanguage('yaml')

    const [originalModelMock, modifiedModelMock] = createdModels()
    expect(setModelLanguageMock).toHaveBeenCalledTimes(2)
    expect(setModelLanguageMock).toHaveBeenCalledWith(originalModelMock, 'yaml')
    expect(setModelLanguageMock).toHaveBeenCalledWith(modifiedModelMock, 'yaml')
  })

  it('disposes in a safe order on unmount: models are only disposed after being released from a disposed diff editor', async () => {
    const wrapper = mount(dummyComponent)
    await nextTick()

    const diffEditorMock = vi.mocked(monaco.editor.createDiffEditor).mock.results[0].value
    const [originalModelMock, modifiedModelMock] = createdModels()

    wrapper.unmount()

    expect(diffEditorMock.setModel).toHaveBeenCalledWith(null)
    expect(diffEditorMock.dispose).toHaveBeenCalled()
    expect(originalModelMock.dispose).toHaveBeenCalled()
    expect(modifiedModelMock.dispose).toHaveBeenCalled()

    // Both the setup watcher's cleanup and `onBeforeUnmount` call `setModel(null)`/
    // `dispose()` on full unmount, so only the first occurrence of each is meaningful.
    const firstSetModelCallOrder = diffEditorMock.setModel.mock.invocationCallOrder[0]
    const firstDiffEditorDisposeOrder = diffEditorMock.dispose.mock.invocationCallOrder[0]
    const originalModelDisposeOrder = originalModelMock.dispose.mock.invocationCallOrder[0]
    const modifiedModelDisposeOrder = modifiedModelMock.dispose.mock.invocationCallOrder[0]

    // `setModel(null)` and the diff editor's own `dispose()` must both happen
    // before the models are disposed. disposing a model while still attached to
    // a live diff editor throws inside Monaco.
    expect(firstSetModelCallOrder).toBeLessThan(originalModelDisposeOrder)
    expect(firstSetModelCallOrder).toBeLessThan(modifiedModelDisposeOrder)
    expect(firstDiffEditorDisposeOrder).toBeLessThan(originalModelDisposeOrder)
    expect(firstDiffEditorDisposeOrder).toBeLessThan(modifiedModelDisposeOrder)
  })

  it('should call onReady again when target element is toggled, reusing the existing models', async () => {
    const wrapper = mount(dummyComponent)
    await nextTick()

    expect(onReadySpy).toHaveBeenCalledTimes(1)
    expect(monaco.editor.createModel).toHaveBeenCalledTimes(2)

    // Toggle off (remove element)
    wrapper.vm.show = false
    await nextTick()

    // Toggle on (recreate element)
    wrapper.vm.show = true
    await nextTick()

    expect(onReadySpy).toHaveBeenCalledTimes(2)
    // models are reused across the toggle, not recreated
    expect(monaco.editor.createModel).toHaveBeenCalledTimes(2)
  })
})
