import {
  PLUGIN_GROUP_AND_SCOPE_MAP,
} from '@kong-ui-public/entities-plugins-metadata'
import { type PluginMetaData } from '../types'
import { type MessageSource as I18nMessageSource } from '../composables/useI18n'
import { getColumnFields } from './schemas/typedefs'
import { aclSchema } from './schemas/ACL'
import aclsCredentialsSchema from './schemas/credentials/mockedAclSchema.json'
import { basicAuthSchema } from './schemas/BasicAuth'
import basicAuthCredentialsSchema from './schemas/credentials/mockedBasicAuthSchema.json'
import { keyAuthCredentialSchema } from './schemas/KeyAuth'
import keyAuthCredentialsSchema from './schemas/credentials/mockedKeyAuthSchema.json'
import { hmacAuthSchema } from './schemas/HMAC'
import hmacAuthCredentialsSchema from './schemas/credentials/mockedHmacAuthSchema.json'
import { jwtSecretSchema } from './schemas/JWT'
import jwtCredentialsSchema from './schemas/credentials/mockedJwtSchema.json'
import OAuth2Schema from './schemas/OAuth2'
import oauthCredentialSchema from './schemas/credentials/mockedOAuthSchema.json'
import KeyAuthEncSchema from './schemas/KeyAuthEnc'
import keyEncCredentialSchema from './schemas/credentials/mockedKeyEncAuthSchema.json'

/**
 * The *static* metadata of all plugins for faster access with less memory footprint.
 *
 * Please be noted that the `name` and `description` fields are not populated here, as they depends
 * on i18n resources. You may use the `usePluginMetaData` composable instead to get the localized metadata.
 */
