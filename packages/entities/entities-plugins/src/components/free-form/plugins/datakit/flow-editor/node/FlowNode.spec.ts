import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

import FlowNode from './FlowNode.vue'
import { initEditorState } from '../store/init'
import { provideEditorStore } from '../store/store'

import type { DatakitPluginData, NodeInstance } from '../../types'

const createPluginData = (): DatakitPluginData => ({
  config: {
    nodes: [{ type: 'jq', name: 'test-node' }],
  },
  __ui_data: {
    nodes: [],
    groups: [],
  },
} as unknown as DatakitPluginData)

const globalStubs = {
  KTooltip: {
    template: '<div class="k-tooltip"><slot /></div>',
  },
  NodeBadge: {
    template: '<div class="node-badge" />',
  },
  Handle: {
    template: '<div class="handle-stub" />',
  },
  HandleTwig: {
    template: '<div class="handle-twig-stub" />',
  },
  NodePortal: {
    template: '<div class="node-portal-stub" />',
  },
  WarningIcon: {
    template: '<div class="warning-icon-stub" />',
  },
  KDropdown: {
    template: '<div class="k-dropdown-stub"><slot /><slot name="items" /></div>',
  },
  KDropdownItem: true,
  KButton: true,
  MoreIcon: true,
  HotkeyLabel: true,
  UnfoldMoreIcon: true,
  UnfoldLessIcon: true,
}

interface MountOptions {
  nodeOverrides?: Partial<NodeInstance>
  props?: { error?: boolean, readonly?: boolean }
  slots?: Record<string, () => ReturnType<typeof h>>
}

function mountFlowNode({ nodeOverrides = {}, props = {}, slots = {} }: MountOptions = {}) {
  const pluginData = createPluginData()
  const editorState = initEditorState(pluginData)
  const baseNode = editorState.nodes.find(({ name }) => name === 'test-node') as NodeInstance
  const node = { ...baseNode, ...nodeOverrides }

  const Harness = defineComponent({
    name: 'FlowNodeHarness',
    setup() {
      provideEditorStore(pluginData)
      return () => h(FlowNode, { data: node, ...props }, slots)
    },
  })

  return mount(Harness, {
    global: { stubs: globalStubs },
  })
}


