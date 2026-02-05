import { ref, nextTick, defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMonacoEditor } from './useMonacoEditor'
import { mount } from '@vue/test-utils'

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

const code = ref('initial code')
const onReadySpy = vi.fn()


const dummyComponent = defineComponent({
  setup() {
    const target = ref<HTMLElement | null>(null)
    const show = ref(true)
    const editorApi = useMonacoEditor(target, {
      code,
      language: 'javascript',
      onReady: onReadySpy,
    })
    return { target, editorApi, show }
  },
  template: '<div v-if="show" ref="target" />',
})


describe('useMonacoEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes editor and exposes public methods', async () => {
    const wrapper = mount(dummyComponent)

    // wait for next tick so lifecycle hooks run
    await nextTick()

    const { editorApi } = wrapper.vm

    // ensure methods exist
    expect(editorApi).toHaveProperty('setContent')
    expect(editorApi).toHaveProperty('setReadOnly')
    expect(editorApi).toHaveProperty('focus')
    expect(editorApi).toHaveProperty('remeasureFonts')
    expect(editorApi).toHaveProperty('toggleSearchWidget')
    expect(editorApi).toHaveProperty('triggerKeyboardCommand')
    expect(editorApi).toHaveProperty('editor')
    expect(editorApi).toHaveProperty('editorStates')

    // call a method safely (methods should not throw even if editor is not yet initialized)
    expect(() => editorApi.setContent('new code')).not.toThrow()
  })

  it('should call onReady when editor is initialized', async () => {
    mount(dummyComponent)

    // Wait for Monaco to load, watcher to trigger, and editor to initialize
    await nextTick()

    // onReady should be called once the editor is ready
    expect(onReadySpy).toHaveBeenCalledTimes(1)
    expect(onReadySpy).toHaveBeenCalledWith(expect.objectContaining({
      setValue: expect.any(Function),
      getValue: expect.any(Function),
      focus: expect.any(Function),
    }))
  })

  it('should call onReady again when target element is toggled', async () => {
    const wrapper = mount(dummyComponent)
    await nextTick()

    // onReady should be called once after initial mount
    expect(onReadySpy).toHaveBeenCalledTimes(1)

    // Toggle off (remove element)
    wrapper.vm.show = false
    await nextTick()

    // Toggle on (recreate element)
    wrapper.vm.show = true
    await nextTick()

    // onReady should be called again when target is recreated
    expect(onReadySpy).toHaveBeenCalledTimes(2)
  })
})
