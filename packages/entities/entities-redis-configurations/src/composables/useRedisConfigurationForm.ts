import { computed, reactive, ref, watch } from 'vue'
import { EntityBaseFormType, useAxios, useErrors } from '@kong-ui-public/entities-shared'
import { isEqual } from 'lodash-es'

import { getRedisType, mapRedisTypeToPartialType, standardize as s } from '../helpers'
import { RedisType } from '../types'
import { DEFAULT_REDIS_TYPE, DEFAULT_FIELDS } from '../constants'
import endpoints from '../partials-endpoints'

import type { KongManagerRedisConfigurationFormConfig, KonnectRedisConfigurationFormConfig, RedisConfigurationFields, RedisConfigurationFormState, RedisConfigurationResponse } from '../types'

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
      config: JSON.parse(JSON.stringify(DEFAULT_FIELDS)),
    },
    readonly: false,
    errorMessage: '',
  })

  // Used to diff the form values when editing
  const initialPayload = ref<RedisConfigurationFields>()
  const redisType = ref<RedisType>(DEFAULT_REDIS_TYPE)
  const redisTypeIsEnterprise = computed(() => redisType.value === RedisType.HOST_PORT_EE || redisType.value === RedisType.CLUSTER || redisType.value === RedisType.SENTINEL)

  watch(redisType, (newValue) => {
    form.fields.type = mapRedisTypeToPartialType(newValue)
  })

  const canSubmit = computed(() => {
    if (isEdit) {
      if (isEqual(initialPayload.value, payload.value)) {
        return false
      }
    }

    if (!form.fields.name.length) {
      return false
    }

    const { config } = form.fields

    switch (redisType.value) {
      case RedisType.HOST_PORT_CE:
      case RedisType.HOST_PORT_EE:
        return config.host.length > 0 && config.port > 0
      case RedisType.CLUSTER:
        return !!config.cluster_nodes.length
          && config.cluster_nodes.every((node) => node.ip.length > 0 && node.port > 0)
      case RedisType.SENTINEL:
        return !!config.sentinel_nodes.length
          && config.sentinel_nodes.every((node) => node.host.length > 0 && node.port > 0)
          && !!config.sentinel_master?.length
          && config.sentinel_role
          && !!config.sentinel_role.length
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
            // reset other EE fields
            cluster_nodes: null,
            cluster_max_redirections: 0,
            sentinel_master: null,
            sentinel_role: null,
            sentinel_nodes: null,
          },
        }
      case RedisType.CLUSTER:
        return {
          name: form.fields.name,
          type: form.fields.type,
          config: {
            cluster_nodes: s.removeIdClusterNodes(form.fields.config.cluster_nodes),
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
            // reset other EE fields
            sentinel_master: null,
            sentinel_role: null,
            sentinel_nodes: null,
          },
        }
      case RedisType.SENTINEL:
        return {
          name: form.fields.name,
          type: form.fields.type,
          config: {
            sentinel_master: s.str(form.fields.config.sentinel_master, null),
            sentinel_nodes: s.removeIdFromSentinelNodes(form.fields.config.sentinel_nodes),
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
            // reset other EE fields
            cluster_nodes: null,
            cluster_max_redirections: 0,
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

  const setInitialFormValues = (data: RedisConfigurationResponse) => {
    form.fields.config = Object.assign({}, form.fields.config, data.config)
    form.fields.config.sentinel_nodes = s.addIdToSentinelNodes(data.config.sentinel_nodes ?? [])
    form.fields.config.cluster_nodes = s.addIdToClusterNodes(data.config.cluster_nodes ?? [])
    form.fields.name = data.name
    form.fields.type = data.type
    redisType.value = getRedisType(data)
    initialPayload.value = JSON.parse(JSON.stringify(payload.value))
  }

  return {
    form,
    canSubmit,
    payload,
    isEdit,
    redisType,
    redisTypeIsEnterprise,
    formType,
    fetchUrl,
    submit,
    setInitialFormValues,
  }
}
