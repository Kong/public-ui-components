// types.ts
import type { Component } from 'vue'
import type { ButtonProps } from '@kong/kongponents'
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
}

/************************************************
 *             Plugin config types              *
 ************************************************/

export type DatakitPlugin = FreeFormPluginData<DatakitConfig>
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

export interface NodeField {
  id: FieldId
  name: FieldName
}

export type UINode = {
  name: NodeName
  phase: NodePhase
  position: { x: number, y: number }
  fields: { input?: FieldName[], output?: FieldName[] }
  expanded: { input?: boolean, output?: boolean }
}

export interface NodeInstance {
  id: NodeId
  type: NodeType
  name: NodeName
  phase: NodePhase
  position: { x: number, y: number }
  expanded: { input?: boolean, output?: boolean }
  fields: { input: NodeField[], output: NodeField[] }
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

export interface EditorState {
  nodes: NodeInstance[]
  edges: EdgeInstance[]
  /**
   * A hint to indicate if the layout (UI data) is out of sync with the configuration
   */
  needLayout: boolean
}

export interface MakeNodeInstancePayload {
  type: NodeType
  name?: NodeName
  phase?: NodePhase
  position?: { x: number, y: number }
  fields?: { input?: FieldName[], output?: FieldName[] }
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
