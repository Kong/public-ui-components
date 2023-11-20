import type { Tags } from '../../types/plugins'
import type { CommonSchemaFields } from '../../types/plugins/shared'

export interface AppRegFormSchema {
  enabled: {
    type: string
    model: string
    label: string
    textOn: string
    textOff: string
    inputType: string
    styleClasses: string
    default: boolean
  },
  name: {
    default: string
    type: string
    inputType: string
    styleClasses: string
  }
  'service-id': {
    type: string
    label: string
    styleClasses: string
    description: string
    model: string
    entity: string
    placeholder: string
    inputValues: {
      fields: string[]
    },
    help: string
  },
  tags: Tags
  protocols: {
    default: []
    type: string
    label: string
    values: {
      label: string
      value: string
    }[]
    help: string
    placeholder: string
    styleClasses: string
  },
}

export interface ApplicationRegistrationSchema extends CommonSchemaFields {
  overwriteDefault: boolean
  formSchema: AppRegFormSchema
}
