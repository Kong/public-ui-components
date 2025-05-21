export type FreeFormPluginData<T extends Record<string, any> = any> = {
  config?: T
  instance_name?: string
  partials?: Array<{ id: string }>
  protocols?: string[]
  tags?: string[]
}
