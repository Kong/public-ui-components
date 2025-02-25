import type { SecretEntityRow, EntityRow as VaultEntityRow } from '@kong-ui-public/entities-vaults'
import type { EntityRow } from '../src/types/plugin-list'

// FetcherRawResponse is the raw format of the endpoint's response
export interface FetcherRawResponse {
  data: EntityRow[];
  total: number;
  offset?: string;
}

export const plugins: FetcherRawResponse = {
  data: [
    {
      config: {},
      enabled: false,
      id: '1',
      name: 'basic-auth',
      protocols: ['http', 'https'],
      tags: ['tag1'],
      ordering: { 'before': { 'access': ['acl'] } },
      instance_name: 'instance-1',
      created_at: 1610617600,
      consumer_group: { id: 'consumer-group-1' },
      consumer: { id: 'consumer-1' },
      route: { id: 'route-1' },
      service: null,
    },
    {
      config: {},
      enabled: true,
      id: '2',
      name: 'acl',
      protocols: ['http', 'https'],
      tags: ['tag2'],
      created_at: 1610617601,
      consumer: null,
      route: null,
      service: null,
    },
  ],
  total: 2,
}

export const plugins100: any[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    config: {},
    enabled: true,
    id: `${i + 1}`,
    name: `plugin-${i + 1}`,
    protocols: ['http', 'https'],
    tags: [`tag${i + 1}`],
    ordering: {},
    created_at: 1610617601,

    consumer: null,
    route: null,
    service: null,
  }))

export const paginate = (
  plugins: any[],
  size: number,
  _offset: number,
): FetcherRawResponse => {
  const sliced = plugins.slice(_offset, _offset + size)
  const offset =
    _offset + size < plugins.length ? String(_offset + size) : undefined

  return {
    data: sliced,
    total: sliced.length,
    offset,
  }
}

/**
 * Select page data
 */

export const kmLimitedAvailablePlugins = {
  plugins: {
    enabled_in_cluster: [],
    available_on_server: {
      'hmac-auth': {
        version: '3.6.0',
        priority: 1030,
      },
      'ip-restriction': {
        version: '3.6.0',
        priority: 990,
      },
    },
  },
}