describe('FlowNode', () => {
  describe('slot ordering', () => {
    it('renders before-handles slot before the handles wrapper and after-handles slot after', () => {
      const wrapper = mountFlowNode({
        slots: {
          actions: () => h('div', { 'data-testid': 'actions-slot' }, 'actions'),
          'before-handles': () => h('div', { 'data-testid': 'before-handles-slot' }, 'before'),
          'after-handles': () => h('div', { 'data-testid': 'after-handles-slot' }, 'after'),
        },
      })

      const children = Array.from(wrapper.element.children)
      const beforeIndex = children.findIndex(el => (el as HTMLElement).dataset.testid === 'before-handles-slot')
      const handlesIndex = children.findIndex(el => (el as HTMLElement).classList.contains('handles'))
      const afterIndex = children.findIndex(el => (el as HTMLElement).dataset.testid === 'after-handles-slot')

      expect(beforeIndex).toBeGreaterThan(-1)
      expect(handlesIndex).toBeGreaterThan(-1)
      expect(afterIndex).toBeGreaterThan(-1)
      expect(beforeIndex).toBeLessThan(handlesIndex)
      expect(handlesIndex).toBeLessThan(afterIndex)
    })

    it('renders the before-handles slot before the handles wrapper', () => {
      const wrapper = mountFlowNode({
        slots: {
          'before-handles': () => h('div', { 'data-testid': 'before-handles-slot' }, 'before'),
          'after-handles': () => h('div', { 'data-testid': 'after-handles-slot' }, 'after'),
        },
      })

      const children = Array.from(wrapper.element.children)
      const beforeIndex = children.findIndex(el => (el as HTMLElement).dataset.testid === 'before-handles-slot')
      const handlesIndex = children.findIndex(el => (el as HTMLElement).classList.contains('handles'))

      expect(beforeIndex).toBeGreaterThan(-1)
      expect(handlesIndex).toBeGreaterThan(-1)
      expect(beforeIndex).toBeLessThan(handlesIndex)
    })

    it('renders the after-handles slot after the handles wrapper', () => {
      const wrapper = mountFlowNode({
        slots: {
          'after-handles': () => h('div', { 'data-testid': 'after-handles-slot' }, 'after'),
        },
      })

      const children = Array.from(wrapper.element.children)
      const handlesIndex = children.findIndex(el => (el as HTMLElement).classList.contains('handles'))
      const afterIndex = children.findIndex(el => (el as HTMLElement).dataset.testid === 'after-handles-slot')

      expect(handlesIndex).toBeGreaterThan(-1)
      expect(afterIndex).toBeGreaterThan(-1)
      expect(handlesIndex).toBeLessThan(afterIndex)
    })
  })

  describe('CSS classes', () => {
    it('applies readonly class when readonly prop is true', () => {
      const wrapper = mountFlowNode({ props: { readonly: true } })
      expect(wrapper.element.classList.contains('readonly')).toBe(true)
    })

    it('does not apply readonly class when readonly prop is false', () => {
      const wrapper = mountFlowNode({ props: { readonly: false } })
      expect(wrapper.element.classList.contains('readonly')).toBe(false)
    })

    it('applies reversed class when node phase is response', () => {
      const wrapper = mountFlowNode({ nodeOverrides: { phase: 'response' } })
      expect(wrapper.element.classList.contains('reversed')).toBe(true)
    })

    it('does not apply reversed class when node phase is request', () => {
      const wrapper = mountFlowNode({ nodeOverrides: { phase: 'request' } })
      expect(wrapper.element.classList.contains('reversed')).toBe(false)
    })

    it('applies implicit class for implicit node types', () => {
      const wrapper = mountFlowNode({ nodeOverrides: { type: 'request' } })
      expect(wrapper.element.classList.contains('implicit')).toBe(true)
    })

    it('does not apply implicit class for non-implicit node types', () => {
      const wrapper = mountFlowNode()
      expect(wrapper.element.classList.contains('implicit')).toBe(false)
    })
  })

  describe('node name', () => {
    it('displays the node name for regular nodes', () => {
      const wrapper = mountFlowNode()
      expect(wrapper.find('.name').text()).toBe('test-node')
    })
  })

  describe('badge', () => {
    it('renders the badge tooltip for non-implicit nodes', () => {
      const wrapper = mountFlowNode()
      expect(wrapper.find('.k-tooltip').exists()).toBe(true)
    })

    it('does not render the badge tooltip for implicit nodes', () => {
      const wrapper = mountFlowNode({ nodeOverrides: { type: 'request' } })
      expect(wrapper.find('.k-tooltip').exists()).toBe(false)
    })
  })

  describe('error icon', () => {
    it('shows the warning icon when error prop is true', () => {
      const wrapper = mountFlowNode({ props: { error: true } })
      expect(wrapper.find('.warning-icon-stub').exists()).toBe(true)
    })

    it('does not show the warning icon when error prop is not set', () => {
      const wrapper = mountFlowNode()
      expect(wrapper.find('.warning-icon-stub').exists()).toBe(false)
    })
  })

  describe('actions slot', () => {
    it('renders actions slot content when provided', () => {
      const wrapper = mountFlowNode({
        slots: {
          actions: () => h('div', { 'data-testid': 'actions-slot' }, 'actions'),
        },
      })
      expect(wrapper.find('[data-testid="actions-slot"]').exists()).toBe(true)
    })

    it('does not render the dropdown menu when actions slot is provided', () => {
      const wrapper = mountFlowNode({
        slots: {
          actions: () => h('div', { 'data-testid': 'actions-slot' }, 'actions'),
        },
      })
      expect(wrapper.find('.k-dropdown-stub').exists()).toBe(false)
    })

    it('renders the dropdown menu when no actions slot is provided and node is not implicit', () => {
      const wrapper = mountFlowNode()
      expect(wrapper.find('.k-dropdown-stub').exists()).toBe(true)
    })

    it('does not render the dropdown menu for implicit nodes without an actions slot', () => {
      const wrapper = mountFlowNode({ nodeOverrides: { type: 'request' } })
      expect(wrapper.find('.k-dropdown-stub').exists()).toBe(false)
    })
  })
})
