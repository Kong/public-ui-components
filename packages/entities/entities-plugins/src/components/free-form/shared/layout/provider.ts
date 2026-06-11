import type { Component, InjectionKey } from 'vue'
import { provide } from 'vue'
import type { FormSchema } from '../../../../types/plugins/form-schema'
import type { FreeFormPluginData } from '../../../../types/plugins/free-form'
import type { PluginValidityChangeEvent } from '../../../../types'
import type { FieldRenderer as PluginFieldRenderer, FormConfig, RenderRules } from '../types'

export type PluginFormLayoutProps<T extends FreeFormPluginData = FreeFormPluginData> = {
  /** FreeForm Schema */
  schema: FormSchema
  /** The **initial** entire plugin model, never update */
  model: T
  /** Emits the final submission payload to the parent, the payload will be merged with the `formModel` but it has high override priority */
  onFormChange: (value: Partial<T>, fields?: string[]) => void
  onValidityChange?: (event: PluginValidityChangeEvent) => void
  /** FreeForm configuration */
  formConfig?: FormConfig<T>
  renderRules?: RenderRules
  fieldRenderers?: PluginFieldRenderer[]
  pluginName: string
  /** Konnect-managed Redis UI, from plugin form config */
  isKonnectManagedRedisEnabled?: boolean
  isEditing: boolean
  /**
   * Hide the built-in form/code switcher. Plugins that own a custom switcher
   * (e.g. Datakit's flow/code control) should set this to true to avoid
   * rendering duplicate controls into #plugin-form-page-actions.
   */
  hideEditorModeSwitcher?: boolean
  /** Whether the plugin is being created for a portal developer */
  developer?: boolean
  generalInfoTitle?: string
  generalInfoDescription?: string
  pluginConfigTitle?: string
  pluginConfigDescription?: string
}

export type PluginFormLayoutComponent<T extends FreeFormPluginData = FreeFormPluginData> = Component<PluginFormLayoutProps<T>>

export const FREE_FORM_PLUGIN_LAYOUT: InjectionKey<PluginFormLayoutComponent> = Symbol.for('kong-ui-public.entities-plugins.free-form-plugin-layout')

export function useProvideFreeFormPluginLayout(layoutComponent: PluginFormLayoutComponent): void {
  provide(FREE_FORM_PLUGIN_LAYOUT, layoutComponent)
}
