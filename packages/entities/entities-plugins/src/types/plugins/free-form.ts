export type FreeFormPluginData<
  TConfig extends Record<string, any> = any,
  TUIData extends Record<string, any> = Record<string, any>,
> = {
  config?: TConfig
  /**
   * Expression twins of the `expressible` fields in `config`, mirroring its
   * structure. A root-level sibling of `config`, not part of it.
   */
  expressions?: Record<string, any> | null
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
