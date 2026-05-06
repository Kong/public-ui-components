import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { RouteLocationRaw } from 'vue-router'

export type CustomPluginFormType = 'installed' | 'streamed' | 'cloned'

export interface CustomPluginFormConfig {
  /** Route to navigate on cancel */
  cancelRoute: RouteLocationRaw
  /** Route to navigate on successful create/update */
  successRoute: RouteLocationRaw
  /** Available plugins for cloning (only needed for Cloned type) */
  clonablePlugins?: string[]
}
export type KonnectCustomPluginFormConfig = KonnectBaseFormConfig & CustomPluginFormConfig

export type KongManagerCustomPluginFormConfig = KongManagerBaseFormConfig & CustomPluginFormConfig

// API request body types

export interface InstalledPluginRequestBody {
  lua_schema: string
}

export interface StreamedPluginRequestBody {
  name: string
  schema: string
  handler: string
}

// API response types

export interface InstalledPluginResponse {
  item: {
    lua_schema: string
    name: string
    created_at: number
    updated_at: number
  }
}

export interface StreamedPluginResponse {
  id: string
  name: string
  schema: string
  handler: string
  created_at?: number
  updated_at?: number
  tags?: string[]
}

// Form payload types (emitted on success)

export interface ClonedPluginPayload {
  pluginType: 'cloned'
  sourcePlugin: string
  aliasName: string
  priority?: number
}

export interface ClonedPluginRequestBody {
  sourcePlugin: string
  aliasName: string
  priority?: number
}

export interface ClonedPluginResponse {
  ref: string
  name: string
  priority: number | null
  tags: string[] | null
  created_at: number
  updated_at: number
}
