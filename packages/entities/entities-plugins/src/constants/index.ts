import type { InjectionKey } from 'vue'

export const EXPERIMENTAL_FREE_FORM_PROVIDER = Symbol('EXPERIMENTAL_FREE_FORM_PROVIDER')

export const FEATURE_FLAGS: Record<string, InjectionKey<boolean>> = {
  DATAKIT_ENABLE_FLOW_EDITOR: Symbol('DATAKIT_ENABLE_FLOW_EDITOR'),
}

export const TOASTER_PROVIDER = Symbol('TOASTER_PROVIDER')
