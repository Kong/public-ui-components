// types.ts
import type { Component } from 'vue'
import type { ButtonProps } from '@kong/kongponents'
import type { Dimensions, Node, XYPosition } from '@vue-flow/core'
import type { FreeFormPluginData } from '../../../types/plugins/free-form'
import type {
  DatakitConfig,
  HttpMethod,
  ConfigNode,
  ConfigNodeType,
  ImplicitNodeType,
  NodeType,
  ImplicitNodeName,
  ConfigNodeName,
  NodeName,
  FieldName,
  NameConnection,
  CallNode,
  ExitNode,
  JqNode,
  PropertyNode,
  StaticNode,
  BranchNode,
} from './schema/strict'

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Keys extends any
  ? Omit<T, Keys> & { [K in Keys]-?: T[K] }
  : never

export type EditorMode = 'code' | 'flow'

interface EditorModalNavItemBase {
  label: string
  icon: Component
  to?: ButtonProps['to']
  onClick?: () => void
}

export type EditorModalNavItem = RequireAtLeastOne<EditorModalNavItemBase, 'to' | 'onClick'>

/************************************************
 *               Node meta types                *
 ************************************************/

export interface FieldMeta {
  name: FieldName
  // type: 'any' | 'string' | 'number' | 'map' | 'object'
}

export interface IOMeta {
  fields: FieldMeta[]
  configurable?: boolean
}

export interface NodeMeta {
  type: NodeType
  summary?: string
  description?: string
  icon?: Component
  io?: {
    input?: IOMeta
    output?: IOMeta
  }
  /** hidden in UI */
  hidden?: boolean
}

/************************************************
 *             Plugin config types              *
 ************************************************/

export type {
  DatakitConfig,
  ConfigNode,
  ConfigNodeType,
  ImplicitNodeType,
  NodeType,
  ImplicitNodeName,
  ConfigNodeName,
  NodeName,
  FieldName,
  NameConnection,
  CallNode,
  ExitNode,
  JqNode,
  PropertyNode,
  StaticNode,
  BranchNode,
  HttpMethod,
}

/**
 * UI data that stores layout data for Datakit nodes.
 *
 * This struct will be stored separately from the {@link DatakitConfig}.
 */
export interface DatakitUIData {
  /**
   * UI nodes that store data like input/output fields, positions, and other metadata.
   */
  nodes?: UINode[]
}
/**
 * The phase of the node in the request/response cycle.
 *
 * Note: Phases of implicit nodes are hardcoded and cannot be changed.
 */
export type NodePhase = 'request' | 'response'

/************************************************
 *             Editor global store              *
 ************************************************/

export type NodeId = `node:${number}`
export type EdgeId = `edge:${number}`
export type FieldId = `field:${number}`

export type IdConnection = NodeId | `${NodeId}.${FieldId}`

export type BranchGroupId = `branch-group:${number}`
export type BranchKind = 'then' | 'else'

export interface NodeField {
  id: FieldId
  name: FieldName
}

export interface UINode {
  name: NodeName
  phase: NodePhase
  position: XYPosition
  fields: { input?: FieldName[], output?: FieldName[] }
  expanded: { input?: boolean, output?: boolean }
  /** hidden in UI */
  hidden?: boolean
}

export interface BranchGroupData {
  then?: {
    position?: XYPosition
  }
  else?: {
    position?: XYPosition
  }
}

export interface BranchUINode extends UINode {
  branchGroup?: BranchGroupData
}

export type CanvasUINode = UINode | BranchUINode

export interface BaseNodeInstance {
  id: NodeId
  name: NodeName
  phase: NodePhase
  position: XYPosition
  expanded: { input?: boolean, output?: boolean }
  fields: { input: NodeField[], output: NodeField[] }
  /** hidden in UI */
  hidden?: boolean
  config?: Record<string, unknown>
}

export interface BranchNodeInstance extends BaseNodeInstance {
  type: 'branch'
  branchGroups?: BranchGroupData
}

export interface OtherNodeInstance extends BaseNodeInstance {
  type: Exclude<NodeType, 'branch'>
}

export type NodeInstance = BranchNodeInstance | OtherNodeInstance

export interface CanvasModuleNode<TNodeData = NodeInstance> extends Node<TNodeData> {
  type: 'module'
  canvasMeta: {
    depth: number
  }
}

/** This is not branch group node! */
export type CanvasBranchNode = CanvasModuleNode<BranchNodeInstance>

/** This is not branch node! */
export interface CanvasBranchGroupNode extends Node {
  type: 'branch-group'
  canvasMeta: {
    depth: number
    kind: BranchKind
    branchNode: CanvasModuleNode<BranchNodeInstance>
    size: Dimensions
  }
}

export type CanvasNode = CanvasModuleNode | CanvasBranchGroupNode

export interface ConfigEdge {
  source: NodeName
  sourceField?: FieldName
  target: NodeName
  targetField?: FieldName
}

export interface EdgeData {
  source: NodeId
  sourceField?: FieldId
  target: NodeId
  targetField?: FieldId
}

export interface EdgeInstance extends EdgeData {
  id: EdgeId
}

export interface EditorState {
  nodes: NodeInstance[]
  edges: EdgeInstance[]

  /**
   * Whether to schedule an `autoLayout` after the current state is rendered.
   */
  pendingLayout?: false | 'clearHistory' | 'keepHistory'

  /**
   * Whether to schedule a `fitView` after the current state is rendered.
   */
  pendingFitView?: boolean
}

export interface BaseMakeNodeInstancePayload {
  name?: NodeName
  phase?: NodePhase
  position?: XYPosition
  fields?: { input?: FieldName[], output?: FieldName[] }
  /** hidden in UI */
  hidden?: boolean
  config?: Record<string, unknown>
}

export interface MakeBranchNodeInstancePayload extends BaseMakeNodeInstancePayload {
  type: 'branch'
  branchGroup?: BranchGroupData
}

export interface MakeOtherNodeInstancePayload extends BaseMakeNodeInstancePayload {
  type: Exclude<NodeType, 'branch'>
}

export type MakeNodeInstancePayload = MakeBranchNodeInstancePayload | MakeOtherNodeInstancePayload

export interface CreateNodePayload extends BaseMakeNodeInstancePayload {
  type: ConfigNodeType
}

export type DragAction = 'create-node'

export interface DragPayload {
  action: DragAction
  data: {
    type: ConfigNodeType
    anchor: {
      ratioX: number
      ratioY: number
      offsetX: number
      offsetY: number
    }
  }
}

export type DatakitPluginData = FreeFormPluginData<DatakitConfig, DatakitUIData>
