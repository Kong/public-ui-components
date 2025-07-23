import type { Component } from 'vue'
import type { ButtonProps } from '@kong/kongponents'
import type { RecordFieldSchema } from '../../../types/plugins/form-schema'

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

export type ExplicitNodeType = 'call' | 'jq' | 'exit' | 'property' | 'static'

export type ImplicitNodeType = 'request' | 'response' | 'service-request' | 'service-response'

export type NodeType = ExplicitNodeType | ImplicitNodeType

export type NodeMeta = {
  type: ExplicitNodeType
  description: string
  icon: Component
  label: string
} | {
  type: ImplicitNodeType
  description: string
  label: string
  schema?: RecordFieldSchema
}
