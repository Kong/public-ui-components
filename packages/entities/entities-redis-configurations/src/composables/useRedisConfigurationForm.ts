import { computed, reactive } from 'vue'

import { Mode } from '../types'

import type { RedisConfigurationFormState } from '../types'

export const useRedisConfigurationForm = () => {
  const form = reactive<RedisConfigurationFormState>({
    fields: {
      name: '',
      mode: Mode.HOST_PORT_OPEN_SOURCE,
      port: 6379,
      host: '127.0.0.1',
      database: 0,
      username: '',
      password: '',
      ssl: false,
      ssl_verify: false,
      server_name: '',
      connect_timeout: 2000,
      send_timeout: 2000,
      read_timeout: 2000,
      sentinel_username: '',
      sentinel_password: '',
      keepalive_pool_size: 256,
      keepalive_backlog: 0,
      sentinel_master: '',
      sentinel_nodes: [],
      cluster_nodes: [],
      cluster_max_redirections: 0,
      connection_is_proxied: false,
      timeout: 2000,
    },
    readonly: false,
    errorMessage: '',
  })

  const canSubmit = computed(() => {
    return !!form.fields.name.length && !!form.fields.host
  })

  return {
    form,
    canSubmit,
  }
}
