export type FreeFormPluginData<
  TData extends Record<string, any> = any,
  TUIData extends Record<string, any> = Record<string, any>,
> = {
  config?: TData
  instance_name?: string
  partials?: Array<{ id: string, path?: string }> | null
  protocols?: string[]
  tags?: string[]
  __ui_data?: TUIData
}
