import { ref, nextTick, defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'
import { useMonacoEditor } from './useMonacoEditor'
import { mount } from '@vue/test-utils'

describe('useMonacoEditor', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes editor and exposes public methods', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const code = ref('initial code')

    // define a simple dummy component using the composable
    const wrapper = mount(
      defineComponent({
        setup() {
          const target = ref<HTMLElement | null>(null)
          const editorApi = useMonacoEditor(target, {
            code,
            language: 'javascript',
            onChanged: vi.fn(),
            onCreated: vi.fn(),
          })
          return { target, editorApi }
        },
        template: '<div ref="target" />',
      }),
    )

    // wait for next tick so lifecycle hooks run
    await nextTick()

    const { editorApi } = wrapper.vm as any

    // ensure methods exist
    expect(editorApi).toHaveProperty('setContent')
    expect(editorApi).toHaveProperty('setReadOnly')
    expect(editorApi).toHaveProperty('focus')
    expect(editorApi).toHaveProperty('remeasureFonts')
    expect(editorApi).toHaveProperty('toggleSearchWidget')
    expect(editorApi).toHaveProperty('triggerKeyboardCommand')

    // call a method safely
    expect(() => editorApi.setContent('new code')).not.toThrow()
  })
})
