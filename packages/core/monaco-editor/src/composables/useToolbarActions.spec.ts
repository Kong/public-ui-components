import { useToolbarActions } from './useToolbarActions'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MonacoEditorToolbarOptions } from '../types'
import { CleaningIcon } from '@kong/icons'
import { ref } from 'vue'

// Mock built-in actions
vi.mock('../actions', () => ({
  BUILT_IN_TOOLBAR_ACTIONS: {
    save: {
      id: 'save',
      label: 'toolbar.save',
      icon: 'save-icon',
      action: vi.fn(),
      placement: 'left',
      order: 1,
    },
    format: {
      id: 'format',
      label: 'toolbar.format',
      icon: 'format-icon',
      action: vi.fn(),
      placement: 'right',
      order: 2,
    },
  },
}))

const lang = ref('javascript')

describe('useToolbarActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show all built-in commands when settings = true', () => {
    const { commands } = useToolbarActions(true, lang)

    expect(commands.value).toHaveLength(2)
    expect(commands.value[0].label).toBe('translated:toolbar.save')
    expect(commands.value[1].label).toBe('translated:toolbar.format')
  })

  it('should allow disabling a built-in command', () => {
    const settings: MonacoEditorToolbarOptions = {
      actions: {
        save: false,
      },
    }

    const { commands } = useToolbarActions(settings, lang)

    expect(commands.value.find(c => c.id === 'save')).toBeUndefined()
    expect(commands.value.find(c => c.id === 'format')).toBeDefined()
  })

  it('should allow overriding built-in command config', () => {
    const settings: MonacoEditorToolbarOptions = {
      actions: {
        save: {
          order: 99,
          placement: 'center',
        },
      },
    }

    const { commands } = useToolbarActions(settings, lang)
    const save = commands.value.find(c => c.id === 'save')!

    expect(save.order).toBe(99)
    expect(save.placement).toBe('center')
    expect(save.label).toBe('translated:toolbar.save') // still translated
  })

  it('should add custom user commands', () => {
    const actionMock = vi.fn()

    const settings: MonacoEditorToolbarOptions = {
      actions: {
        customAction: {
          label: 'My Action',
          icon: CleaningIcon,
          action: actionMock,
          placement: 'left',
          order: 5,
        },
      },
    }

    const { commands } = useToolbarActions(settings, lang)

    const custom = commands.value.find(c => c.id === 'customAction')
    expect(custom).toBeDefined()
    expect(custom?.label).toBe('My Action')
    expect(custom?.icon).toBe(CleaningIcon)
  })

  it('should ignore invalid custom commands (missing icon or action)', () => {
    const settings: MonacoEditorToolbarOptions = {
      actions: {
        bad1: { label: 'No icon', action: vi.fn() },
        bad2: { label: 'No action' },
      },
    }

    const { commands } = useToolbarActions(settings, lang)

    expect(commands.value.find(c => c.id === 'bad1')).toBeUndefined()
    expect(commands.value.find(c => c.id === 'bad2')).toBeUndefined()
  })

  it('should group commands by placement', () => {
    const settings: MonacoEditorToolbarOptions = {
      actions: {
        customLeft: {
          action: vi.fn(),
          placement: 'left',
        },
        customCenter: {
          action: vi.fn(),
          placement: 'center',
        },
      },
    }

    const { leftGroups, centerGroups, rightGroups } = useToolbarActions(settings, lang)

    expect(leftGroups.value.flat().every(c => c.placement === 'left' || !c.placement)).toBe(true)
    expect(centerGroups.value.flat().every(c => c.placement === 'center')).toBe(true)
    expect(rightGroups.value.flat().every(c => c.placement === 'right')).toBe(true)
  })

  it('should sort commands within placement by order', () => {
    const settings: MonacoEditorToolbarOptions = {
      actions: {
        a: { action: vi.fn(), placement: 'left', order: 50 },
        b: { action: vi.fn(), placement: 'left', order: 10 },
      },
    }

    const { leftGroups } = useToolbarActions(settings, lang)
    const flat = leftGroups.value.flat()

    const orders = flat.map(c => c.order)
    expect(orders).toEqual([...orders].sort((a, b) => (a ?? 100) - (b ?? 100)))
  })

  it('should group commands by group id', () => {
    const settings: MonacoEditorToolbarOptions = {
      actions: {
        a: { icon: CleaningIcon, action: vi.fn(), group: 'file' },
        b: { icon: CleaningIcon, action: vi.fn(), group: 'file' },
        c: { icon: CleaningIcon, action: vi.fn(), group: 'edit' },
      },
    }

    const { leftGroups } = useToolbarActions(settings, lang)

    expect(leftGroups.value.length).toBeGreaterThanOrEqual(2)
    const groupSizes = leftGroups.value.map(g => g.length)
    expect(groupSizes).toContain(2) // file group
    expect(groupSizes).toContain(1) // edit group
  })
})
