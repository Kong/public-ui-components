import type { FieldRenderer, RenderRules } from '../../shared/types'
import ArrayField from '../../shared/ArrayField.vue'

export const vectordbFieldRenderers: FieldRenderer[] = [
  {
    match: 'config.vectordb.redis.sentinel_nodes',
    component: ArrayField as any,
    propsOverrides: {
      appearance: 'tabs',
      itemLabel: (_: unknown, index: number) => ` #${index + 1} Sentinel node`,
    },
  },
  {
    match: 'config.vectordb.redis.cluster_nodes',
    component: ArrayField as any,
    propsOverrides: {
      appearance: 'tabs',
      itemLabel: (_: unknown, index: number) => ` #${index + 1} Cluster node`,
    },
  },
]

export const vectordbRenderRules: RenderRules = {
  bundles: [
    ['config.vectordb.strategy', 'config.vectordb.redis', 'config.vectordb.pgvector'],
  ],
  dependencies: {
    'config.vectordb.redis': ['config.vectordb.strategy', 'redis'],
    'config.vectordb.pgvector': ['config.vectordb.strategy', 'pgvector'],

    'config.vectordb.redis.cloud_authentication.aws_cache_name': ['config.vectordb.redis.cloud_authentication.auth_provider', 'aws'],
    'config.vectordb.redis.cloud_authentication.aws_region': ['config.vectordb.redis.cloud_authentication.auth_provider', 'aws'],
    'config.vectordb.redis.cloud_authentication.aws_is_serverless': ['config.vectordb.redis.cloud_authentication.auth_provider', 'aws'],
    'config.vectordb.redis.cloud_authentication.aws_access_key_id': ['config.vectordb.redis.cloud_authentication.auth_provider', 'aws'],
    'config.vectordb.redis.cloud_authentication.aws_secret_access_key': ['config.vectordb.redis.cloud_authentication.auth_provider', 'aws'],
    'config.vectordb.redis.cloud_authentication.aws_assume_role_arn': ['config.vectordb.redis.cloud_authentication.auth_provider', 'aws'],
    'config.vectordb.redis.cloud_authentication.aws_role_session_name': ['config.vectordb.redis.cloud_authentication.auth_provider', 'aws'],

    'config.vectordb.redis.cloud_authentication.gcp_service_account_json': ['config.vectordb.redis.cloud_authentication.auth_provider', 'gcp'],

    'config.vectordb.redis.cloud_authentication.azure_client_id': ['config.vectordb.redis.cloud_authentication.auth_provider', 'azure'],
    'config.vectordb.redis.cloud_authentication.azure_client_secret': ['config.vectordb.redis.cloud_authentication.auth_provider', 'azure'],
    'config.vectordb.redis.cloud_authentication.azure_tenant_id': ['config.vectordb.redis.cloud_authentication.auth_provider', 'azure'],
  },
}