export const PLUGIN_METADATA: Record<string, Omit<PluginMetaData<I18nMessageSource>, 'name' | 'description'>> = {
  'basic-auth': {
    descriptionKey: 'plugins.meta.basic-auth.description',
    nameKey: 'plugins.meta.basic-auth.name',
    freeformRenderRules: {
      dependencies: {
        'config.brute_force_protection.redis': ['config.brute_force_protection.strategy', 'redis'],
      },
    },
    ...PLUGIN_GROUP_AND_SCOPE_MAP['basic-auth'],
  },
  'hmac-auth': {
    descriptionKey: 'plugins.meta.hmac-auth.description',
    nameKey: 'plugins.meta.hmac-auth.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['hmac-auth'],
  },
  'jwt-signer': {
    descriptionKey: 'plugins.meta.jwt-signer.description',
    nameKey: 'plugins.meta.jwt-signer.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['jwt-signer'],
  },
  jwt: {
    descriptionKey: 'plugins.meta.jwt.description',
    nameKey: 'plugins.meta.jwt.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.jwt,
  },
  'key-auth': {
    descriptionKey: 'plugins.meta.key-auth.description',
    nameKey: 'plugins.meta.key-auth.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['key-auth'],
  },
  'key-auth-enc': {
    descriptionKey: 'plugins.meta.key-auth-enc.description',
    nameKey: 'plugins.meta.key-auth-enc.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['key-auth-enc'],
  },
  'ldap-auth-advanced': {
    descriptionKey: 'plugins.meta.ldap-auth-advanced.description',
    nameKey: 'plugins.meta.ldap-auth-advanced.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ldap-auth-advanced'],
  },
  'ldap-auth': {
    descriptionKey: 'plugins.meta.ldap-auth.description',
    nameKey: 'plugins.meta.ldap-auth.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ldap-auth'],
  },
  'oauth2-introspection': {
    descriptionKey: 'plugins.meta.oauth2-introspection.description',
    nameKey: 'plugins.meta.oauth2-introspection.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['oauth2-introspection'],
  },
  oauth2: {
    descriptionKey: 'plugins.meta.oauth2.description',
    nameKey: 'plugins.meta.oauth2.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.oauth2,
  },
  'openid-connect': {
    descriptionKey: 'plugins.meta.openid-connect.description',
    nameKey: 'plugins.meta.openid-connect.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['openid-connect'],
  },
  'mtls-auth': {
    descriptionKey: 'plugins.meta.mtls-auth.description',
    nameKey: 'plugins.meta.mtls-auth.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['mtls-auth'],
  },
  'vault-auth': {
    descriptionKey: 'plugins.meta.vault-auth.description',
    nameKey: 'plugins.meta.vault-auth.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['vault-auth'],
  },
  'bot-detection': {
    descriptionKey: 'plugins.meta.bot-detection.description',
    nameKey: 'plugins.meta.bot-detection.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['bot-detection'],
  },
  cors: {
    descriptionKey: 'plugins.meta.cors.description',
    nameKey: 'plugins.meta.cors.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.cors,
  },
  'ip-restriction': {
    descriptionKey: 'plugins.meta.ip-restriction.description',
    nameKey: 'plugins.meta.ip-restriction.name',
    fieldRules: {
      atLeastOneOf: [['config.allow', 'config.deny']],
    },
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ip-restriction'],
  },
  opa: {
    descriptionKey: 'plugins.meta.opa.description',
    nameKey: 'plugins.meta.opa.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.opa,
  },
  'kubernetes-sidecar-injector': {
    descriptionKey: 'plugins.meta.kubernetes-sidecar-injector.description',
    nameKey: 'plugins.meta.kubernetes-sidecar-injector.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['kubernetes-sidecar-injector'],
  },
  'request-validator': {
    descriptionKey: 'plugins.meta.request-validator.description',
    nameKey: 'plugins.meta.request-validator.name',
    fieldRules: {
      atLeastOneOf: [['config.body_schema', 'config.parameter_schema']],
    },
    ...PLUGIN_GROUP_AND_SCOPE_MAP['request-validator'],
  },
  acl: {
    descriptionKey: 'plugins.meta.acl.description',
    nameKey: 'plugins.meta.acl.name',
    fieldRules: {
      onlyOneOf: [['config.allow', 'config.deny']],
    },
    ...PLUGIN_GROUP_AND_SCOPE_MAP.acl,
  },
  canary: {
    descriptionKey: 'plugins.meta.canary.description',
    nameKey: 'plugins.meta.canary.name',
    fieldRules: {
      atLeastOneOf: [['config.upstream_uri', 'config.upstream_host', 'config.upstream_port']],
    },
    ...PLUGIN_GROUP_AND_SCOPE_MAP.canary,
  },
  'forward-proxy': {
    descriptionKey: 'plugins.meta.forward-proxy.description',
    nameKey: 'plugins.meta.forward-proxy.name',
    fieldRules: {
      onlyOneOfMutuallyRequired: [
        [
          ['config.http_proxy_host', 'config.http_proxy_port'],
          ['config.https_proxy_host', 'config.https_proxy_port'],
        ],
      ],
    },
    ...PLUGIN_GROUP_AND_SCOPE_MAP['forward-proxy'],
  },
  'proxy-cache': {
    descriptionKey: 'plugins.meta.proxy-cache.description',
    nameKey: 'plugins.meta.proxy-cache.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['proxy-cache'],
  },
  'proxy-cache-advanced': {
    descriptionKey: 'plugins.meta.proxy-cache-advanced.description',
    nameKey: 'plugins.meta.proxy-cache-advanced.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['proxy-cache-advanced'],
  },
  'graphql-proxy-cache-advanced': {
    descriptionKey: 'plugins.meta.graphql-proxy-cache-advanced.description',
    nameKey: 'plugins.meta.graphql-proxy-cache-advanced.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['graphql-proxy-cache-advanced'],
  },
  'rate-limiting-advanced': {
    descriptionKey: 'plugins.meta.rate-limiting-advanced.description',
    nameKey: 'plugins.meta.rate-limiting-advanced.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['rate-limiting-advanced'],
  },
  'rate-limiting': {
    descriptionKey: 'plugins.meta.rate-limiting.description',
    nameKey: 'plugins.meta.rate-limiting.name',
    fieldRules: {
      atLeastOneOf: [['config.second', 'config.minute', 'config.hour', 'config.day', 'config.month', 'config.year']],
    },
    freeformRenderRules: {
      bundles: [
        ['config.policy', 'config.redis'],
      ],
      dependencies: {
        'config.redis': ['config.policy', 'redis'],
      },
    },
    ...PLUGIN_GROUP_AND_SCOPE_MAP['rate-limiting'],
  },
  'graphql-rate-limiting-advanced': {
    descriptionKey: 'plugins.meta.graphql-rate-limiting-advanced.description',
    nameKey: 'plugins.meta.graphql-rate-limiting-advanced.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['graphql-rate-limiting-advanced'],
  },
  mocking: {
    descriptionKey: 'plugins.meta.mocking.description',
    nameKey: 'plugins.meta.mocking.name',
    fieldRules: {
      atLeastOneOf: [['config.api_specification_filename', 'config.api_specification']],
    },
    ...PLUGIN_GROUP_AND_SCOPE_MAP.mocking,
  },
  'request-size-limiting': {
    descriptionKey: 'plugins.meta.request-size-limiting.description',
    nameKey: 'plugins.meta.request-size-limiting.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['request-size-limiting'],
  },
  'request-termination': {
    descriptionKey: 'plugins.meta.request-termination.description',
    nameKey: 'plugins.meta.request-termination.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['request-termination'],
  },
  'response-ratelimiting': {
    descriptionKey: 'plugins.meta.response-ratelimiting.description',
    nameKey: 'plugins.meta.response-ratelimiting.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['response-ratelimiting'],
  },
  'route-by-header': {
    descriptionKey: 'plugins.meta.route-by-header.description',
    nameKey: 'plugins.meta.route-by-header.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['route-by-header'],
  },
  'ai-proxy': {
    descriptionKey: 'plugins.meta.ai-proxy.description',
    nameKey: 'plugins.meta.ai-proxy.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-proxy'],
  },
  'ai-prompt-decorator': {
    descriptionKey: 'plugins.meta.ai-prompt-decorator.description',
    nameKey: 'plugins.meta.ai-prompt-decorator.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-prompt-decorator'],
  },
  'ai-prompt-template': {
    descriptionKey: 'plugins.meta.ai-prompt-template.description',
    nameKey: 'plugins.meta.ai-prompt-template.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-prompt-template'],
  },
  'ai-prompt-guard': {
    descriptionKey: 'plugins.meta.ai-prompt-guard.description',
    nameKey: 'plugins.meta.ai-prompt-guard.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-prompt-guard'],
  },
  'ai-request-transformer': {
    descriptionKey: 'plugins.meta.ai-request-transformer.description',
    nameKey: 'plugins.meta.ai-request-transformer.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-request-transformer'],
  },
  'ai-response-transformer': {
    descriptionKey: 'plugins.meta.ai-response-transformer.description',
    nameKey: 'plugins.meta.ai-response-transformer.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-response-transformer'],
  },
  'ai-rate-limiting-advanced': {
    descriptionKey: 'plugins.meta.ai-rate-limiting-advanced.description',
    nameKey: 'plugins.meta.ai-rate-limiting-advanced.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-rate-limiting-advanced'],
  },
  'ai-azure-content-safety': {
    descriptionKey: 'plugins.meta.ai-azure-content-safety.description',
    nameKey: 'plugins.meta.ai-azure-content-safety.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-azure-content-safety'],
  },
  'aws-lambda': {
    descriptionKey: 'plugins.meta.aws-lambda.description',
    nameKey: 'plugins.meta.aws-lambda.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['aws-lambda'],
  },
  'azure-functions': {
    descriptionKey: 'plugins.meta.azure-functions.description',
    nameKey: 'plugins.meta.azure-functions.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['azure-functions'],
  },
  openwhisk: {
    descriptionKey: 'plugins.meta.openwhisk.description',
    nameKey: 'plugins.meta.openwhisk.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.openwhisk,
  },
  'pre-function': {
    descriptionKey: 'plugins.meta.pre-function.description',
    nameKey: 'plugins.meta.pre-function.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['pre-function'],
  },
  'post-function': {
    descriptionKey: 'plugins.meta.post-function.description',
    nameKey: 'plugins.meta.post-function.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['post-function'],
  },
  datadog: {
    descriptionKey: 'plugins.meta.datadog.description',
    nameKey: 'plugins.meta.datadog.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.datadog,
  },
  prometheus: {
    descriptionKey: 'plugins.meta.prometheus.description',
    nameKey: 'plugins.meta.prometheus.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.prometheus,
  },
  zipkin: {
    descriptionKey: 'plugins.meta.zipkin.description',
    nameKey: 'plugins.meta.zipkin.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.zipkin,
  },
  collector: {
    descriptionKey: 'plugins.meta.collector.description',
    nameKey: 'plugins.meta.collector.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.collector,
  },
  'response-transformer-advanced': {
    descriptionKey: 'plugins.meta.response-transformer-advanced.description',
    nameKey: 'plugins.meta.response-transformer-advanced.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['response-transformer-advanced'],
  },
  'correlation-id': {
    descriptionKey: 'plugins.meta.correlation-id.description',
    nameKey: 'plugins.meta.correlation-id.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['correlation-id'],
  },
  'request-transformer-advanced': {
    descriptionKey: 'plugins.meta.request-transformer-advanced.description',
    nameKey: 'plugins.meta.request-transformer-advanced.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['request-transformer-advanced'],
  },
  'request-transformer': {
    descriptionKey: 'plugins.meta.request-transformer.description',
    nameKey: 'plugins.meta.request-transformer.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['request-transformer'],
  },
  'response-transformer': {
    descriptionKey: 'plugins.meta.response-transformer.description',
    nameKey: 'plugins.meta.response-transformer.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['response-transformer'],
  },
  'route-transformer-advanced': {
    descriptionKey: 'plugins.meta.route-transformer-advanced.description',
    nameKey: 'plugins.meta.route-transformer-advanced.name',
    fieldRules: {
      atLeastOneOf: [['config.path', 'config.port', 'config.host']],
    },
    ...PLUGIN_GROUP_AND_SCOPE_MAP['route-transformer-advanced'],
  },
  'kafka-upstream': {
    descriptionKey: 'plugins.meta.kafka-upstream.description',
    nameKey: 'plugins.meta.kafka-upstream.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['kafka-upstream'],
  },
  degraphql: {
    descriptionKey: 'plugins.meta.degraphql.description',
    nameKey: 'plugins.meta.degraphql.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.degraphql,
  },
  'exit-transformer': {
    descriptionKey: 'plugins.meta.exit-transformer.description',
    nameKey: 'plugins.meta.exit-transformer.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['exit-transformer'],
  },
  jq: {
    descriptionKey: 'plugins.meta.jq.description',
    nameKey: 'plugins.meta.jq.name',
    fieldRules: {
      atLeastOneOf: [['config.request_jq_program', 'config.response_jq_program']],
    },
    ...PLUGIN_GROUP_AND_SCOPE_MAP.jq,
  },
  'file-log': {
    descriptionKey: 'plugins.meta.file-log.description',
    nameKey: 'plugins.meta.file-log.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['file-log'],
  },
  'http-log': {
    descriptionKey: 'plugins.meta.http-log.description',
    nameKey: 'plugins.meta.http-log.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['http-log'],
  },
  loggly: {
    descriptionKey: 'plugins.meta.loggly.description',
    nameKey: 'plugins.meta.loggly.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.loggly,
  },
  'statsd-advanced': {
    descriptionKey: 'plugins.meta.statsd-advanced.description',
    nameKey: 'plugins.meta.statsd-advanced.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['statsd-advanced'],
  },
  statsd: {
    descriptionKey: 'plugins.meta.statsd.description',
    nameKey: 'plugins.meta.statsd.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.statsd,
  },
  syslog: {
    descriptionKey: 'plugins.meta.syslog.description',
    nameKey: 'plugins.meta.syslog.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.syslog,
  },
  'tcp-log': {
    descriptionKey: 'plugins.meta.tcp-log.description',
    nameKey: 'plugins.meta.tcp-log.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['tcp-log'],
  },
  'udp-log': {
    descriptionKey: 'plugins.meta.udp-log.description',
    nameKey: 'plugins.meta.udp-log.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['udp-log'],
  },
  'kafka-log': {
    descriptionKey: 'plugins.meta.kafka-log.description',
    nameKey: 'plugins.meta.kafka-log.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['kafka-log'],
  },
  session: {
    descriptionKey: 'plugins.meta.session.description',
    nameKey: 'plugins.meta.session.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.session,
  },
  'upstream-tls': {
    descriptionKey: 'plugins.meta.upstream-tls.description',
    nameKey: 'plugins.meta.upstream-tls.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['upstream-tls'],
  },
  'application-registration': {
    descriptionKey: 'plugins.meta.application-registration.description',
    nameKey: 'plugins.meta.application-registration.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['application-registration'],
  },
  'konnect-application-auth': {
    descriptionKey: 'plugins.meta.konnect-application-auth.description',
    nameKey: 'plugins.meta.konnect-application-auth.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['konnect-application-auth'],
  },
  acme: {
    descriptionKey: 'plugins.meta.acme.description',
    nameKey: 'plugins.meta.acme.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.acme,
  },
  'grpc-gateway': {
    descriptionKey: 'plugins.meta.grpc-gateway.description',
    nameKey: 'plugins.meta.grpc-gateway.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['grpc-gateway'],
  },
  'grpc-web': {
    descriptionKey: 'plugins.meta.grpc-web.description',
    nameKey: 'plugins.meta.grpc-web.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['grpc-web'],
  },
  'upstream-timeout': {
    descriptionKey: 'plugins.meta.upstream-timeout.description',
    nameKey: 'plugins.meta.upstream-timeout.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['upstream-timeout'],
  },
  // New in Kong 3.0
  opentelemetry: {
    descriptionKey: 'plugins.meta.opentelemetry.description',
    nameKey: 'plugins.meta.opentelemetry.name',
    fieldRules: {
      atLeastOneOf: [['config.access_logs_endpoint', 'config.traces_endpoint', 'config.logs_endpoint']],
    },
    ...PLUGIN_GROUP_AND_SCOPE_MAP.opentelemetry,
  },
  'websocket-validator': {
    descriptionKey: 'plugins.meta.websocket-validator.description',
    nameKey: 'plugins.meta.websocket-validator.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['websocket-validator'],
  },
  'websocket-size-limit': {
    descriptionKey: 'plugins.meta.websocket-size-limit.description',
    nameKey: 'plugins.meta.websocket-size-limit.name',
    fieldRules: {
      atLeastOneOf: [
        ['config.client_max_payload', 'config.upstream_max_payload'],
      ],
    },
    ...PLUGIN_GROUP_AND_SCOPE_MAP['websocket-size-limit'],
  },
  'tls-metadata-headers': {
    descriptionKey: 'plugins.meta.tls-metadata-headers.description',
    nameKey: 'plugins.meta.tls-metadata-headers.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['tls-metadata-headers'],
  },
  'tls-handshake-modifier': {
    descriptionKey: 'plugins.meta.tls-handshake-modifier.description',
    nameKey: 'plugins.meta.tls-handshake-modifier.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['tls-handshake-modifier'],
  },
  'oas-validation': {
    descriptionKey: 'plugins.meta.oas-validation.description',
    nameKey: 'plugins.meta.oas-validation.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['oas-validation'],
  },
  'jwe-decrypt': {
    descriptionKey: 'plugins.meta.jwe-decrypt.description',
    nameKey: 'plugins.meta.jwe-decrypt.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['jwe-decrypt'],
  },
  'xml-threat-protection': {
    descriptionKey: 'plugins.meta.xml-threat-protection.description',
    nameKey: 'plugins.meta.xml-threat-protection.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['xml-threat-protection'],
  },
  saml: {
    descriptionKey: 'plugins.meta.saml.description',
    nameKey: 'plugins.meta.saml.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.saml,
  },
  'app-dynamics': {
    descriptionKey: 'plugins.meta.app-dynamics.description',
    nameKey: 'plugins.meta.app-dynamics.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['app-dynamics'],
  },
  'json-threat-protection': {
    descriptionKey: 'plugins.meta.json-threat-protection.description',
    nameKey: 'plugins.meta.json-threat-protection.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['json-threat-protection'],
  },
  'standard-webhooks': {
    descriptionKey: 'plugins.meta.standard-webhooks.description',
    nameKey: 'plugins.meta.standard-webhooks.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['standard-webhooks'],
  },
  'ai-proxy-advanced': {
    descriptionKey: 'plugins.meta.ai-proxy-advanced.description',
    nameKey: 'plugins.meta.ai-proxy-advanced.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-proxy-advanced'],
  },
  'ai-semantic-cache': {
    descriptionKey: 'plugins.meta.ai-semantic-cache.description',
    nameKey: 'plugins.meta.ai-semantic-cache.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-semantic-cache'],
  },
  'ai-semantic-prompt-guard': {
    descriptionKey: 'plugins.meta.ai-semantic-prompt-guard.description',
    nameKey: 'plugins.meta.ai-semantic-prompt-guard.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-semantic-prompt-guard'],
  },
  'header-cert-auth': {
    descriptionKey: 'plugins.meta.header-cert-auth.description',
    nameKey: 'plugins.meta.header-cert-auth.name',
    fieldRules: {
      onlyOneOfMutuallyRequired: [
        [
          ['config.http_proxy_host', 'config.http_proxy_port'],
          ['config.https_proxy_host', 'config.https_proxy_port'],
        ],
      ],
    },
    ...PLUGIN_GROUP_AND_SCOPE_MAP['header-cert-auth'],
  },
  'upstream-oauth': {
    descriptionKey: 'plugins.meta.upstream-oauth.description',
    nameKey: 'plugins.meta.upstream-oauth.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['upstream-oauth'],
  },
  'confluent': {
    descriptionKey: 'plugins.meta.confluent.description',
    nameKey: 'plugins.meta.confluent.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.confluent,
  },
  'service-protection': {
    descriptionKey: 'plugins.meta.service-protection.description',
    nameKey: 'plugins.meta.service-protection.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['service-protection'],
  },
  'injection-protection': {
    descriptionKey: 'plugins.meta.injection-protection.description',
    nameKey: 'plugins.meta.injection-protection.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['injection-protection'],
  },
  redirect: {
    descriptionKey: 'plugins.meta.redirect.description',
    nameKey: 'plugins.meta.redirect.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP.redirect,
  },
  'kafka-consume': {
    descriptionKey: 'plugins.meta.kafka-consume.description',
    nameKey: 'plugins.meta.kafka-consume.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['kafka-consume'],
  },
  'confluent-consume': {
    descriptionKey: 'plugins.meta.confluent-consume.description',
    nameKey: 'plugins.meta.confluent-consume.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['confluent-consume'],
  },
  'request-callout': {
    descriptionKey: 'plugins.meta.request-callout.description',
    nameKey: 'plugins.meta.request-callout.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['request-callout'],
  },
  'ai-sanitizer': {
    descriptionKey: 'plugins.meta.ai-sanitizer.description',
    nameKey: 'plugins.meta.ai-sanitizer.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-sanitizer'],
  },
  'ai-rag-injector': {
    descriptionKey: 'plugins.meta.ai-rag-injector.description',
    nameKey: 'plugins.meta.ai-rag-injector.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-rag-injector'],
  },
  'datakit': {
    descriptionKey: 'plugins.meta.datakit.description',
    nameKey: 'plugins.meta.datakit.name',
    useUIData: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['datakit'],
  },
  'ai-prompt-compressor': {
    descriptionKey: 'plugins.meta.ai-prompt-compressor.description',
    nameKey: 'plugins.meta.ai-prompt-compressor.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-prompt-compressor'],
  },
  'solace-upstream': {
    descriptionKey: 'plugins.meta.solace-upstream.description',
    nameKey: 'plugins.meta.solace-upstream.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['solace-upstream'],
  },
  'ai-aws-guardrails': {
    descriptionKey: 'plugins.meta.ai-aws-guardrails.description',
    nameKey: 'plugins.meta.ai-aws-guardrails.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-aws-guardrails'],
  },
  'ace': {
    descriptionKey: 'plugins.meta.ace.description',
    nameKey: 'plugins.meta.ace.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ace'],
  },
  'solace-consume': {
    descriptionKey: 'plugins.meta.solace-consume.description',
    nameKey: 'plugins.meta.solace-consume.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['solace-consume'],
  },
  'solace-log': {
    descriptionKey: 'plugins.meta.solace-log.description',
    nameKey: 'plugins.meta.solace-log.name',
    ...PLUGIN_GROUP_AND_SCOPE_MAP['solace-log'],
  },
  'ai-llm-as-judge': {
    descriptionKey: 'plugins.meta.ai-llm-as-judge.description',
    nameKey: 'plugins.meta.ai-llm-as-judge.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-llm-as-judge'],
  },
  'ai-mcp-proxy': {
    descriptionKey: 'plugins.meta.ai-mcp-proxy.description',
    nameKey: 'plugins.meta.ai-mcp-proxy.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-mcp-proxy'],
  },
  'ai-gcp-model-armor': {
    descriptionKey: 'plugins.meta.ai-gcp-model-armor.description',
    nameKey: 'plugins.meta.ai-gcp-model-armor.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-gcp-model-armor'],
  },
  'ai-mcp-oauth2': {
    descriptionKey: 'plugins.meta.ai-mcp-oauth2.description',
    nameKey: 'plugins.meta.ai-mcp-oauth2.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-mcp-oauth2'],
  },
  'ai-semantic-response-guard': {
    descriptionKey: 'plugins.meta.ai-semantic-response-guard.description',
    nameKey: 'plugins.meta.ai-semantic-response-guard.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-semantic-response-guard'],
  },
  'ai-lakera-guard': {
    descriptionKey: 'plugins.meta.ai-lakera-guard.description',
    nameKey: 'plugins.meta.ai-lakera-guard.name',
    useLegacyForm: true,
    ...PLUGIN_GROUP_AND_SCOPE_MAP['ai-lakera-guard'],
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
    schema: keyAuthCredentialSchema,
    nameKey: 'plugins.meta.key-auth.credential_name',
    endpoint: '/key-auth',
    schemaEndpoint: 'keyauth_credentials',
    fields: getColumnFields(keyAuthCredentialSchema),
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