export const firstShownPlugin = 'basic-auth'
export const kmAvailablePlugins = {
  plugins: {
    enabled_in_cluster: [],
    available_on_server: {
      'hmac-auth': {
        version: '3.6.0',
        priority: 1030,
      },
      [firstShownPlugin]: {
        version: '3.6.0',
        priority: 1100,
      },
      'ip-restriction': {
        version: '3.6.0',
        priority: 990,
      },
      'request-transformer': {
        version: '3.6.0',
        priority: 801,
      },
      'response-transformer': {
        version: '3.6.0',
        priority: 800,
      },
      'request-size-limiting': {
        version: '3.6.0',
        priority: 951,
      },
      'rate-limiting': {
        version: '3.6.0',
        priority: 910,
      },
      'response-ratelimiting': {
        version: '3.6.0',
        priority: 900,
      },
      syslog: {
        version: '3.6.0',
        priority: 4,
      },
      loggly: {
        version: '3.6.0',
        priority: 6,
      },
      datadog: {
        version: '3.6.0',
        priority: 10,
      },
      'ldap-auth': {
        version: '3.6.0',
        priority: 1200,
      },
      statsd: {
        version: '3.6.0',
        priority: 11,
      },
      'bot-detection': {
        version: '3.6.0',
        priority: 2500,
      },
      'aws-lambda': {
        version: '3.6.0',
        priority: 750,
      },
      'request-termination': {
        version: '3.6.0',
        priority: 2,
      },
      prometheus: {
        version: '3.6.0',
        priority: 13,
      },
      'proxy-cache': {
        version: '3.6.0',
        priority: 100,
      },
      session: {
        version: '3.6.0',
        priority: 1900,
      },
      acme: {
        version: '3.6.0',
        priority: 1705,
      },
      'grpc-gateway': {
        version: '3.6.0',
        priority: 998,
      },
      'grpc-web': {
        version: '3.6.0',
        priority: 3,
      },
      'pre-function': {
        version: '3.6.0',
        priority: 1000000,
      },
      'post-function': {
        version: '3.6.0',
        priority: -1000,
      },
      'azure-functions': {
        version: '3.6.0',
        priority: 749,
      },
      zipkin: {
        version: '3.6.0',
        priority: 100000,
      },
      opentelemetry: {
        version: '3.6.0',
        priority: 14,
      },
      'key-auth': {
        version: '3.6.0',
        priority: 1250,
      },
      'http-log': {
        version: '3.6.0',
        priority: 12,
      },
      'file-log': {
        version: '3.6.0',
        priority: 9,
      },
      'udp-log': {
        version: '3.6.0',
        priority: 8,
      },
      'tcp-log': {
        version: '3.6.0',
        priority: 7,
      },
      oauth2: {
        version: '3.6.0',
        priority: 1400,
      },
      cors: {
        version: '3.6.0',
        priority: 2000,
      },
      'correlation-id': {
        version: '3.6.0',
        priority: 100001,
      },
      acl: {
        version: '3.6.0',
        priority: 950,
      },
      jwt: {
        version: '3.6.0',
        priority: 1450,
      },
      'tls-metadata-headers': {
        version: '3.6.0',
        priority: 996,
      },
      saml: {
        version: '3.6.0',
        priority: 900,
      },
      'xml-threat-protection': {
        version: '3.6.0',
        priority: 999,
      },
      'jwe-decrypt': {
        version: '3.6.0',
        priority: 1999,
      },
      'oas-validation': {
        version: '3.6.0',
        priority: 850,
      },
      'tls-handshake-modifier': {
        version: '3.6.0',
        priority: 997,
      },
      'konnect-application-auth': {
        version: '3.6.0',
        priority: 950,
      },
      'websocket-validator': {
        version: '3.6.0',
        priority: 999,
      },
      'websocket-size-limit': {
        version: '3.6.0',
        priority: 999,
      },
      jq: {
        version: '3.6.0',
        priority: 811,
      },
      opa: {
        version: '3.6.0',
        priority: 920,
      },
      'application-registration': {
        version: '3.6.0',
        priority: 995,
      },
      'oauth2-introspection': {
        version: '3.6.0',
        priority: 1700,
      },
      'proxy-cache-advanced': {
        version: '3.6.0',
        priority: 100,
      },
      'openid-connect': {
        version: '3.6.0',
        priority: 1050,
      },
      'forward-proxy': {
        version: '3.6.0',
        priority: 50,
      },
      canary: {
        version: '3.6.0',
        priority: 20,
      },
      'request-transformer-advanced': {
        version: '3.6.0',
        priority: 802,
      },
      'response-transformer-advanced': {
        version: '3.6.0',
        priority: 800,
      },
      'rate-limiting-advanced': {
        version: '3.6.0',
        priority: 910,
      },
      'ldap-auth-advanced': {
        version: '3.6.0',
        priority: 1200,
      },
      'statsd-advanced': {
        version: '3.6.0',
        priority: 11,
      },
      'route-by-header': {
        version: '3.6.0',
        priority: 850,
      },
      'jwt-signer': {
        version: '3.6.0',
        priority: 1020,
      },
      'vault-auth': {
        version: '3.6.0',
        priority: 1350,
      },
      'request-validator': {
        version: '3.6.0',
        priority: 999,
      },
      'mtls-auth': {
        version: '3.6.0',
        priority: 1600,
      },
      'graphql-proxy-cache-advanced': {
        version: '3.6.0',
        priority: 99,
      },
      'graphql-rate-limiting-advanced': {
        version: '3.6.0',
        priority: 902,
      },
      degraphql: {
        version: '3.6.0',
        priority: 1500,
      },
      'route-transformer-advanced': {
        version: '3.6.0',
        priority: 780,
      },
      'kafka-log': {
        version: '3.6.0',
        priority: 5,
      },
      'kafka-upstream': {
        version: '3.6.0',
        priority: 751,
      },
      'exit-transformer': {
        version: '3.6.0',
        priority: 9999,
      },
      'key-auth-enc': {
        version: '3.6.0',
        priority: 1250,
      },
      'upstream-timeout': {
        version: '3.6.0',
        priority: 400,
      },
      'ai-response-transformer': {
        version: '3.6.0',
        priority: 777,
      },
      'ai-rate-limiting-advanced': {
        version: '3.7.0',
        priority: 905,
      },
      'ai-azure-content-safety': {
        version: '3.7.0',
        priority: 905,
      },
      'ai-prompt-template': {
        version: '3.6.0',
        priority: 773,
      },
      'ai-prompt-decorator': {
        version: '3.6.0',
        priority: 772,
      },
      'ai-prompt-guard': {
        version: '3.6.0',
        priority: 771,
      },
      'ai-proxy': {
        version: '3.6.0',
        priority: 770,
      },
      'ai-request-transformer': {
        version: '3.6.0',
        priority: 769,
      },
      mocking: {
        version: '3.6.0',
        priority: -1,
      },
    },
    disabled_on_server: {},
  },
}

