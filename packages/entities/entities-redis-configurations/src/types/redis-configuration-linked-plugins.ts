export type RedisConfigurationLinkedPlugin = {
  id: string
  name: string
}

export type RedisConfigurationLinkedPluginsResponse = {
  next: string | null
  data: RedisConfigurationLinkedPlugin[]
}
