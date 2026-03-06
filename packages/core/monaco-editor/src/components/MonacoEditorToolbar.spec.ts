import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, reactive, nextTick } from 'vue'
import MonacoEditorToolbar from './MonacoEditorToolbar.vue'
import { BUILT_IN_TOOLBAR_ACTIONS } from '../actions'
import { useElementSize as useElementSizeFn } from '@vueuse/core'
import Kongponents from '@kong/kongponents'
import type { MonacoEditorToolbarOptions } from '../types'

// Mock @vueuse/core (jsdom has no layout engine)
const mockToolbarWidth = ref(1000)
const mockLeftWidth = ref(0)
const mockCentreWidth = ref(0)
const mockRightWidth = ref(0)

vi.mock('@vueuse/core', () => ({
  useElementSize: vi.fn(() => {
    const callCount = (vi.mocked(useElementSizeFn).mock.calls.length)
    // Calls: 1=toolbar, 2=left, 3=centre, 4=right
    if (callCount === 1) return { width: mockToolbarWidth, height: ref(44) }
    if (callCount === 2) return { width: mockLeftWidth, height: ref(44) }
    if (callCount === 3) return { width: mockCentreWidth, height: ref(44) }
    return { width: mockRightWidth, height: ref(44) }
  }),
}))

function makeEditor(status: 'loading' | 'ready' = 'ready') {
  return {
    editorStates: reactive({
      editorStatus: status,
      searchBoxIsRevealed: false,
      hasContent: false,
      theme: 'light' as const,
      currentLanguage: 'markdown',
    }),
    registerActions: vi.fn(),
    editor: ref(null),
    setContent: vi.fn(),
    setReadOnly: vi.fn(),
    focus: vi.fn(),
    setLanguage: vi.fn(),
    remeasureFonts: vi.fn(),
    toggleSearchWidget: vi.fn(),
    triggerKeyboardCommand: vi.fn(),
  }
}

function mountToolbar(overrides: Record<string, any> = {}) {
  return mount(MonacoEditorToolbar, {
    props: {
      settings: true as boolean | MonacoEditorToolbarOptions,
      ...overrides.props,
    },
    slots: overrides.slots,
    global: {
      plugins: [Kongponents],
      ...overrides.global,
    },
  })
}

const sampleLeftActionIds = Object.values(BUILT_IN_TOOLBAR_ACTIONS)
  .filter(a => a.placement === 'left' || !a.placement)
  .map(a => a.id)
  .slice(0, 5)
const sampleRightActionIds = Object.values(BUILT_IN_TOOLBAR_ACTIONS)
  .filter(a => a.placement === 'right')
  .map(a => a.id)
  .slice(0, 3)

