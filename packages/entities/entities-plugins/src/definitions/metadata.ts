import { PluginGroup, PluginScope, type PluginMetaData } from '../types'
import { type MessageSource as I18nMessageSource } from '../composables/useI18n'
import { getColumnFields } from './schemas/typedefs'
import { aclSchema } from './schemas/ACL'
import aclsCredentialsSchema from './schemas/credentials/mockedAclSchema.json'
import { basicAuthSchema } from './schemas/BasicAuth'
import basicAuthCredentialsSchema from './schemas/credentials/mockedBasicAuthSchema.json'
import { keyAuthSchema } from './schemas/KeyAuth'
import keyAuthCredentialsSchema from './schemas/credentials/mockedKeyAuthSchema.json'
import { hmacAuthSchema } from './schemas/HMAC'
import hmacAuthCredentialsSchema from './schemas/credentials/mockedHmacAuthSchema.json'
import { jwtSecretSchema } from './schemas/JWT'
import jwtCredentialsSchema from './schemas/credentials/mockedJwtSchema.json'
import OAuth2Schema from './schemas/OAuth2'
import oauthCredentialSchema from './schemas/credentials/mockedOAuthSchema.json'
import KeyAuthEncSchema from './schemas/KeyAuthEnc'
import keyEncCredentialSchema from './schemas/credentials/mockedKeyEncAuthSchema.json'

export type StaticPluginMetaData = Omit<PluginMetaData<I18nMessageSource>, 'name' | 'description'>

/**
 * The *static* metadata of all plugins for faster access with less memory footprint.
 *
 * Please be noted that the `name` and `description` fields are not populated here, as they depends
 * on i18n resources. You may use the `usePluginMetaData` composable instead to get the localized metadata.
 */
