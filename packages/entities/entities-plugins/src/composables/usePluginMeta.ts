import type { PluginMetaData } from '../types'
import { PluginGroup, PluginScope } from '../types'
import useI18n from './useI18n'
import { getColumnFields } from './plugin-schemas/typedefs'
import { aclSchema } from './plugin-schemas/ACL'
import aclsCredentialsSchema from './plugin-schemas/credentials/mockedAclSchema.json'
import { basicAuthSchema } from './plugin-schemas/BasicAuth'
import basicAuthCredentialsSchema from './plugin-schemas/credentials/mockedBasicAuthSchema.json'
import { keyAuthSchema } from './plugin-schemas/KeyAuth'
import keyAuthCredentialsSchema from './plugin-schemas/credentials/mockedKeyAuthSchema.json'
import { hmacAuthSchema } from './plugin-schemas/HMAC'
import hmacAuthCredentialsSchema from './plugin-schemas/credentials/mockedHmacAuthSchema.json'
import { jwtSecretSchema } from './plugin-schemas/JWT'
import jwtCredentialsSchema from './plugin-schemas/credentials/mockedJwtSchema.json'
import OAuth2Schema from './plugin-schemas/OAuth2'
import oauthCredentialSchema from './plugin-schemas/credentials/mockedOAuthSchema.json'
import KeyAuthEncSchema from './plugin-schemas/KeyAuthEnc'
import keyEncCredentialSchema from './plugin-schemas/credentials/mockedKeyEncAuthSchema.json'

/**
 * Gets the URL for a plugin icon
 *
 * Note: some plugins may have icons which named differently from their names
 * (e.g. `pre-function` -> `kong-function`)
 *
 * Hint: you can use the helper `getImageName` returned by `usePluginMetaData`
 *
 * @param imageName the name of the plugin icon's image
 * @returns the URL for the plugin icon
 */
export const getPluginIconURL = (imageName: string) => {
  return new URL(`../assets/images/plugin-icons/${imageName}.png`, import.meta.url).href
}