describe('MonacoEditorToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockToolbarWidth.value = 1000
    mockLeftWidth.value = 0
    mockCentreWidth.value = 0
    mockRightWidth.value = 0
  })

  describe('rendering', () => {
    it('should render the toolbar container', () => {
      const wrapper = mountToolbar()
      expect(wrapper.find('[data-testid="monaco-editor-toolbar"]').exists()).toBe(true)
    })

    it('should render left, centre, and right sections', () => {
      const wrapper = mountToolbar()
      expect(wrapper.find('[data-testid="monaco-editor-toolbar-left"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="monaco-editor-toolbar-center"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="monaco-editor-toolbar-right"]').exists()).toBe(true)
    })

    it('should render built-in left actions for markdown', () => {
      const editor = makeEditor('ready')
      const wrapper = mountToolbar({ props: { editor, settings: true } })
      const leftSection = wrapper.find('[data-testid="monaco-editor-toolbar-left"]')

      for (const id of sampleLeftActionIds) {
        expect(leftSection.find(`[data-testid="editor-toolbar-mdc-action-${id}-button"]`).exists()).toBe(true)
      }
    })

    it('should render built-in right actions (search, fullScreen)', () => {
      const editor = makeEditor('ready')
      const wrapper = mountToolbar({ props: { editor, settings: true } })
      const rightSection = wrapper.find('[data-testid="monaco-editor-toolbar-right"]')

      for (const id of sampleRightActionIds) {
        expect(rightSection.find(`[data-testid="editor-toolbar-mdc-action-${id}-button"]`).exists()).toBe(true)
      }
    })

    it('should group actions into separate action-group elements', () => {
      const editor = makeEditor('ready')
      const wrapper = mountToolbar({ props: { editor, settings: true } })
      const leftSection = wrapper.find('[data-testid="monaco-editor-toolbar-left"]')
      const groups = leftSection.findAll('.monaco-editor-ui-toolbar-action-group')

      // Should have multiple groups (formatting group 1, group 2, insert group 3, etc.) + 1 overflow group
      expect(groups.length).toBeGreaterThan(2)
    })

    it('should not render markdown-specific actions for non-markdown language', () => {
      const editor = makeEditor('ready')
      editor.editorStates.currentLanguage = 'json'

      const wrapper = mountToolbar({ props: { editor, settings: true } })
      const leftSection = wrapper.find('[data-testid="monaco-editor-toolbar-left"]')

      // bold is markdown-only
      expect(leftSection.find('[data-testid="editor-toolbar-mdc-action-editor.action.bold-button"]').exists()).toBe(false)
      // format is language-agnostic, should still appear
      expect(leftSection.find('[data-testid="editor-toolbar-mdc-action-editor.action.format-button"]').exists()).toBe(true)
    })

    it('should allow disabling a built-in action via settings', () => {
      const editor = makeEditor('ready')
      const settings: MonacoEditorToolbarOptions = {
        actions: { format: false },
      }

      const wrapper = mountToolbar({ props: { editor, settings } })
      expect(wrapper.find('[data-testid="editor-toolbar-mdc-action-editor.action.format-button"]').exists()).toBe(false)
    })
  })

  describe('editor integration', () => {
    it('should pass active=true when editor status is ready', () => {
      const editor = makeEditor('ready')
      const wrapper = mountToolbar({ props: { editor, settings: true } })
      const button = wrapper.find('[data-testid="editor-toolbar-mdc-action-editor.action.format-button"]')

      expect(button.attributes('disabled')).toBeUndefined()
    })

    it('should pass active=false when editor status is loading', () => {
      const editor = makeEditor('loading')
      const wrapper = mountToolbar({ props: { editor, settings: true } })
      const button = wrapper.find('[data-testid="editor-toolbar-mdc-action-editor.action.format-button"]')

      expect(button.attributes('disabled')).toBe('')
    })

    it('should register actions when editor becomes ready', async () => {
      const editor = makeEditor('loading')
      mountToolbar({ props: { editor, settings: true } })

      expect(editor.registerActions).not.toHaveBeenCalled()

      editor.editorStates.editorStatus = 'ready'
      await nextTick()

      expect(editor.registerActions).toHaveBeenCalled()
      expect(editor.registerActions.mock.calls[0][0].length).toBeGreaterThan(0)
    })

    it('should register actions immediately if editor is already ready', () => {
      const editor = makeEditor('ready')
      mountToolbar({ props: { editor, settings: true } })

      expect(editor.registerActions).toHaveBeenCalled()
    })
  })

  // TODO: fix flaky tests and re-enable [TDX-7641]
  describe.skip('overflow menu', () => {
    it('should hide the overflow dropdown when all items are visible', () => {
      const editor = makeEditor('ready')
      const wrapper = mountToolbar({ props: { editor, settings: true } })

      const leftSection = wrapper.find('[data-testid="monaco-editor-toolbar-left"]')
      const groups = leftSection.findAll('.monaco-editor-ui-toolbar-action-group')
      const overflowGroup = groups[groups.length - 1]

      // v-show sets display:none when no hidden items
      expect(overflowGroup.attributes('style')).toContain('display: none')
    })

    it('should show overflow dropdown when items are collapsed', async () => {
      const editor = makeEditor('ready')
      const wrapper = mountToolbar({ props: { editor, settings: true } })

      // Simulate narrow toolbar
      mockToolbarWidth.value = 200
      mockLeftWidth.value = 300
      mockRightWidth.value = 100
      await nextTick()
      await flushPromises()

      const leftSection = wrapper.find('[data-testid="monaco-editor-toolbar-left"]')
      const groups = leftSection.findAll('.monaco-editor-ui-toolbar-action-group')
      const overflowGroup = groups[groups.length - 1]

      // Overflow dropdown should be visible (no display:none)
      expect(overflowGroup.attributes('style') || '').not.toContain('display: none')
    })

    it('should render hidden items in the dropdown', async () => {
      const editor = makeEditor('ready')
      const wrapper = mountToolbar({ props: { editor, settings: true } })

      // Collapse items
      mockToolbarWidth.value = 100
      mockLeftWidth.value = 400
      mockRightWidth.value = 100
      await nextTick()
      await flushPromises()

      const dropdownItems = wrapper.findAll('[data-testid^="overflow-item-"]')
      expect(dropdownItems.length).toBeGreaterThan(0)
    })

    it('should restore items when toolbar gets wider', async () => {
      const editor = makeEditor('ready')
      const wrapper = mountToolbar({ props: { editor, settings: true } })

      const getVisibleActionCount = () => {
        const left = wrapper.find('[data-testid="monaco-editor-toolbar-left"]')
        return left.findAll('[data-testid$="-button"]')
          .filter(b => b.attributes('data-testid') !== 'editor-toolbar-mdc-action-more-button').length
      }

      const initialCount = getVisibleActionCount()

      // Collapse
      mockToolbarWidth.value = 100
      mockLeftWidth.value = 400
      mockRightWidth.value = 100
      await nextTick()
      await flushPromises()

      const collapsedCount = getVisibleActionCount()
      expect(collapsedCount).toBeLessThan(initialCount)

      // Expand back
      mockToolbarWidth.value = 2000
      mockLeftWidth.value = 400
      mockRightWidth.value = 100
      await nextTick()
      await flushPromises()

      const restoredCount = getVisibleActionCount()
      expect(restoredCount).toBeGreaterThan(collapsedCount)
    })

    it('should add hasDivider between groups in the overflow dropdown', async () => {
      const editor = makeEditor('ready')
      const wrapper = mountToolbar({ props: { editor, settings: true } })

      // Collapse enough to push multiple groups into overflow
      mockToolbarWidth.value = 50
      mockLeftWidth.value = 500
      mockRightWidth.value = 50
      await nextTick()
      await flushPromises()

      const dropdownItems = wrapper.findAll('[data-testid^="overflow-item-"]')
      if (dropdownItems.length >= 2) {
        // First hidden group's first item should not have divider
        expect(dropdownItems[0].attributes('has-divider')).toBeFalsy()
      }
    })

    it('should sync visible groups when language changes', async () => {
      const editor = makeEditor('ready')
      editor.editorStates.currentLanguage = 'markdown'

      const wrapper = mountToolbar({ props: { editor, settings: true } })
      const leftSection = wrapper.find('[data-testid="monaco-editor-toolbar-left"]')

      // Should have markdown-specific actions (bold, italic, etc.)
      expect(leftSection.find('[data-testid="editor-toolbar-mdc-action-editor.action.bold-button"]').exists()).toBe(true)

      // Switch language to json — markdown-only actions should disappear
      editor.editorStates.currentLanguage = 'json'
      await nextTick()

      expect(leftSection.find('[data-testid="editor-toolbar-mdc-action-editor.action.bold-button"]').exists()).toBe(false)
    })

    it('should render the more button', () => {
      const editor = makeEditor('ready')
      const wrapper = mountToolbar({ props: { editor, settings: true } })
      const moreButton = wrapper.find('[data-testid="editor-toolbar-mdc-action-more-button"]')

      expect(moreButton.exists()).toBe(true)
    })
  })

  describe('slots', () => {
    const cases = [
      ['toolbar-left', 'monaco-editor-toolbar-left', 'custom-left', 'Custom Left'],
      ['toolbar-center', 'monaco-editor-toolbar-center', 'custom-center', 'Custom Center'],
      ['toolbar-right', 'monaco-editor-toolbar-right', 'custom-right', 'Custom Right'],
    ]

    it.each(cases)(
      'renders %s slot content in the correct section',
      (slotName, sectionTestId, customId, text) => {
        const wrapper = mountToolbar({
          slots: {
            [slotName]: `<span data-testid="${customId}">${text}</span>`,
          },
        })

        const section = wrapper.find(`[data-testid="${sectionTestId}"]`)
        const el = section.find(`[data-testid="${customId}"]`)

        expect(el.exists()).toBe(true)
        expect(el.text()).toBe(text)
      },
    )

    it('renders all three slot contents simultaneously', () => {
      const wrapper = mountToolbar({
        slots: {
          'toolbar-left': '<span data-testid="custom-left">Left</span>',
          'toolbar-center': '<span data-testid="custom-center">Center</span>',
          'toolbar-right': '<span data-testid="custom-right">Right</span>',
        },
      })

      expect(wrapper.find('[data-testid="custom-left"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="custom-center"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="custom-right"]').exists()).toBe(true)
    })

    it('does not render slot content in the wrong sections', () => {
      const wrapper = mountToolbar({
        slots: {
          'toolbar-left': '<span data-testid="custom-left">Left Only</span>',
        },
      })

      expect(wrapper.find('[data-testid="monaco-editor-toolbar-left"] [data-testid="custom-left"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="monaco-editor-toolbar-center"] [data-testid="custom-left"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="monaco-editor-toolbar-right"] [data-testid="custom-left"]').exists()).toBe(false)
    })
  })
})
