import type { OasValidationSchema } from '../../types/plugins/oas-validation'

export const oasValidationSchema: OasValidationSchema = {
  'config-api_spec': {
    label: 'Config.API Spec',
    placeholder: 'Enter an API spec',
    type: 'textArea',
    rows: 15,
    max: false,
  },
}