export const usePluginMetaData = () => {
  const { i18n: { t } } = useI18n()

  const pluginMetaData: Record<string, PluginMetaData> = {
    'basic-auth': {
      description: t('plugins.meta.basic-auth.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: false,
      name: t('plugins.meta.basic-auth.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'hmac-auth': {
      description: t('plugins.meta.hmac-auth.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: false,
      name: t('plugins.meta.hmac-auth.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'jwt-signer': {
      description: t('plugins.meta.jwt-signer.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: true,
      name: t('plugins.meta.jwt-signer.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    jwt: {
      description: t('plugins.meta.jwt.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: false,
      name: t('plugins.meta.jwt.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'key-auth': {
      description: t('plugins.meta.key-auth.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: false,
      name: t('plugins.meta.key-auth.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'key-auth-enc': {
      description: t('plugins.meta.key-auth-enc.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: false,
      name: t('plugins.meta.key-auth-enc.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'ldap-auth-advanced': {
      description: t('plugins.meta.ldap-auth-advanced.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: true,
      name: t('plugins.meta.ldap-auth-advanced.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'ldap-auth': {
      description: t('plugins.meta.ldap-auth.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: false,
      name: t('plugins.meta.ldap-auth.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'oauth2-introspection': {
      description: t('plugins.meta.oauth2-introspection.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: true,
      name: t('plugins.meta.oauth2-introspection.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    oauth2: {
      description: t('plugins.meta.oauth2.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: false,
      name: t('plugins.meta.oauth2.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'openid-connect': {
      description: t('plugins.meta.openid-connect.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: true,
      name: t('plugins.meta.openid-connect.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'mtls-auth': {
      description: t('plugins.meta.mtls-auth.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: true,
      name: t('plugins.meta.mtls-auth.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'vault-auth': {
      description: t('plugins.meta.vault-auth.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: true,
      name: t('plugins.meta.vault-auth.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'bot-detection': {
      description: t('plugins.meta.bot-detection.description'),
      group: PluginGroup.SECURITY,
      isEnterprise: false,
      name: t('plugins.meta.bot-detection.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    cors: {
      description: t('plugins.meta.cors.description'),
      group: PluginGroup.SECURITY,
      isEnterprise: false,
      name: t('plugins.meta.cors.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'ip-restriction': {
      description: t('plugins.meta.ip-restriction.description'),
      group: PluginGroup.SECURITY,
      isEnterprise: false,
      name: t('plugins.meta.ip-restriction.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    },
    opa: {
      description: t('plugins.meta.opa.description'),
      group: PluginGroup.SECURITY,
      isEnterprise: true,
      name: t('plugins.meta.opa.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'kubernetes-sidecar-injector': {
      description: t('plugins.meta.kubernetes-sidecar-injector.description'),
      group: PluginGroup.DEPLOYMENT,
      isEnterprise: false,
      name: t('plugins.meta.kubernetes-sidecar-injector.name'),
      scope: [PluginScope.GLOBAL],
    },
    'request-validator': {
      description: t('plugins.meta.request-validator.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.request-validator.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    acl: {
      description: t('plugins.meta.acl.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: false,
      name: t('plugins.meta.acl.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    canary: {
      description: t('plugins.meta.canary.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.canary.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'forward-proxy': {
      description: t('plugins.meta.forward-proxy.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.forward-proxy.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'proxy-cache': {
      description: t('plugins.meta.proxy-cache.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.proxy-cache.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    },
    'proxy-cache-advanced': {
      description: t('plugins.meta.proxy-cache-advanced.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.proxy-cache-advanced.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
      imageName: 'proxy-cache',
    },
    'graphql-proxy-cache-advanced': {
      description: t('plugins.meta.graphql-proxy-cache-advanced.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.graphql-proxy-cache-advanced.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
      imageName: 'graphql',
    },
    'rate-limiting-advanced': {
      description: t('plugins.meta.rate-limiting-advanced.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.rate-limiting-advanced.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    },
    'rate-limiting': {
      description: t('plugins.meta.rate-limiting.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: false,
      name: t('plugins.meta.rate-limiting.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    },
    'graphql-rate-limiting-advanced': {
      description: t('plugins.meta.graphql-rate-limiting-advanced.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.graphql-rate-limiting-advanced.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    mocking: {
      description: t('plugins.meta.mocking.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.mocking.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'request-size-limiting': {
      description: t('plugins.meta.request-size-limiting.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: false,
      name: t('plugins.meta.request-size-limiting.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'request-termination': {
      description: t('plugins.meta.request-termination.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: false,
      name: t('plugins.meta.request-termination.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    },
    'response-ratelimiting': {
      description: t('plugins.meta.response-ratelimiting.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: false,
      name: t('plugins.meta.response-ratelimiting.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'route-by-header': {
      description: t('plugins.meta.route-by-header.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.route-by-header.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'ai-proxy': {
      description: t('plugins.meta.ai-proxy.description'),
      group: PluginGroup.SERVERLESS,
      isEnterprise: true,
      name: t('plugins.meta.ai-proxy.name'),
      scope: [PluginScope.ROUTE],
    },
    'ai-prompt-decorator': {
      description: t('plugins.meta.ai-prompt-decorator.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: true,
      name: t('plugins.meta.ai-prompt-decorator.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'ai-prompt-template': {
      description: t('plugins.meta.ai-prompt-template.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: true,
      name: t('plugins.meta.ai-prompt-template.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'ai-prompt-guard': {
      description: t('plugins.meta.ai-prompt-guard.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.ai-prompt-guard.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'ai-request-transformer': {
      description: t('plugins.meta.ai-request-transformer.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: true,
      name: t('plugins.meta.ai-request-transformer.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'ai-response-transformer': {
      description: t('plugins.meta.ai-response-transformer.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: true,
      name: t('plugins.meta.ai-response-transformer.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'aws-lambda': {
      description: t('plugins.meta.aws-lambda.description'),
      group: PluginGroup.SERVERLESS,
      isEnterprise: false,
      name: t('plugins.meta.aws-lambda.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'azure-functions': {
      description: t('plugins.meta.azure-functions.description'),
      group: PluginGroup.SERVERLESS,
      isEnterprise: true,
      name: t('plugins.meta.azure-functions.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    openwhisk: {
      description: t('plugins.meta.openwhisk.description'),
      group: PluginGroup.SERVERLESS,
      isEnterprise: false,
      name: t('plugins.meta.openwhisk.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'pre-function': {
      description: t('plugins.meta.pre-function.description'),
      group: PluginGroup.SERVERLESS,
      isEnterprise: true,
      name: t('plugins.meta.pre-function.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
      imageName: 'kong-function',
    },
    'post-function': {
      description: t('plugins.meta.post-function.description'),
      group: PluginGroup.SERVERLESS,
      isEnterprise: true,
      name: t('plugins.meta.post-function.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
      imageName: 'kong-function',
    },
    datadog: {
      description: t('plugins.meta.datadog.description'),
      group: PluginGroup.ANALYTICS_AND_MONITORING,
      isEnterprise: false,
      name: t('plugins.meta.datadog.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    prometheus: {
      description: t('plugins.meta.prometheus.description'),
      group: PluginGroup.ANALYTICS_AND_MONITORING,
      isEnterprise: true,
      name: t('plugins.meta.prometheus.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    zipkin: {
      description: t('plugins.meta.zipkin.description'),
      group: PluginGroup.ANALYTICS_AND_MONITORING,
      isEnterprise: true,
      name: t('plugins.meta.zipkin.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    collector: {
      description: t('plugins.meta.collector.description'),
      group: PluginGroup.ANALYTICS_AND_MONITORING,
      isEnterprise: true,
      name: t('plugins.meta.collector.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'response-transformer-advanced': {
      description: t('plugins.meta.response-transformer-advanced.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: false,
      name: t('plugins.meta.response-transformer-advanced.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    },
    'correlation-id': {
      description: t('plugins.meta.correlation-id.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: false,
      name: t('plugins.meta.correlation-id.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'request-transformer-advanced': {
      description: t('plugins.meta.request-transformer-advanced.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: true,
      name: t('plugins.meta.request-transformer-advanced.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    },
    'request-transformer': {
      description: t('plugins.meta.request-transformer.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: false,
      name: t('plugins.meta.request-transformer.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    },
    'response-transformer': {
      description: t('plugins.meta.response-transformer.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: false,
      name: t('plugins.meta.response-transformer.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
    },
    'route-transformer-advanced': {
      description: t('plugins.meta.route-transformer-advanced.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: true,
      name: t('plugins.meta.route-transformer-advanced.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'kafka-upstream': {
      description: t('plugins.meta.kafka-upstream.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: true,
      name: t('plugins.meta.kafka-upstream.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    degraphql: {
      description: t('plugins.meta.degraphql.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: true,
      name: t('plugins.meta.degraphql.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'exit-transformer': {
      description: t('plugins.meta.exit-transformer.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: true,
      name: t('plugins.meta.exit-transformer.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
      imageName: 'exit-transformer',
    },
    jq: {
      description: t('plugins.meta.jq.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: true,
      name: t('plugins.meta.jq.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
      imageName: 'jq',
    },
    'file-log': {
      description: t('plugins.meta.file-log.description'),
      group: PluginGroup.LOGGING,
      isEnterprise: false,
      name: t('plugins.meta.file-log.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'http-log': {
      description: t('plugins.meta.http-log.description'),
      group: PluginGroup.LOGGING,
      isEnterprise: false,
      name: t('plugins.meta.http-log.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    loggly: {
      description: t('plugins.meta.loggly.description'),
      group: PluginGroup.LOGGING,
      isEnterprise: false,
      name: t('plugins.meta.loggly.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'statsd-advanced': {
      description: t('plugins.meta.statsd-advanced.description'),
      group: PluginGroup.ANALYTICS_AND_MONITORING,
      isEnterprise: true,
      name: t('plugins.meta.statsd-advanced.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    statsd: {
      description: t('plugins.meta.statsd.description'),
      group: PluginGroup.ANALYTICS_AND_MONITORING,
      isEnterprise: false,
      name: t('plugins.meta.statsd.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    syslog: {
      description: t('plugins.meta.syslog.description'),
      group: PluginGroup.LOGGING,
      isEnterprise: false,
      name: t('plugins.meta.syslog.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'tcp-log': {
      description: t('plugins.meta.tcp-log.description'),
      group: PluginGroup.LOGGING,
      isEnterprise: false,
      name: t('plugins.meta.tcp-log.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'udp-log': {
      description: t('plugins.meta.udp-log.description'),
      group: PluginGroup.LOGGING,
      isEnterprise: false,
      name: t('plugins.meta.udp-log.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'kafka-log': {
      description: t('plugins.meta.kafka-log.description'),
      group: PluginGroup.LOGGING,
      isEnterprise: true,
      name: t('plugins.meta.kafka-log.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    session: {
      description: t('plugins.meta.session.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: false,
      name: t('plugins.meta.session.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'upstream-tls': {
      description: t('plugins.meta.upstream-tls.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: true,
      name: t('plugins.meta.upstream-tls.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'application-registration': {
      description: t('plugins.meta.application-registration.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: true,
      name: t('plugins.meta.application-registration.name'),
      scope: [PluginScope.SERVICE],
    },
    'konnect-application-auth': {
      description: t('plugins.meta.konnect-application-auth.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: false,
      name: t('plugins.meta.konnect-application-auth.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE],
      imageName: 'application-registration',
    },
    acme: {
      description: t('plugins.meta.acme.description'),
      group: PluginGroup.SECURITY,
      isEnterprise: false,
      name: t('plugins.meta.acme.name'),
      scope: [PluginScope.GLOBAL],
    },
    'grpc-gateway': {
      description: t('plugins.meta.grpc-gateway.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: false,
      name: t('plugins.meta.grpc-gateway.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'grpc-web': {
      description: t('plugins.meta.grpc-web.description'),
      group: PluginGroup.TRANSFORMATIONS,
      isEnterprise: false,
      name: t('plugins.meta.grpc-web.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'upstream-timeout': {
      description: t('plugins.meta.upstream-timeout.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.upstream-timeout.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    // New in Kong 3.0
    opentelemetry: {
      description: t('plugins.meta.opentelemetry.description'),
      group: PluginGroup.ANALYTICS_AND_MONITORING,
      isEnterprise: false,
      name: t('plugins.meta.opentelemetry.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'websocket-validator': {
      description: t('plugins.meta.websocket-validator.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.websocket-validator.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'websocket-size-limit': {
      description: t('plugins.meta.websocket-size-limit.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.websocket-size-limit.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'tls-metadata-headers': {
      description: t('plugins.meta.tls-metadata-headers.description'),
      group: PluginGroup.SECURITY,
      isEnterprise: true,
      name: t('plugins.meta.tls-metadata-headers.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'tls-handshake-modifier': {
      description: t('plugins.meta.tls-handshake-modifier.description'),
      group: PluginGroup.SECURITY,
      isEnterprise: true,
      name: t('plugins.meta.tls-handshake-modifier.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'oas-validation': {
      description: t('plugins.meta.oas-validation.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.oas-validation.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    'jwe-decrypt': {
      description: t('plugins.meta.jwe-decrypt.description'),
      group: PluginGroup.AUTHENTICATION,
      isEnterprise: true,
      name: t('plugins.meta.jwe-decrypt.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'xml-threat-protection': {
      description: t('plugins.meta.xml-threat-protection.description'),
      group: PluginGroup.TRAFFIC_CONTROL,
      isEnterprise: true,
      name: t('plugins.meta.xml-threat-protection.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
    saml: {
      description: t('plugins.meta.saml.description'),
      group: PluginGroup.SECURITY,
      isEnterprise: true,
      name: t('plugins.meta.saml.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
    },
    'app-dynamics': {
      description: t('plugins.meta.app-dynamics.description'),
      group: PluginGroup.ANALYTICS_AND_MONITORING,
      isEnterprise: true,
      name: t('plugins.meta.app-dynamics.name'),
      scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
    },
  }

  const credentialMetaData: Record<string, any> = {
    acl: {
      title: t('plugins.meta.acl.name'),
      plugin: 'acl',
      schema: aclSchema,
      name: t('plugins.meta.acl.credential_name'),
      endpoint: '/acls',
      schemaEndpoint: 'acls',
      fields: getColumnFields(aclSchema),
      applyCredentialButtonText: 'Add group to consumer',
    },
    'basic-auth': {
      title: t('plugins.meta.basic-auth.name'),
      plugin: 'basic-auth',
      schema: basicAuthSchema,
      name: t('plugins.meta.basic-auth.credential_name'),
      endpoint: '/basic-auth',
      schemaEndpoint: 'basicauth_credentials',
      fields: getColumnFields(basicAuthSchema),
    },
    'key-auth': {
      title: t('plugins.meta.key-auth.name'),
      plugin: 'key-auth',
      schema: keyAuthSchema,
      name: t('plugins.meta.key-auth.credential_name'),
      endpoint: '/key-auth',
      schemaEndpoint: 'keyauth_credentials',
      fields: getColumnFields(keyAuthSchema),
    },
    'key-auth-enc': {
      title: t('plugins.meta.key-auth-enc.name'),
      plugin: 'key-auth-enc',
      schema: KeyAuthEncSchema,
      name: t('plugins.meta.key-auth-enc.credential_name'),
      endpoint: '/key-auth-enc',
      schemaEndpoint: 'keyauth_enc_credentials',
      fields: getColumnFields(KeyAuthEncSchema),
    },
    oauth2: {
      title: t('plugins.meta.oauth2.name'),
      plugin: 'oauth2',
      schema: OAuth2Schema,
      name: t('plugins.meta.oauth2.credential_name'),
      endpoint: '/oauth2',
      schemaEndpoint: 'oauth2_credentials',
      fields: getColumnFields(OAuth2Schema),
    },
    'hmac-auth': {
      title: t('plugins.meta.hmac-auth.name'),
      plugin: 'hmac-auth',
      schema: hmacAuthSchema,
      name: t('plugins.meta.hmac-auth.credential_name'),
      endpoint: '/hmac-auth',
      schemaEndpoint: 'hmacauth_credentials',
      fields: getColumnFields(hmacAuthSchema),
    },
    jwt: {
      title: t('plugins.meta.jwt.name'),
      plugin: 'jwt',
      schema: jwtSecretSchema,
      name: t('plugins.meta.jwt.credential_name'),
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
  const credentialSchemas: Record<string, any> = {
    acls: aclsCredentialsSchema,
    basicauth_credentials: basicAuthCredentialsSchema,
    keyauth_credentials: keyAuthCredentialsSchema,
    keyauth_enc_credentials: keyEncCredentialSchema,
    oauth2_credentials: oauthCredentialSchema,
    hmacauth_credentials: hmacAuthCredentialsSchema,
    jwt_secrets: jwtCredentialsSchema,
  }

  const getDisplayName = (name: string) => {
    return pluginMetaData[name]?.name || name
  }

  const getImageName = (name: string) => {
    return pluginMetaData[name]?.imageName || name
  }

  return { pluginMetaData, credentialMetaData, credentialSchemas, getDisplayName, getImageName }
}
