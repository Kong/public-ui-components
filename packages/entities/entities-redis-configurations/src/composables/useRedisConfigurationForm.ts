import { computed, reactive, ref, watch } from 'vue'
import { EntityBaseFormType, useAxios, useErrors } from '@kong-ui-public/entities-shared'

import { getRedisType, mapRedisTypeToPartialType, standardize as s } from '../helpers'
import { RedisType } from '../types'
import { DEFAULT_REDIS_TYPE } from '../constants'
import endpoints from '../partials-endpoints'

import type { KongManagerRedisConfigurationFormConfig, KonnectRedisConfigurationFormConfig, RedisConfigurationFormState, RedisConfigurationResponse } from '../types'

export type Options = {
  partialId?: string
  config: KonnectRedisConfigurationFormConfig | KongManagerRedisConfigurationFormConfig
}

export const useRedisConfigurationForm = (options: Options) => {
  const { partialId, config } = options
  const isEdit = !!partialId
  const { axiosInstance } = useAxios(config.axiosRequestConfig)
  const { getMessageFromError } = useErrors()
  const formType = computed((): EntityBaseFormType => partialId
    ? EntityBaseFormType.Edit
    : EntityBaseFormType.Create)


  const form = reactive<RedisConfigurationFormState>({
    fields: {
      name: '',
      type: mapRedisTypeToPartialType(DEFAULT_REDIS_TYPE),
      config: {
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
    },
    readonly: false,
    errorMessage: '',
  })
  const userSelectedRedisType = ref<RedisType>()
  const redisType = computed(() => {
    if (isEdit) {
      return getRedisType(form.fields)
    }
    if (userSelectedRedisType.value) {
      return userSelectedRedisType.value
    }
    return DEFAULT_REDIS_TYPE
  })

  watch(redisType, (newValue) => {
    form.fields.type = mapRedisTypeToPartialType(newValue)
  })

  const canSubmit = computed(() => {
    if (!form.fields.name.length) {
      return false
    }

    const { config } = form.fields

    switch (redisType.value) {
      case RedisType.HOST_PORT_CE:
        return config.host.length > 0 && config.port > 0
      case RedisType.HOST_PORT_EE:
        return config.host.length > 0 && config.port > 0
      case RedisType.CLUSTER:
        return !!config.cluster_nodes.length && config.cluster_nodes.every((node) => node.ip.length > 0 && node.port > 0)
      case RedisType.SENTINEL:
        return !!config.sentinel_nodes.length
          && config.sentinel_nodes.every((node) => node.host.length > 0 && node.port > 0)
          && config.sentinel_master.length > 0
          && config.sentinel_role
          && config.sentinel_role.length > 0
      default:
        throw new Error('Invalid redis type')
    }
  })

  const payload = computed(() => {
    switch (redisType.value) {
      case RedisType.HOST_PORT_CE:
        return {
          name: form.fields.name,
          type: form.fields.type,
          config: {
            host: form.fields.config.host,
            port: form.fields.config.port,
            timeout: s.int(form.fields.config.timeout),
            username: s.str(form.fields.config.username, null),
            database: s.int(form.fields.config.database),
            password: s.str(form.fields.config.password, null),
            ssl: form.fields.config.ssl,
            ssl_verify: form.fields.config.ssl_verify,
            server_name: s.str(form.fields.config.server_name, null),
          },
        }
      case RedisType.HOST_PORT_EE:
        return {
          name: form.fields.name,
          type: form.fields.type,
          config: {
            connect_timeout: s.int(form.fields.config.connect_timeout),
            connection_is_proxied: form.fields.config.connection_is_proxied,
            database: s.int(form.fields.config.database),
            host: form.fields.config.host,
            keepalive_backlog: s.int(form.fields.config.keepalive_backlog),
            keepalive_pool_size: s.int(form.fields.config.keepalive_pool_size),
            password: s.str(form.fields.config.password, null),
            port: s.int(form.fields.config.port),
            read_timeout: s.int(form.fields.config.read_timeout),
            send_timeout: s.int(form.fields.config.send_timeout),
            server_name: s.str(form.fields.config.server_name, null),
            ssl_verify: form.fields.config.ssl_verify,
            ssl: form.fields.config.ssl,
            username: s.str(form.fields.config.username, null),
          },
        }
      case RedisType.CLUSTER:
        return {
          name: form.fields.name,
          type: form.fields.type,
          config: {
            cluster_nodes: s.clusterNodes(form.fields.config.cluster_nodes),
            cluster_max_redirections: s.int(form.fields.config.cluster_max_redirections),
            username: s.str(form.fields.config.username, null),
            password: s.str(form.fields.config.password, null),
            ssl: form.fields.config.ssl,
            ssl_verify: form.fields.config.ssl_verify,
            server_name: s.str(form.fields.config.server_name, null),
            connect_timeout: s.int(form.fields.config.connect_timeout),
            send_timeout: s.int(form.fields.config.send_timeout),
            read_timeout: s.int(form.fields.config.read_timeout),
            keepalive_pool_size: s.int(form.fields.config.keepalive_pool_size),
            keepalive_backlog: s.int(form.fields.config.keepalive_backlog),
            connection_is_proxied: form.fields.config.connection_is_proxied,
          },
        }
      case RedisType.SENTINEL:
        return {
          name: form.fields.name,
          type: form.fields.type,
          config: {
            sentinel_master: s.str(form.fields.config.sentinel_master, null),
            sentinel_nodes: s.sentinelNodes(form.fields.config.sentinel_nodes),
            sentinel_role: s.str(form.fields.config.sentinel_role, null),
            username: s.str(form.fields.config.username, null),
            password: s.str(form.fields.config.password, null),
            ssl: form.fields.config.ssl,
            ssl_verify: form.fields.config.ssl_verify,
            server_name: s.str(form.fields.config.server_name, null),
            connect_timeout: s.int(form.fields.config.connect_timeout),
            send_timeout: s.int(form.fields.config.send_timeout),
            read_timeout: s.int(form.fields.config.read_timeout),
            keepalive_pool_size: s.int(form.fields.config.keepalive_pool_size),
            keepalive_backlog: s.int(form.fields.config.keepalive_backlog),
            connection_is_proxied: form.fields.config.connection_is_proxied,
          },
        }
      default:
        throw new Error('Invalid redis type')
    }
  })

  const submitUrl = computed<string>(() => {
    let url = `${config.apiBaseUrl}${endpoints.form[config.app][formType.value]}`

    if (config.app === 'konnect') {
      url = url.replace(/{controlPlaneId}/gi, config?.controlPlaneId || '')
    } else if (config.app === 'kongManager') {
      url = url.replace(/\/{workspace}/gi, config?.workspace ? `/${config.workspace}` : '')
    }

    // Always replace the id when editing
    url = url.replace(/{id}/gi, partialId || '')

    return url
  })

  const fetchUrl = computed<string>(() => endpoints.form[config?.app]?.edit)

  const submit = async () => {
    try {
      form.readonly = true
      form.errorMessage = ''

      if (formType.value === EntityBaseFormType.Create) {
        return await axiosInstance.post<RedisConfigurationResponse>(submitUrl.value, payload.value)
      } else {
        return await axiosInstance.patch<RedisConfigurationResponse>(submitUrl.value, payload.value)
      }
    } catch (e: unknown) {
      form.errorMessage = getMessageFromError(e)
      form.readonly = false
      throw e
    }
  }

  return {
    form,
    canSubmit,
    payload,
    isEdit,
    redisType,
    userSelectedRedisType,
    formType,
    fetchUrl,
    submit,
  }
}
