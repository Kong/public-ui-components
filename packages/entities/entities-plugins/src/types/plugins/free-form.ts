export type FreeFormPluginData<
  TConfig extends Record<string, any> = any,
  TUIData extends Record<string, any> = Record<string, any>,
> = {
  config?: TConfig
  instance_name?: string
  condition?: string | null
  partials?: Array<{ id: string, path?: string }> | null
  protocols?: string[]
  __ui_data?: TUIData
  consumer_group?: { id: string } | null
  consumer?: { id: string } | null
  enabled?: boolean
  name?: string
  route?: { id: string } | null
  service?: { id: string } | null
  tags?: string[]
}
