export type RedisConfigurationLinkedPlugin = {
  id: string
  name: string
  instance_name?: string
}

export type RedisConfigurationLinkedPluginsResponse = {
  next: string | null
  count: number
  data: RedisConfigurationLinkedPlugin[]
}
