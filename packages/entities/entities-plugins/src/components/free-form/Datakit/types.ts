import type { Component } from 'vue'
import type { ButtonProps } from '@kong/kongponents'
import type { FreeFormPluginData } from '../../../types/plugins/free-form'
import type { HttpMethod } from './constants'

export type { HttpMethod }

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Keys extends any
  ? Omit<T, Keys> & { [K in Keys]-?: T[K] }
  : never

declare const brand: unique symbol

type Brand<T, Brand extends string> = T & { [brand]: Brand }

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

/**
 * All explicit node types recognised by Datakit.
 */
export type ConfigNodeType = 'call' | 'jq' | 'exit' | 'property' | 'static'
export type ImplicitNodeType = 'request' | 'service_request' | 'service_response' | 'response'
export type NodeType = ConfigNodeType | ImplicitNodeType

export interface FieldMeta {
  name: FieldName

  // preserved for future use
  // type: 'any' | 'string' | 'number' | 'map' | 'object'
}

export interface IOMeta {
  /**
   * Well-known I/O fields for the node.
   */
  fields: FieldMeta[]

  /**
   * Wether users can configure the I/O fields.
   */
  configurable?: boolean
}

export interface NodeMeta {
  type: NodeType
  summary?: string
  description?: string
  icon?: Component

  /**
   * I/O fields configuration for the node type.
   * * If not provided, the node type has no corresponding I/O fields.
   * * If provided empty array as fields, the node type only offers `inputs` or `outputs` as a whole.
   * * If provided with `input` and/or `output` fields, the node type has individual I/O fields.
   */
  io?: {
    input?: IOMeta
    output?: IOMeta
  }
}

/************************************************
 *             Plugin config types              *
 ************************************************/

export type DatakitPlugin = FreeFormPluginData<DatakitConfig>

/**
 * Datakit plugin configuration.
 */
export interface DatakitConfig {
  /**
   * Datakit nodes.
   *
   * * Must contain at least one element.
   */
  nodes: ConfigNode[]

  /**
   * Enable verbose debug logging.
   *
   * @default false
   */
  debug?: boolean
}

/**
 * Runtime-reserved implicit node names that must not be reused.
 */
export type ImplicitNodeName = 'request' | 'service_request' | 'service_response' | 'response'

/**
 * A label that uniquely identifies the node within the plugin
 * configuration so that it can be used for input/output connections.
 * Must be valid `snake_case` or `kebab-case`.
 *
 * * 1–255 characters
 * * Starts with a letter or “_”
 * * Contains only letters, digits, “_” or “-”
 * * Must not clash with implicit node names
 *
 * @example 'snake_case'
 * @example 'SCREAMING_SNAKE_CASE'
 * @example 'kebab-case'
 * @example 'KEBAB-CASE'
 * @example 'set-property'
 * @example 'get-property'
 * @example 'send_api_request'
 * @example 'filter_01'
 * @example 'filter_02'
 */
export type ConfigNodeName = Brand<string, 'ConfigNodeName'>
export type NodeName = ConfigNodeName | ImplicitNodeName

/**
 * The phase of the node in the request/response cycle.
 *
 * Note: Phases of implicit nodes are hardcoded and cannot be changed.
 */
export type NodePhase = 'request' | 'response'

/**
 * Base shape shared by every concrete node type.
 */
export interface BaseConfigNode {
  /**
   * Unique label for referencing the node in connections.
   */
  name: NodeName

  /**
   * The type of the node.
   */
  type: NodeType

  /**
   * node input (`NODE` or `NODE.FIELD`)
   */
  input?: NameConnection | null

  /**
   * node inputs
   */
  inputs?: Record<FieldName, NameConnection | null>
  /**
   * node output (`NODE` or `NODE.FIELD`)
   */
  output?: NameConnection | null

  /**
   * node inputs
   */
  outputs?: Record<FieldName, NameConnection | null>
}

/**
 * Make an external HTTP request.
 */
export interface CallNode extends BaseConfigNode {
  type: 'call'

  /**
   * A string representing an HTTP method, such as GET, POST, PUT, or
   * DELETE. The string must contain only uppercase letters.
   *
   * @default 'GET'
   */
  method?: HttpMethod

  /**
   * A string representing an SNI (server name indication) value for TLS.
   */
  ssl_server_name?: string

  /**
   * An integer representing a timeout in milliseconds. Must be between
   * 0 and 2^31-2.
   */
  timeout?: number

  /**
   * A string representing a URL, such as
   * `https://example.com/path/to/resource?q=search`.
   */
  url: string

  /** call node input (`NODE` or `NODE.FIELD`) */
  input?: NameConnection | null

