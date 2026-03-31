import { v4 as uuidv4 } from 'uuid'

import { DEFAULT_CLUSTER_NODE, DEFAULT_SENTINEL_NODE } from './constants'
import {
  PartialType,
  REDIS_CONFIGURATION_SOURCE,
  type ClusterNode,
  type Identifiable,
  type RedisConfigurationDTO,
  type RedisConfigurationFields,
  type RedisConfigurationSource,
  type SentinelNode,
} from './types'
import { RedisType, AuthProvider } from './types'

type KonnectManagedRedisFlags = {
  app: 'konnect' | 'kongManager'
  isKonnectManagedRedisEnabled?: boolean
  isCloudGateway?: boolean
}

/**
 * Host must pass on list/detail configs:
 * app: 'konnect'; `isKonnectManagedRedisEnabled: true; `isCloudGateway: true` (required; otherwise legacy partials-only behavior)
 * For add-on API calls, also pass `cloudGatewaysApiBaseUrl` and `controlPlaneGeo` when needed.
 */
export const isKonnectManagedRedisEnabled = (config: KonnectManagedRedisFlags): boolean => {
  return (
    config.app === 'konnect' &&
    !!config.isKonnectManagedRedisEnabled &&
    config.isCloudGateway === true
  )
}

export const shallowCopyWithId = <T extends Record<any, any>>(node: T): Identifiable<T> => {
  return { ...node, id: uuidv4() }
}

export const shallowCopyWithoutId = <T extends { id: string }>(node: T): Omit<T, 'id'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...rest } = node
  return rest
}

export const genDefaultSentinelNode = () => shallowCopyWithId(DEFAULT_SENTINEL_NODE)

export const genDefaultClusterNode = () => shallowCopyWithId(DEFAULT_CLUSTER_NODE)

// Classify a Redis partial as Konnect-managed (add-on / managed cache) vs self-managed from API `tags`
export const inferRedisPartialManagedSource = (partial: { tags?: unknown }): RedisConfigurationSource => {
  const tags = Array.isArray(partial.tags) ? (partial.tags as unknown[]) : []
  const normalizedTags = tags
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.toLowerCase())

  return normalizedTags.includes(REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED)
    || normalizedTags.includes('managed_cache.v0')
    ? REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED
    : REDIS_CONFIGURATION_SOURCE.SELF_MANAGED
}

export const getRedisType = (fields: RedisConfigurationFields | RedisConfigurationDTO): RedisType => {
  if (fields.type === PartialType.REDIS_CE) {
    return RedisType.HOST_PORT_CE
  }

  if (fields.config.sentinel_nodes?.length) {
    return RedisType.SENTINEL
  }

  if (fields.config.cluster_nodes?.length) {
    return RedisType.CLUSTER
  }

  return RedisType.HOST_PORT_EE
}

export const mapRedisTypeToPartialType = (type: RedisType): PartialType => {
  return type === RedisType.HOST_PORT_CE ? PartialType.REDIS_CE : PartialType.REDIS_EE
}

export const standardize = {
  int<T>(value: string | number | undefined | null, defaultValue?: T): number | T {
    if (value === undefined || value === null) {
      return defaultValue as T
    }
    return parseInt(value.toString(), 10)
  },

  str<T>(value: string | number | undefined | null, defaultValue?: T): string | T {
    if (value === undefined || value === null || value === '') {
      return defaultValue as T
    }
    return value.toString()
  },

  removeIdClusterNodes(nodes: Array<Identifiable<ClusterNode>>): ClusterNode[] {
    return nodes.map(node => ({
      ...shallowCopyWithoutId(node),
      port: standardize.int(node.port)!,
    }))
  },

  removeIdFromSentinelNodes(nodes: Array<Identifiable<SentinelNode>>): SentinelNode[] {
    return nodes.map(node => ({
      ...shallowCopyWithoutId(node),
      port: standardize.int(node.port)!,
    }))
  },

  addIdToClusterNodes(nodes: ClusterNode[]): Array<Identifiable<ClusterNode>> {
    return nodes.map(shallowCopyWithId)
  },

  addIdToSentinelNodes(nodes: SentinelNode[]): Array<Identifiable<SentinelNode>> {
    return nodes.map(shallowCopyWithId)
  },

  removeNullValues<T>(obj: T): Partial<T> {
    const newObj = { ...obj }
    for (const key in newObj) {
      if (newObj[key] === null) {
        delete newObj[key]
      }
    }
    return newObj
  },

  stringToArray(value: string | null | undefined, separator = ','): string[] {
    if (!value) return []
    return value.split(separator).map((tag: string) => String(tag || '').trim()).filter((tag: string) => tag !== '')
  },

  arrayToString(value: string[] | null | undefined, separator = ', '): string {
    if (!value) return ''
    return value.join(separator)
  },
}

export const pickCloudAuthFields =
  (cloudAuth?: (RedisConfigurationFields | RedisConfigurationDTO)['config']['cloud_authentication'] | null):
    Partial<RedisConfigurationDTO['config']['cloud_authentication']> | null => {
    switch (cloudAuth?.auth_provider) {
      case AuthProvider.AWS:
        return {
          auth_provider: cloudAuth.auth_provider,
          aws_cache_name: cloudAuth.aws_cache_name,
          aws_region: cloudAuth.aws_region,
          aws_is_serverless: cloudAuth.aws_is_serverless,
          aws_access_key_id: cloudAuth.aws_access_key_id,
          aws_secret_access_key: cloudAuth.aws_secret_access_key,
          aws_assume_role_arn: cloudAuth.aws_assume_role_arn,
          aws_role_session_name: cloudAuth.aws_role_session_name,
        }
      case AuthProvider.GCP:
        return {
          auth_provider: cloudAuth.auth_provider,
          gcp_service_account_json: cloudAuth.gcp_service_account_json,
        }
      case AuthProvider.AZURE:
        return {
          auth_provider: cloudAuth.auth_provider,
          azure_client_id: cloudAuth.azure_client_id,
          azure_client_secret: cloudAuth.azure_client_secret,
          azure_tenant_id: cloudAuth.azure_tenant_id,
        }
      default:
        return null
    }
  }
