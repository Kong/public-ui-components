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

export interface ItemsSchema {
  type: string,
  default?: object,
  schema: {
    fields: Field[]
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
  useKonnectSchema?: boolean
  overwriteDefault?: boolean
  formSchema?: Record<string, any>
}