  /**
   * call node inputs
   */
  inputs?: {
    /** HTTP request body (`NODE` or `NODE.FIELD`) */
    body?: NameConnection | null
    /** HTTP request headers (`NODE` or `NODE.FIELD`) */
    headers?: NameConnection | null
    /** HTTP request query (`NODE` or `NODE.FIELD`) */
    query?: NameConnection | null
  }

  /** call node output (`NODE` or `NODE.FIELD`) */
  output?: NameConnection | null

  /**
   * call node outputs
   */
  outputs?: {
    /** HTTP response body (`NODE` or `NODE.FIELD`) */
    body?: NameConnection | null
    /** HTTP response headers (`NODE` or `NODE.FIELD`) */
    headers?: NameConnection | null
    /** HTTP response status code (`NODE` or `NODE.FIELD`) */
    status?: NameConnection | null
  }
}

/**
 * Terminate the request and send a response to the client.
 */
export interface ExitNode extends BaseConfigNode {
  type: 'exit'

  /**
   * HTTP status code.
   * * 200–599
   *
   * @default 200
   */
  status?: number

  /**
   * When `true`, warn if headers have been sent already.
   */
  warn_headers_sent?: boolean

  /** exit node input (`NODE` or `NODE.FIELD`) */
  input?: NameConnection | null

  /**
   * exit node inputs
   */
  inputs?: {
    /** HTTP response body (`NODE` or `NODE.FIELD`) */
    body?: NameConnection | null
    /** HTTP response headers (`NODE` or `NODE.FIELD`) */
    headers?: NameConnection | null
  }
}

/**
 * Process data using `jq` syntax.
 */
export interface JqNode extends BaseConfigNode {
  type: 'jq'

  /**
   * The jq filter text. Refer to https://jqlang.org/manual/ for full
   * documentation.
   *
   * * 1–10240 characters
   */
  jq: string

  /** filter input (`NODE` or `NODE.FIELD`) */
  input?: NameConnection | null

  /**
   * filter input(s)
   */
  inputs?: Record<FieldName, NameConnection | null>

  /** filter output (`NODE` or `NODE.FIELD`) */
  output?: NameConnection | null
}

/**
 * Get or set a property.
 */
export interface PropertyNode extends BaseConfigNode {
  type: 'property'

  /**
   * The expected MIME type of the property value. When set to
   * `application/json`, SET operations JSON-encode input data before
   * writing it, and GET operations JSON-decode output data after reading
   * it. Otherwise, this setting has no effect.
   */
  content_type?:
    | 'application/json'
    | 'text/plain'
    | 'application/octet-stream'

  /**
   * The property name to get/set.
   */
  property: string

  /**
   * Property input source. When connected, this node operates in SET
   * mode and writes input data to the property. Otherwise, the node
   * operates in GET mode and reads the property.
   */
  input?: NameConnection | null

  /**
   * Property output. This can be connected regardless of whether the
   * node is operating in GET mode or SET mode.
   */
  output?: NameConnection | null
}

/**
 * Produce reusable outputs from statically-configured values.
 */
export interface StaticNode extends BaseConfigNode {
  type: 'static'

  /**
   * An object with string keys and free-form values.
   */
  values: Record<string, unknown>

  /**
   * The entire `.values` map (`NODE` or `NODE.FIELD`).
   */
  output?: NameConnection | null

  /**
   * Individual items from `.values`, referenced by key.
   */
  outputs?: Record<FieldName, NameConnection | null>
}

/**
 * Discriminated union of all node types.
 */
export type ConfigNode =
  | CallNode
  | ExitNode
  | JqNode
  | PropertyNode
  | StaticNode

/************************************************
 *             Editor global store              *
 ************************************************/

export type NodeId = `node:${number}`
export type EdgeId = `edge:${number}`
export type FieldId = `field:${number}`

export type IdConnection = NodeId | `${NodeId}.${FieldId}`
export type NameConnection = NodeName | `${NodeName}.${FieldName}`

export type FieldName = Brand<string, 'FieldName'>

export interface NodeField {
  // unique identifier that only exists during the editing session
  id: FieldId
  name: FieldName
}

export type UINode = {
  name: NodeName
  phase: NodePhase
  position: {
    x: number
    y: number
  }
  fields: {
    input?: FieldName[]
    output?: FieldName[]
  }
  expanded: {
    input?: boolean
    output?: boolean
  }
}

export interface NodeInstance {
  // unique identifier that only exists during the editing session
  id: NodeId
  type: NodeType
  name: NodeName
  phase: NodePhase
  position: {
    x: number
    y: number
  }
  expanded: {
    input?: boolean
    output?: boolean
  }
  fields: {
    input: NodeField[]
    output: NodeField[]
  }
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
