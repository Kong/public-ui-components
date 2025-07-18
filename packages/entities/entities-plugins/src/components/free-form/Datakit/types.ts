import type { Component } from 'vue'
import type { ButtonProps } from '@kong/kongponents'

export type EditorMode = 'code' | 'visual'

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

export type NodeType = 'call' | 'jq' | 'exit' | 'property' | 'static'

export interface NodeMeta {
  type: NodeType
  description: string
  icon: Component
}
