import type { Component } from 'vue'
import type { ButtonProps } from '@kong/kongponents'

export type EditorMode = 'code' | 'flow'

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Keys extends any
  ? Omit<T, Keys> & { [K in Keys]-?: T[K] }
  : never

interface EditorModalNavItemBase {
  label: string
  icon: Component
  to?: ButtonProps['to']
  onClick?: () => void
}

export type EditorModalNavItem = RequireAtLeastOne<EditorModalNavItemBase, 'to' | 'onClick'>

const IMPLICIT_NODE_TYPES = ['request', 'response', 'service_request', 'service_response'] as const

export type UserNodeType = 'call' | 'jq' | 'exit' | 'property' | 'static'
export type ImplicitNodeType = typeof IMPLICIT_NODE_TYPES[number]

export interface NodeHandle {
  id: string
  label: string
}

export type NodeIODirection = 'lr' | 'rl'

interface BaseNodeMeta {
  /**
   * Handles for the node.
   */
  handles?: {
    input?: NodeHandle[]
    output?: NodeHandle[]
  }

  /**
   * Direction of input/output handles.
   * This affects the position of the input/output handles on the node.
   *
   * If omitted, `'lr'` (left to right) will be used.
   */
  ioDirection?: NodeIODirection
}

/**
 * Metadata for nodes that can be defined by users.
 */
export interface UserNodeMeta extends BaseNodeMeta {
  type: UserNodeType
  description: string
  icon: Component
}

/**
 * Metadata for nodes that are implicitly provided by Datakit.
 */
export interface ImplicitNodeMeta extends BaseNodeMeta {
  type: ImplicitNodeType
}

export const isImplicit = (meta: NodeMeta): meta is ImplicitNodeMeta =>
  IMPLICIT_NODE_TYPES.includes(meta.type as ImplicitNodeType)

export type NodeMeta = UserNodeMeta | ImplicitNodeMeta
