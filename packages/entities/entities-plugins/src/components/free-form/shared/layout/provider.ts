import type { InjectionKey } from 'vue'
import { provide } from 'vue'
import type { PluginFormLayoutComponent } from '../types'

export type {
  PluginConfigurationBaseProps,
  PluginFormLayoutComponent,
  PluginFormLayoutProps,
} from '../types'

export const FREE_FORM_PLUGIN_LAYOUT: InjectionKey<PluginFormLayoutComponent> = Symbol.for('kong-ui-public.entities-plugins.free-form-plugin-layout')

export function useProvideFreeFormPluginLayout(layoutComponent: PluginFormLayoutComponent): void {
  provide(FREE_FORM_PLUGIN_LAYOUT, layoutComponent)
}