// keep this list sorted alphabetically!!!
export const firstShownCustomPlugin = 'moesif'
export const customPluginNames = [
  firstShownCustomPlugin,
  'myplugin',
  'myplugin2',
  'myplugin3',
  'myplugin4',
]
export const kongPluginNames = [
  'acl',
  'acme',
  'ai-prompt-decorator',
  'ai-prompt-guard',
  'ai-prompt-template',
  'ai-proxy',
  'ai-request-transformer',
  'ai-response-transformer',
  'ai-rate-limiting-advanced',
  'ai-azure-content-safety',
  'app-dynamics',
  'aws-lambda',
  'azure-functions',
  firstShownPlugin,
  'bot-detection',
  'canary',
  'correlation-id',
  'cors',
  'datadog',
  'degraphql',
  'exit-transformer',
  'file-log',
  'forward-proxy',
  'graphql-proxy-cache-advanced',
  'graphql-rate-limiting-advanced',
  'grpc-gateway',
  'grpc-web',
  'hmac-auth',
  'http-log',
  'ip-restriction',
  'jq',
  'jwe-decrypt',
  'jwt',
  'kafka-log',
  'kafka-upstream',
  'key-auth',
  'ldap-auth',
  'ldap-auth-advanced',
  'loggly',
  'mocking',
  'mtls-auth',
  'oas-validation',
  'oauth2-introspection',
  'opa',
  'openid-connect',
  'opentelemetry',
  'post-function',
  'pre-function',
  'prometheus',
  'proxy-cache',
  'proxy-cache-advanced',
  'rate-limiting',
  'rate-limiting-advanced',
  'request-size-limiting',
  'request-termination',
  'request-transformer',
  'request-transformer-advanced',
  'request-validator',
  'response-ratelimiting',
  'response-transformer',
  'response-transformer-advanced',
  'route-by-header',
  'route-transformer-advanced',
  'saml',
  'session',
  'statsd',
  'statsd-advanced',
  'syslog',
  'tcp-log',
  'tls-handshake-modifier',
  'tls-metadata-headers',
  'udp-log',
  // 'upstream-authenticator',
  'upstream-timeout',
  'websocket-size-limit',
  'websocket-validator',
  'xml-threat-protection',
  'zipkin',
]

export const konnectLimitedAvailablePlugins = {
  names: [
    'hmac-auth',
    'ip-restriction',
  ],
}

export const konnectAvailablePlugins = {
  names: [
    ...kongPluginNames,
    ...customPluginNames,
  ],
}

export const konnectStreamingCustomPlugins = {
  data: [
    { id: '3e26ba5a-9c6b-4e79-9501-0e0bd9ade0ad', name: 'plugin-1', schema: 'schema text', handler: 'handler text' },
    { id: '3e26ba5a-9c6b-4e79-9501-0e0bd9ade0ae', name: 'plugin-2', schema: 'schema text', handler: 'handler text' },
  ],
}

/**
 * Form page data
 */

