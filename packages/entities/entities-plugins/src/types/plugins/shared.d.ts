export interface PluginBasicSchema {
  title: string
  plugin: string
  name: string
  endpoint: string
  schemaEndpoint: string
}

export interface CommonSchemaFields<P = Record<string, any>> {
  id?: string
  overwriteDefault?: boolean
  formSchema?: Record<string, any>
  fieldsToDelete?: string[] // the fields to remove from the form schema
  shamefullyTransformPayload?: (params: { payload: P } & Record<string, any>) => void
}
