import type { KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { RouteLocationRaw } from 'vue-router'

export type CustomPluginFormType = 'installed' | 'streamed' | 'cloned'

export interface CustomPluginFormConfig extends KonnectBaseFormConfig {
  /** Route to navigate on cancel */
  cancelRoute: RouteLocationRaw
  /** Available plugins for cloning (only needed for Cloned type) */
  clonablePlugins?: string[]
}

export interface CustomPluginFormFields {
  pluginType: CustomPluginFormType
  // installed & streamed
  schemaFile: File | null
  // streamed only
  handlerFile: File | null
  name: string
  // cloned only
  sourcePlugin: string
  aliasName: string
  priority: string
}

export interface CustomPluginFormState {
  fields: CustomPluginFormFields
  readonly: boolean
  errorMessage: string
}

export interface InstalledPluginPayload {
  pluginType: 'installed'
  schemaFile: File
}

export interface StreamedPluginPayload {
  pluginType: 'streamed'
  schemaFile: File
  handlerFile: File
  name: string
}

export interface ClonedPluginPayload {
  pluginType: 'cloned'
  sourcePlugin: string
  aliasName: string
  priority?: string
}

export type FormPayload = InstalledPluginPayload | StreamedPluginPayload | ClonedPluginPayload
