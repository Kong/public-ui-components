import type { InjectionProtectionSchema } from '../../types/plugins/injection-protection'

export const injectionProtectionSchema: InjectionProtectionSchema = {
  'config-injection_types': {
    type: 'multiselect',
  },
  'config-locations': {
    type: 'multiselect',
  },
}