// ACL plugin credential
export const credentialSchema = {
  fields: [
    {
      id: {
        uuid: true,
        type: 'string',
        auto: true,
      },
    },
    {
      created_at: {
        auto: true,
        timestamp: true,
        type: 'integer',
      },
    },
    {
      consumer: {
        reference: 'consumers',
        type: 'foreign',
        on_delete: 'cascade',
        required: true,
      },
    },
    {
      group: {
        required: true,
        type: 'string',
        hint: 'The arbitrary group name to associate to the consumer.',
      },
    },
    {
      tags: {
        elements: {
          type: 'string',
          required: true,
        },
        type: 'set',
      },
    },
  ],
}

// custom plugin with array of custom schema objects
export const customPluginSchema = {
  fields: [
    {
      consumer: {
        description: 'Custom type for representing a foreign key with a null value allowed.',
        eq: null,
        reference: 'consumers',
        type: 'foreign',
      },
    },
    {
      protocols: {
        default: [
          'grpc',
          'grpcs',
          'http',
          'https',
        ],
        description: 'A set of strings representing HTTP protocols.',
        elements: {
          one_of: [
            'grpc',
            'grpcs',
            'http',
            'https',
          ],
          type: 'string',
        },
        required: true,
        type: 'set',
      },
    },
    {
      config: {
        fields: [
          {
            discovery_uris: {
              elements: {
                fields: [
                  {
                    issuer: {
                      required: true,
                      type: 'string',
                    },
                  },
                  {
                    requires_proxy: {
                      default: true,
                      type: 'boolean',
                    },
                  },
                  {
                    ssl_verify: {
                      default: false,
                      type: 'boolean',
                    },
                  },
                  {
                    timeout_ms: {
                      default: 5000,
                      type: 'number',
                    },
                  },
                ],
                type: 'record',
              },
              type: 'array',
            },
          },
        ],
        required: true,
        type: 'record',
      },
    },
  ],
}

const serviceId = '6ecce9f2-4f3e-45aa-af18-a0553d354845'
// CORS plugin
export const plugin1 = {
  config: {
    credentials: false,
    exposed_headers: null,
    headers: null,
    max_age: null,
    methods: [
      'GET',
      'HEAD',
      'PUT',
      'PATCH',
      'POST',
      'DELETE',
      'OPTIONS',
      'TRACE',
      'CONNECT',
    ],
    origins: null,
    preflight_continue: false,
    private_network: true,
  },
  created_at: 1680888086,
  enabled: true,
  id: '0132e113-3d1a-413b-8d15-e62cbe2cf106',
  instance_name: 'my_instance',
  name: 'cors',
  protocols: [
    'grpc',
    'grpcs',
    'http',
    'https',
  ],
  service: {
    id: serviceId,
  },
  tags: [
    'kai!',
    'taggity',
  ],
  updated_at: 1701713573,
}

const consumerId = 'a5843a6f-f46e-4ce7-8f8e-d80e7ab3054b'
// ACL plugin credential
export const aclCredential1 = {
  consumer: {
    id: consumerId,
  },
  created_at: 1700516447,
  group: 'test-1',
  id: '5e023ff3-f22b-4012-b42e-0a3fbda17c04',
  updated_at: 1700516447,
}

export const scopedService = {
  connect_timeout: 60000,
  created_at: 1649427714,
  enabled: true,
  host: 'httpbin.com',
  id: serviceId,
  name: 'trex-impX',
  path: '/',
  port: 443,
  protocol: 'https',
  read_timeout: 60000,
  retries: 5,
  tags: [
    '_KonnectService:rrrrrrrraaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  ],
  updated_at: 1682019712,
  write_timeout: 60000,
}

export const scopedConsumer = {
  item: {
    id: consumerId,
    username: 'kai-test',
    created_at: 1678398140,
    updated_at: 1678398140,
    custom_id: 'kai',
    tags: [
      'tag1',
    ],
  },
}

export interface VaultsFetcherRawResponse {
  data: VaultEntityRow[];
  total: number;
  offset?: string;
}

export interface SecretsFetcherRawResponse {
  data: SecretEntityRow[];
  total: number;
  offset?: string;
}