export const PLUGIN_METADATA: Record<string, StaticPluginMetaData> = {
  'basic-auth': {
    descriptionKey: 'plugins.meta.basic-auth.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: false,
    nameKey: 'plugins.meta.basic-auth.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'hmac-auth': {
    descriptionKey: 'plugins.meta.hmac-auth.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: false,
    nameKey: 'plugins.meta.hmac-auth.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'jwt-signer': {
    descriptionKey: 'plugins.meta.jwt-signer.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: true,
    nameKey: 'plugins.meta.jwt-signer.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  jwt: {
    descriptionKey: 'plugins.meta.jwt.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: false,
    nameKey: 'plugins.meta.jwt.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'key-auth': {
    descriptionKey: 'plugins.meta.key-auth.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: false,
    nameKey: 'plugins.meta.key-auth.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'key-auth-enc': {
    descriptionKey: 'plugins.meta.key-auth-enc.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: false,
    nameKey: 'plugins.meta.key-auth-enc.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ldap-auth-advanced': {
    descriptionKey: 'plugins.meta.ldap-auth-advanced.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: true,
    nameKey: 'plugins.meta.ldap-auth-advanced.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ldap-auth': {
    descriptionKey: 'plugins.meta.ldap-auth.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: false,
    nameKey: 'plugins.meta.ldap-auth.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'oauth2-introspection': {
    descriptionKey: 'plugins.meta.oauth2-introspection.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: true,
    nameKey: 'plugins.meta.oauth2-introspection.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  oauth2: {
    descriptionKey: 'plugins.meta.oauth2.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: false,
    nameKey: 'plugins.meta.oauth2.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'openid-connect': {
    descriptionKey: 'plugins.meta.openid-connect.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: true,
    nameKey: 'plugins.meta.openid-connect.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'mtls-auth': {
    descriptionKey: 'plugins.meta.mtls-auth.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: true,
    nameKey: 'plugins.meta.mtls-auth.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'vault-auth': {
    descriptionKey: 'plugins.meta.vault-auth.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: true,
    nameKey: 'plugins.meta.vault-auth.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'bot-detection': {
    descriptionKey: 'plugins.meta.bot-detection.description',
    group: PluginGroup.SECURITY,
    isEnterprise: false,
    nameKey: 'plugins.meta.bot-detection.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  cors: {
    descriptionKey: 'plugins.meta.cors.description',
    group: PluginGroup.SECURITY,
    isEnterprise: false,
    nameKey: 'plugins.meta.cors.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ip-restriction': {
    descriptionKey: 'plugins.meta.ip-restriction.description',
    group: PluginGroup.SECURITY,
    isEnterprise: false,
    nameKey: 'plugins.meta.ip-restriction.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    fieldRules: {
      atLeastOneOf: [['config.allow', 'config.deny']],
    },
  },
  opa: {
    descriptionKey: 'plugins.meta.opa.description',
    group: PluginGroup.SECURITY,
    isEnterprise: true,
    nameKey: 'plugins.meta.opa.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'kubernetes-sidecar-injector': {
    descriptionKey: 'plugins.meta.kubernetes-sidecar-injector.description',
    group: PluginGroup.DEPLOYMENT,
    isEnterprise: false,
    nameKey: 'plugins.meta.kubernetes-sidecar-injector.name',
    scope: [PluginScope.GLOBAL],
  },
  'request-validator': {
    descriptionKey: 'plugins.meta.request-validator.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.request-validator.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    fieldRules: {
      atLeastOneOf: [['config.body_schema', 'config.parameter_schema']],
    },
  },
  acl: {
    descriptionKey: 'plugins.meta.acl.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: false,
    nameKey: 'plugins.meta.acl.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    fieldRules: {
      onlyOneOf: [['config.allow', 'config.deny']],
    },
  },
  canary: {
    descriptionKey: 'plugins.meta.canary.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.canary.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    fieldRules: {
      atLeastOneOf: [['config.upstream_uri', 'config.upstream_host', 'config.upstream_port']],
    },
  },
  'forward-proxy': {
    descriptionKey: 'plugins.meta.forward-proxy.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.forward-proxy.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    fieldRules: {
      onlyOneOfMutuallyRequired: [
        [
          ['config.http_proxy_host', 'config.http_proxy_port'],
          ['config.https_proxy_host', 'config.https_proxy_port'],
        ],
      ],
    },
  },
  'proxy-cache': {
    descriptionKey: 'plugins.meta.proxy-cache.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.proxy-cache.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'proxy-cache-advanced': {
    descriptionKey: 'plugins.meta.proxy-cache-advanced.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.proxy-cache-advanced.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    imageName: 'proxy-cache',
  },
  'graphql-proxy-cache-advanced': {
    descriptionKey: 'plugins.meta.graphql-proxy-cache-advanced.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.graphql-proxy-cache-advanced.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    imageName: 'graphql',
  },
  'rate-limiting-advanced': {
    descriptionKey: 'plugins.meta.rate-limiting-advanced.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.rate-limiting-advanced.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'rate-limiting': {
    descriptionKey: 'plugins.meta.rate-limiting.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: false,
    nameKey: 'plugins.meta.rate-limiting.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    fieldRules: {
      atLeastOneOf: [['config.second', 'config.minute', 'config.hour', 'config.day', 'config.month', 'config.year']],
    },
  },
  'graphql-rate-limiting-advanced': {
    descriptionKey: 'plugins.meta.graphql-rate-limiting-advanced.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.graphql-rate-limiting-advanced.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  mocking: {
    descriptionKey: 'plugins.meta.mocking.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.mocking.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    fieldRules: {
      atLeastOneOf: [['config.api_specification_filename', 'config.api_specification']],
    },
  },
  'request-size-limiting': {
    descriptionKey: 'plugins.meta.request-size-limiting.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: false,
    nameKey: 'plugins.meta.request-size-limiting.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'request-termination': {
    descriptionKey: 'plugins.meta.request-termination.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: false,
    nameKey: 'plugins.meta.request-termination.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'response-ratelimiting': {
    descriptionKey: 'plugins.meta.response-ratelimiting.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: false,
    nameKey: 'plugins.meta.response-ratelimiting.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'route-by-header': {
    descriptionKey: 'plugins.meta.route-by-header.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.route-by-header.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'ai-proxy': {
    descriptionKey: 'plugins.meta.ai-proxy.description',
    group: PluginGroup.AI,
    isEnterprise: true,
    nameKey: 'plugins.meta.ai-proxy.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    useLegacyForm: true,
  },
  'ai-prompt-decorator': {
    descriptionKey: 'plugins.meta.ai-prompt-decorator.description',
    group: PluginGroup.AI,
    isEnterprise: true,
    nameKey: 'plugins.meta.ai-prompt-decorator.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    useLegacyForm: true,
  },
  'ai-prompt-template': {
    descriptionKey: 'plugins.meta.ai-prompt-template.description',
    group: PluginGroup.AI,
    isEnterprise: true,
    nameKey: 'plugins.meta.ai-prompt-template.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    useLegacyForm: true,
  },
  'ai-prompt-guard': {
    descriptionKey: 'plugins.meta.ai-prompt-guard.description',
    group: PluginGroup.AI,
    isEnterprise: true,
    nameKey: 'plugins.meta.ai-prompt-guard.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    useLegacyForm: true,
  },
  'ai-request-transformer': {
    descriptionKey: 'plugins.meta.ai-request-transformer.description',
    group: PluginGroup.AI,
    isEnterprise: true,
    nameKey: 'plugins.meta.ai-request-transformer.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    useLegacyForm: true,
  },
  'ai-response-transformer': {
    descriptionKey: 'plugins.meta.ai-response-transformer.description',
    group: PluginGroup.AI,
    isEnterprise: true,
    nameKey: 'plugins.meta.ai-response-transformer.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    useLegacyForm: true,
  },
  'ai-rate-limiting-advanced': {
    descriptionKey: 'plugins.meta.ai-rate-limiting-advanced.description',
    group: PluginGroup.AI,
    isEnterprise: true,
    nameKey: 'plugins.meta.ai-rate-limiting-advanced.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    useLegacyForm: true,
  },
  'ai-azure-content-safety': {
    descriptionKey: 'plugins.meta.ai-azure-content-safety.description',
    group: PluginGroup.AI,
    isEnterprise: true,
    nameKey: 'plugins.meta.ai-azure-content-safety.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    useLegacyForm: true,
  },
  'aws-lambda': {
    descriptionKey: 'plugins.meta.aws-lambda.description',
    group: PluginGroup.SERVERLESS,
    isEnterprise: false,
    nameKey: 'plugins.meta.aws-lambda.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'azure-functions': {
    descriptionKey: 'plugins.meta.azure-functions.description',
    group: PluginGroup.SERVERLESS,
    isEnterprise: true,
    nameKey: 'plugins.meta.azure-functions.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  openwhisk: {
    descriptionKey: 'plugins.meta.openwhisk.description',
    group: PluginGroup.SERVERLESS,
    isEnterprise: false,
    nameKey: 'plugins.meta.openwhisk.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'pre-function': {
    descriptionKey: 'plugins.meta.pre-function.description',
    group: PluginGroup.SERVERLESS,
    isEnterprise: true,
    nameKey: 'plugins.meta.pre-function.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    imageName: 'kong-function',
  },
  'post-function': {
    descriptionKey: 'plugins.meta.post-function.description',
    group: PluginGroup.SERVERLESS,
    isEnterprise: true,
    nameKey: 'plugins.meta.post-function.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    imageName: 'kong-function',
  },
  datadog: {
    descriptionKey: 'plugins.meta.datadog.description',
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    isEnterprise: false,
    nameKey: 'plugins.meta.datadog.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  prometheus: {
    descriptionKey: 'plugins.meta.prometheus.description',
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    isEnterprise: true,
    nameKey: 'plugins.meta.prometheus.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  zipkin: {
    descriptionKey: 'plugins.meta.zipkin.description',
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    isEnterprise: true,
    nameKey: 'plugins.meta.zipkin.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  collector: {
    descriptionKey: 'plugins.meta.collector.description',
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    isEnterprise: true,
    nameKey: 'plugins.meta.collector.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'response-transformer-advanced': {
    descriptionKey: 'plugins.meta.response-transformer-advanced.description',
    group: PluginGroup.TRANSFORMATIONS,
    isEnterprise: false,
    nameKey: 'plugins.meta.response-transformer-advanced.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'correlation-id': {
    descriptionKey: 'plugins.meta.correlation-id.description',
    group: PluginGroup.TRANSFORMATIONS,
    isEnterprise: false,
    nameKey: 'plugins.meta.correlation-id.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'request-transformer-advanced': {
    descriptionKey: 'plugins.meta.request-transformer-advanced.description',
    group: PluginGroup.TRANSFORMATIONS,
    isEnterprise: true,
    nameKey: 'plugins.meta.request-transformer-advanced.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'request-transformer': {
    descriptionKey: 'plugins.meta.request-transformer.description',
    group: PluginGroup.TRANSFORMATIONS,
    isEnterprise: false,
    nameKey: 'plugins.meta.request-transformer.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'response-transformer': {
    descriptionKey: 'plugins.meta.response-transformer.description',
    group: PluginGroup.TRANSFORMATIONS,
    isEnterprise: false,
    nameKey: 'plugins.meta.response-transformer.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'route-transformer-advanced': {
    descriptionKey: 'plugins.meta.route-transformer-advanced.description',
    group: PluginGroup.TRANSFORMATIONS,
    isEnterprise: true,
    nameKey: 'plugins.meta.route-transformer-advanced.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    fieldRules: {
      atLeastOneOf: [['config.path', 'config.port', 'config.host']],
    },
  },
  'kafka-upstream': {
    descriptionKey: 'plugins.meta.kafka-upstream.description',
    group: PluginGroup.TRANSFORMATIONS,
    isEnterprise: true,
    nameKey: 'plugins.meta.kafka-upstream.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  degraphql: {
    descriptionKey: 'plugins.meta.degraphql.description',
    group: PluginGroup.TRANSFORMATIONS,
    isEnterprise: true,
    nameKey: 'plugins.meta.degraphql.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'exit-transformer': {
    descriptionKey: 'plugins.meta.exit-transformer.description',
    group: PluginGroup.TRANSFORMATIONS,
    isEnterprise: true,
    nameKey: 'plugins.meta.exit-transformer.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  jq: {
    descriptionKey: 'plugins.meta.jq.description',
    group: PluginGroup.TRANSFORMATIONS,
    isEnterprise: true,
    nameKey: 'plugins.meta.jq.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    fieldRules: {
      atLeastOneOf: [['config.request_jq_program', 'config.response_jq_program']],
    },
  },
  'file-log': {
    descriptionKey: 'plugins.meta.file-log.description',
    group: PluginGroup.LOGGING,
    isEnterprise: false,
    nameKey: 'plugins.meta.file-log.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'http-log': {
    descriptionKey: 'plugins.meta.http-log.description',
    group: PluginGroup.LOGGING,
    isEnterprise: false,
    nameKey: 'plugins.meta.http-log.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  loggly: {
    descriptionKey: 'plugins.meta.loggly.description',
    group: PluginGroup.LOGGING,
    isEnterprise: false,
    nameKey: 'plugins.meta.loggly.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'statsd-advanced': {
    descriptionKey: 'plugins.meta.statsd-advanced.description',
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    isEnterprise: true,
    nameKey: 'plugins.meta.statsd-advanced.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  statsd: {
    descriptionKey: 'plugins.meta.statsd.description',
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    isEnterprise: false,
    nameKey: 'plugins.meta.statsd.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  syslog: {
    descriptionKey: 'plugins.meta.syslog.description',
    group: PluginGroup.LOGGING,
    isEnterprise: false,
    nameKey: 'plugins.meta.syslog.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'tcp-log': {
    descriptionKey: 'plugins.meta.tcp-log.description',
    group: PluginGroup.LOGGING,
    isEnterprise: false,
    nameKey: 'plugins.meta.tcp-log.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'udp-log': {
    descriptionKey: 'plugins.meta.udp-log.description',
    group: PluginGroup.LOGGING,
    isEnterprise: false,
    nameKey: 'plugins.meta.udp-log.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'kafka-log': {
    descriptionKey: 'plugins.meta.kafka-log.description',
    group: PluginGroup.LOGGING,
    isEnterprise: true,
    nameKey: 'plugins.meta.kafka-log.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  session: {
    descriptionKey: 'plugins.meta.session.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: false,
    nameKey: 'plugins.meta.session.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'upstream-tls': {
    descriptionKey: 'plugins.meta.upstream-tls.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: true,
    nameKey: 'plugins.meta.upstream-tls.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'application-registration': {
    descriptionKey: 'plugins.meta.application-registration.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: true,
    nameKey: 'plugins.meta.application-registration.name',
    scope: [PluginScope.SERVICE],
  },
  'konnect-application-auth': {
    descriptionKey: 'plugins.meta.konnect-application-auth.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: false,
    nameKey: 'plugins.meta.konnect-application-auth.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE],
    imageName: 'application-registration',
  },
  acme: {
    descriptionKey: 'plugins.meta.acme.description',
    group: PluginGroup.SECURITY,
    isEnterprise: false,
    nameKey: 'plugins.meta.acme.name',
    scope: [PluginScope.GLOBAL],
  },
  'grpc-gateway': {
    descriptionKey: 'plugins.meta.grpc-gateway.description',
    group: PluginGroup.TRANSFORMATIONS,
    isEnterprise: false,
    nameKey: 'plugins.meta.grpc-gateway.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'grpc-web': {
    descriptionKey: 'plugins.meta.grpc-web.description',
    group: PluginGroup.TRANSFORMATIONS,
    isEnterprise: false,
    nameKey: 'plugins.meta.grpc-web.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'upstream-timeout': {
    descriptionKey: 'plugins.meta.upstream-timeout.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.upstream-timeout.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  // New in Kong 3.0
  opentelemetry: {
    descriptionKey: 'plugins.meta.opentelemetry.description',
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    isEnterprise: false,
    nameKey: 'plugins.meta.opentelemetry.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    fieldRules: {
      atLeastOneOf: [['config.traces_endpoint', 'config.logs_endpoint']],
    },
  },
  'websocket-validator': {
    descriptionKey: 'plugins.meta.websocket-validator.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.websocket-validator.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'websocket-size-limit': {
    descriptionKey: 'plugins.meta.websocket-size-limit.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.websocket-size-limit.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    fieldRules: {
      atLeastOneOf: [
        ['config.client_max_payload', 'config.upstream_max_payload'],
      ],
    },
  },
  'tls-metadata-headers': {
    descriptionKey: 'plugins.meta.tls-metadata-headers.description',
    group: PluginGroup.SECURITY,
    isEnterprise: true,
    nameKey: 'plugins.meta.tls-metadata-headers.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'tls-handshake-modifier': {
    descriptionKey: 'plugins.meta.tls-handshake-modifier.description',
    group: PluginGroup.SECURITY,
    isEnterprise: true,
    nameKey: 'plugins.meta.tls-handshake-modifier.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'oas-validation': {
    descriptionKey: 'plugins.meta.oas-validation.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.oas-validation.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'jwe-decrypt': {
    descriptionKey: 'plugins.meta.jwe-decrypt.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: true,
    nameKey: 'plugins.meta.jwe-decrypt.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'xml-threat-protection': {
    descriptionKey: 'plugins.meta.xml-threat-protection.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: true,
    nameKey: 'plugins.meta.xml-threat-protection.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  saml: {
    descriptionKey: 'plugins.meta.saml.description',
    group: PluginGroup.SECURITY,
    isEnterprise: true,
    nameKey: 'plugins.meta.saml.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'app-dynamics': {
    descriptionKey: 'plugins.meta.app-dynamics.description',
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    isEnterprise: true,
    nameKey: 'plugins.meta.app-dynamics.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'json-threat-protection': {
    descriptionKey: 'plugins.meta.json-threat-protection.description',
    group: PluginGroup.SECURITY,
    isEnterprise: true,
    nameKey: 'plugins.meta.json-threat-protection.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'standard-webhooks': {
    descriptionKey: 'plugins.meta.standard-webhooks.description',
    group: PluginGroup.TRAFFIC_CONTROL,
    isEnterprise: false,
    nameKey: 'plugins.meta.standard-webhooks.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ai-proxy-advanced': {
    descriptionKey: 'plugins.meta.ai-proxy-advanced.description',
    group: PluginGroup.AI,
    isEnterprise: true,
    nameKey: 'plugins.meta.ai-proxy-advanced.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    useLegacyForm: true,
  },
  'ai-semantic-cache': {
    descriptionKey: 'plugins.meta.ai-semantic-cache.description',
    group: PluginGroup.AI,
    isEnterprise: true,
    nameKey: 'plugins.meta.ai-semantic-cache.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    useLegacyForm: true,
  },
  'ai-semantic-prompt-guard': {
    descriptionKey: 'plugins.meta.ai-semantic-prompt-guard.description',
    group: PluginGroup.AI,
    isEnterprise: true,
    nameKey: 'plugins.meta.ai-semantic-prompt-guard.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    useLegacyForm: true,
  },
  'header-cert-auth': {
    descriptionKey: 'plugins.meta.header-cert-auth.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: true,
    nameKey: 'plugins.meta.header-cert-auth.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    imageName: 'tls-metadata-headers',
    fieldRules: {
      onlyOneOfMutuallyRequired: [
        [
          ['config.http_proxy_host', 'config.http_proxy_port'],
          ['config.https_proxy_host', 'config.https_proxy_port'],
        ],
      ],
    },
  },
  'upstream-oauth': {
    descriptionKey: 'plugins.meta.upstream-oauth.description',
    group: PluginGroup.AUTHENTICATION,
    isEnterprise: true,
    nameKey: 'plugins.meta.upstream-oauth.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    imageName: 'oauth2',
  },
  'confluent': {
    descriptionKey: 'plugins.meta.confluent.description',
    group: PluginGroup.TRANSFORMATIONS,
    isEnterprise: true,
    nameKey: 'plugins.meta.confluent.name',
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
}

/**
 * The *static* metadata of all credential types for faster access with less memory footprint.
 *
 * Please be noted that the `title` fields are not populated here, as they depends on i18n resources.
 * You may use the `usePluginMetaData` composable instead to get the localized metadata.
 */
export const CREDENTIAL_METADATA: Record<string, any> = {
  acl: {
    titleKey: 'plugins.meta.acl.name',
    plugin: 'acl',
    schema: aclSchema,
    nameKey: 'plugins.meta.acl.credential_name',
    endpoint: '/acls',
    schemaEndpoint: 'acls',
    fields: getColumnFields(aclSchema),
    applyCredentialButtonText: 'Add group to consumer',
  },
  'basic-auth': {
    titleKey: 'plugins.meta.basic-auth.name',
    plugin: 'basic-auth',
    schema: basicAuthSchema,
    nameKey: 'plugins.meta.basic-auth.credential_name',
    endpoint: '/basic-auth',
    schemaEndpoint: 'basicauth_credentials',
    fields: getColumnFields(basicAuthSchema),
  },
  'key-auth': {
    titleKey: 'plugins.meta.key-auth.name',
    plugin: 'key-auth',
    schema: keyAuthSchema,
    nameKey: 'plugins.meta.key-auth.credential_name',
    endpoint: '/key-auth',
    schemaEndpoint: 'keyauth_credentials',
    fields: getColumnFields(keyAuthSchema),
  },
  'key-auth-enc': {
    titleKey: 'plugins.meta.key-auth-enc.name',
    plugin: 'key-auth-enc',
    schema: KeyAuthEncSchema,
    nameKey: 'plugins.meta.key-auth-enc.credential_name',
    endpoint: '/key-auth-enc',
    schemaEndpoint: 'keyauth_enc_credentials',
    fields: getColumnFields(KeyAuthEncSchema),
  },
  oauth2: {
    titleKey: 'plugins.meta.oauth2.name',
    plugin: 'oauth2',
    schema: OAuth2Schema,
    nameKey: 'plugins.meta.oauth2.credential_name',
    endpoint: '/oauth2',
    schemaEndpoint: 'oauth2_credentials',
    fields: getColumnFields(OAuth2Schema),
  },
  'hmac-auth': {
    titleKey: 'plugins.meta.hmac-auth.name',
    plugin: 'hmac-auth',
    schema: hmacAuthSchema,
    nameKey: 'plugins.meta.hmac-auth.credential_name',
    endpoint: '/hmac-auth',
    schemaEndpoint: 'hmacauth_credentials',
    fields: getColumnFields(hmacAuthSchema),
  },
  jwt: {
    titleKey: 'plugins.meta.jwt.name',
    plugin: 'jwt',
    schema: jwtSecretSchema,
    nameKey: 'plugins.meta.jwt.credential_name',
    endpoint: '/jwt',
    schemaEndpoint: 'jwt_secrets',
    fields: {
      id: {},
      key: {},
      algorithm: {},
    },
  },
}

// Used by Konnect, since there is currently no API endpoints to fetch credential schemas from
export const CREDENTIAL_SCHEMAS: Record<string, any> = {
  acls: aclsCredentialsSchema,
  basicauth_credentials: basicAuthCredentialsSchema,
  keyauth_credentials: keyAuthCredentialsSchema,
  keyauth_enc_credentials: keyEncCredentialSchema,
  oauth2_credentials: oauthCredentialSchema,
  hmacauth_credentials: hmacAuthCredentialsSchema,
  jwt_secrets: jwtCredentialsSchema,
}

/**
 * Gets the URL for the plugin icon.
 * Plugins with optional `imageName` property will be handled automatically.
 *
 * @param name plugin name
 * @returns URL for the plugin icon
 */
export const getPluginIconURL = (name: string) => {
  const imageName = PLUGIN_METADATA[name]?.imageName || name || 'missing' // default icon is 'missing'
  const iconURL = new URL(`../assets/images/plugin-icons/${imageName}.png`, import.meta.url).href

  if (iconURL.includes('undefined')) {
    // if URL ends with /undefined or /undefined.png, return default icon
    return new URL('../assets/images/plugin-icons/missing.png', import.meta.url).href
  }
  return iconURL
}
