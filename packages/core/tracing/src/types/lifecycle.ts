import type { Edge, Node } from '@vue-flow/core'
import type { LifecycleNodeType } from '../constants'
import type { SpanNode } from './spans'

export interface LifecycleNodeData {
  label: string
  durationNano?: number
  type: LifecycleNodeType
  spans?: SpanNode[]
}

export interface LifecycleNode extends Node<LifecycleNodeData, any, LifecycleNodeType> {
  // Overriding as we will always provide the node data
  data: LifecycleNodeData
}

export interface LifecycleGraph {
  nodes: LifecycleNode[]
  edges: Edge[]
}
