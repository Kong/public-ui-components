import type { Edge, Node, SmoothStepEdgeType } from '@vue-flow/core'
import type { TranslationKey } from '../composables/useI18n'
import type { LifecycleDefaultNodeType } from '../constants'
import type { SpanNode } from './spans'

export interface LifecycleGraphNodeTree {
  client: {
    node: LifecycleDefaultNode
    in?: LifecycleDefaultNode
    out?: LifecycleDefaultNode
  }
  requests?: {
    node: LifecycleDefaultNode
    children: LifecycleDefaultNode[]
  }
  upstream?: {
    node: LifecycleDefaultNode
    in?: LifecycleDefaultNode
    out?: LifecycleDefaultNode
  }
  responses?: {
    node: LifecycleDefaultNode
    children: LifecycleDefaultNode[]
  }
  frame: LifecycleFrameNode
}

/** `node.type` */
export type LifecycleNodeType = 'default' | 'frame'

export interface LifecycleDefaultNodeData<T extends LifecycleDefaultNodeType = LifecycleDefaultNodeType> {
  label?: string
  labelKey?: TranslationKey
  type: T
  badge?: string
  durationNano?: number
  spans?: SpanNode[]
  tree?: LifecycleGraphNodeTree
  labelTooltipKey?: TranslationKey
  durationTooltipKey?: TranslationKey
  showTargetHandle?: boolean
  showSourceHandle?: boolean
  emptyGroup?: boolean
  emptyGroupMessageKey?: TranslationKey
}

export type LifecycleNodeData<T extends LifecycleNodeType = LifecycleNodeType> = T extends 'default' ? LifecycleDefaultNodeData : any

export interface LifecycleDefaultNode extends Node<LifecycleNodeData, any, LifecycleDefaultNodeType> {
  // Overriding as we will always provide the node data
  data: LifecycleNodeData
}

export type LifecycleFrameNode = Node<LifecycleNodeData<'frame'>, any, 'frame'>

export type LifecycleNode = LifecycleDefaultNode | LifecycleFrameNode

export interface LifecycleEdgeData {
  tooltip?: string
}

export interface LifecycleGraph {
  nodeTree: LifecycleGraphNodeTree
  nodes: Node[]
  edges: Edge[]
}

export type SeamlessSmoothStepEdgeType = Omit<SmoothStepEdgeType, 'type'> & { type: 'seamless-smoothstep' }
