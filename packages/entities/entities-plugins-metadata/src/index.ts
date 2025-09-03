import { PluginGroup, PluginScope } from './types'

export const PLUGIN_GROUP_AND_SCOPE_MAP = {
  'basic-auth': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'hmac-auth': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'jwt-signer': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  jwt: {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'key-auth': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'key-auth-enc': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ldap-auth-advanced': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ldap-auth': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'oauth2-introspection': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  oauth2: {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'openid-connect': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'mtls-auth': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'vault-auth': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'bot-detection': {
    group: PluginGroup.SECURITY,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  cors: {
    group: PluginGroup.SECURITY,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ip-restriction': {
    group: PluginGroup.SECURITY,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  opa: {
    group: PluginGroup.SECURITY,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'kubernetes-sidecar-injector': {
    group: PluginGroup.DEPLOYMENT,
    scope: [PluginScope.GLOBAL],
  },
  'request-validator': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  acl: {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  canary: {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'forward-proxy': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'proxy-cache': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'proxy-cache-advanced': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'graphql-proxy-cache-advanced': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'rate-limiting-advanced': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'rate-limiting': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'graphql-rate-limiting-advanced': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  mocking: {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'request-size-limiting': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'request-termination': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'response-ratelimiting': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'route-by-header': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'ai-proxy': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'ai-prompt-decorator': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'ai-prompt-template': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'ai-prompt-guard': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'ai-request-transformer': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ai-response-transformer': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'ai-rate-limiting-advanced': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'ai-azure-content-safety': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'aws-lambda': {
    group: PluginGroup.SERVERLESS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'azure-functions': {
    group: PluginGroup.SERVERLESS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  openwhisk: {
    group: PluginGroup.SERVERLESS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'pre-function': {
    group: PluginGroup.SERVERLESS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'post-function': {
    group: PluginGroup.SERVERLESS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  datadog: {
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  prometheus: {
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  zipkin: {
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  collector: {
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'response-transformer-advanced': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'correlation-id': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'request-transformer-advanced': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'request-transformer': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'response-transformer': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'route-transformer-advanced': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'kafka-upstream': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  degraphql: {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'exit-transformer': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  jq: {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'file-log': {
    group: PluginGroup.LOGGING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'http-log': {
    group: PluginGroup.LOGGING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  loggly: {
    group: PluginGroup.LOGGING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'statsd-advanced': {
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  statsd: {
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  syslog: {
    group: PluginGroup.LOGGING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'tcp-log': {
    group: PluginGroup.LOGGING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'udp-log': {
    group: PluginGroup.LOGGING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'kafka-log': {
    group: PluginGroup.LOGGING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  session: {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'upstream-tls': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'application-registration': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.SERVICE],
  },
  'konnect-application-auth': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE],
  },
  acme: {
    group: PluginGroup.SECURITY,
    scope: [PluginScope.GLOBAL],
  },
  'grpc-gateway': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'grpc-web': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'upstream-timeout': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  // New in Kong 3.0
  'opentelemetry': {
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'websocket-validator': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'websocket-size-limit': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'tls-metadata-headers': {
    group: PluginGroup.SECURITY,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'tls-handshake-modifier': {
    group: PluginGroup.SECURITY,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'oas-validation': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'jwe-decrypt': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'xml-threat-protection': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  saml: {
    group: PluginGroup.SECURITY,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'app-dynamics': {
    group: PluginGroup.ANALYTICS_AND_MONITORING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'json-threat-protection': {
    group: PluginGroup.SECURITY,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'standard-webhooks': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ai-proxy-advanced': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'ai-semantic-cache': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'ai-semantic-prompt-guard': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'header-cert-auth': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'upstream-oauth': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'confluent': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'service-protection': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE],
  },
  'injection-protection': {
    group: PluginGroup.SECURITY,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  redirect: {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'kafka-consume': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'confluent-consume': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER],
  },
  'request-callout': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'ai-sanitizer': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'ai-rag-injector': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'datakit': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ai-prompt-compressor': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'solace-upstream': {
    group: PluginGroup.TRANSFORMATIONS,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ai-aws-guardrails': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'ace': {
    group: PluginGroup.AUTHENTICATION,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'solace-consume': {
    group: PluginGroup.TRAFFIC_CONTROL,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'solace-log': {
    group: PluginGroup.LOGGING,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ai-llm-as-judge': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'ai-mcp-proxy': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ai-gcp-model-armor': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
  'ai-mcp-oauth2': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE],
  },
  'ai-semantic-response-guard': {
    group: PluginGroup.AI,
    scope: [PluginScope.GLOBAL, PluginScope.SERVICE, PluginScope.ROUTE, PluginScope.CONSUMER, PluginScope.CONSUMER_GROUP],
  },
} satisfies Record<string, {
  group: PluginGroup
  scope: PluginScope[]
}>

export type PluginName = keyof typeof PLUGIN_GROUP_AND_SCOPE_MAP

export * from './types'
