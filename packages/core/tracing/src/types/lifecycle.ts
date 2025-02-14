import type { Edge, Node } from '@vue-flow/core'
import type { TranslationKey } from '../composables/useI18n'
import type { LifecycleNodeType } from '../constants'
import type { SpanNode } from './spans'

export interface LifecycleGraphNodeTree {
  client: {
    node: LifecycleNode
    in: LifecycleNode
    out: LifecycleNode
  }
  requests?: {
    node: LifecycleNode
    children: LifecycleNode[]
  }
  upstream: LifecycleNode
  responses?: {
    node: LifecycleNode
    children: LifecycleNode[]
  }
}

export interface LifecycleNodeData<T extends LifecycleNodeType = LifecycleNodeType> {
  label?: string
  type: T
  badge?: string
  durationNano?: number
  spans?: SpanNode[]
  tree?: LifecycleGraphNodeTree
  labelPlacement?: `${'top' | 'bottom'} ${'left' | 'right'}`
  labelTooltipKey?: TranslationKey
  durationTooltipKey?: TranslationKey
  showTargetHandle?: boolean
  showSourceHandle?: boolean
}

export interface LifecycleNode extends Node<LifecycleNodeData, any, LifecycleNodeType> {
  // Overriding as we will always provide the node data
  data: LifecycleNodeData
}

export interface LifecycleEdgeData {
  tooltip?: string
}

export interface LifecycleGraph {
  nodeTree: LifecycleGraphNodeTree
  nodes: LifecycleNode[]
  edges: Edge[]
}
