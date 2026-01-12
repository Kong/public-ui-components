import type { InjectionKey } from 'vue'

export const FEATURE_FLAGS = {
  USE_STICKY_FORM_ACTIONS: Symbol('USE_STICKY_FORM_ACTIONS') as InjectionKey<boolean>,
}
