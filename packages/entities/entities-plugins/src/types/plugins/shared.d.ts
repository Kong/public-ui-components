interface Field {
  model?: string
  label: string
  type: string
  values?: string[]
  id?: string
  default?: string,
  required?: boolean,
  placeholder?: string,
  hint?: string,
  help?: string,
  inputType?: 'text' | 'number'
}

interface ArrayItem extends Field {
  itemContainerComponent: string
  fieldClasses?: string
  fieldItemsClasses?: string
  inputAttributes?: {
    class?: string
    style?: {
      minWidth?: string
    },
    type?: string
    rows?: number
    max?: boolean | number
  }
}

export interface ItemsSchema {
  type: string,
  default?: object,
  schema: {
    fields: Array<Field | ArrayItem>
  }
}

export interface PluginBasicSchema {
  title: string,
  plugin: string,
  name: string,
  endpoint: string,
  schemaEndpoint: string,
}

export interface CommonSchemaFields {
  id?: string
  overwriteDefault?: boolean
  formSchema?: Record<string, any>
  shamefullyTransformPayload?: (params: { payload: Record<string, any> } & Record<string, any>) => void
}
