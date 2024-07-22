interface Field {
  model?: string
  label: string
  type: string
  values?: string[]
  id?: string
  default?: string,
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
    class: string
    style: {
      minWidth: string
    }
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
}
