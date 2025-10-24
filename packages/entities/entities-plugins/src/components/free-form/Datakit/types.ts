// types.ts
import type { Component } from 'vue'
import type { ButtonProps } from '@kong/kongponents'
import type { Edge, XYPosition, Dimensions } from '@vue-flow/core'
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
  BranchName,
  NameConnection,
  CallNode,
  ExitNode,
  JqNode,
  PropertyNode,
  StaticNode,
  CacheNode,
  BranchNode,
} from './schema/strict'

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Keys extends any
  ? Omit<T, Keys> & { [K in Keys]-?: T[K] }
  : never

export type EditorMode = 'code' | 'flow'

export type Rect = XYPosition & Dimensions

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

export interface BranchMeta {
  name: BranchName
}

export interface NextMeta {
  branches: BranchMeta[]
}

export interface NodeVisual {
  icon: Component
  colors?: {
    foreground: string
    background: string
  }
}

export interface NodeMeta extends Partial<NodeVisual> {
  type: NodeType
  summary?: string
  description?: string
  io?: {
    input?: IOMeta
    output?: IOMeta
    next?: NextMeta
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
  BranchName,
  NameConnection,
  CallNode,
  ExitNode,
  JqNode,
  PropertyNode,
  StaticNode,
  CacheNode,
  HttpMethod,
  BranchNode,
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
  groups?: UIGroup[]
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
export type GroupId = `${NodeId}:${BranchName}`
export type GroupName = `${NodeName}:${BranchName}`

export type IdConnection = NodeId | `${NodeId}.${FieldId}`

export interface BranchDragSnapshot {
  source?: 'panel' | 'canvas'
  draggingId?: NodeId | GroupId
  hitArea?: XYPosition | Rect | undefined
  activeGroupId?: GroupId
}

export interface NodeField {
  id: FieldId
  name: FieldName
}

export type UINode = {
  name: NodeName
  phase: NodePhase
  position: XYPosition
  fields: { input?: FieldName[], output?: FieldName[] }
  expanded: { input?: boolean, output?: boolean }
  /** hidden in UI */
  hidden?: boolean
}

export interface NodeInstance {
  id: NodeId
  type: NodeType
  name: NodeName
  phase: NodePhase
  position: XYPosition
  expanded: { input?: boolean, output?: boolean }
  fields: { input: NodeField[], output: NodeField[] }
  /** hidden in UI */
  hidden?: boolean
  config?: Record<string, unknown>
}

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

export interface GroupInstance {
  id: GroupId
  ownerId: NodeId
  branch: BranchName
  phase: NodePhase
  memberIds: NodeId[]
  position?: XYPosition
  dimensions?: Dimensions
}

export type FlowGroupNodeData = GroupInstance & {
  memberIds: NodeId[]
}

export type BranchEdgeData = {
  type: 'branch'
  ownerId: NodeId
  branch: BranchName
  groupId: GroupId
}

export type FlowEdge = Edge<EdgeData | BranchEdgeData>

export interface GroupLayout {
  position: XYPosition
  dimensions: Dimensions
  commit: boolean
}

export interface UIGroup {
  name: GroupName
  position: XYPosition
}

export interface EditorState {
  nodes: NodeInstance[]
  edges: EdgeInstance[]
  groups: GroupInstance[]

  /**
   * Whether to schedule an `autoLayout` after the current state is rendered.
   */
  pendingLayout?: false | 'clearHistory' | 'keepHistory'

  /**
   * Whether to schedule a `fitView` after the current state is rendered.
   */
  pendingFitView?: boolean
}

export interface MakeNodeInstancePayload {
  type: NodeType
  name?: NodeName
  phase?: NodePhase
  position?: XYPosition
  fields?: { input?: FieldName[], output?: FieldName[] }
  /** hidden in UI */
  hidden?: boolean
  config?: Record<string, unknown>
}

export interface CreateNodePayload extends MakeNodeInstancePayload {
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
