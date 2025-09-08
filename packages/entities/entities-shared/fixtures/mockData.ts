import type { ExactMatchFilterConfig, FuzzyMatchFilterConfig } from '../src/types'

export const mockTableData = {
  total: 2,
  data: [
    {
      id: '08cc7d81-a9d8-4ae1-a42f-8d4e5a919d07',
      name: 'Route 1',
      protocols: ['http', 'https'],
      hosts: 'https://httpbin.org/',
      methods: ['POST'],
      paths: '/dogs',
    },
    {
      id: '22d28551-cc16-4429-8885-3b32d2fa7e0a',
      name: 'Route 2',
      protocols: ['ws'],
      hosts: 'https://httpbin.org/',
      methods: ['GET', 'PUT'],
      paths: '/cats',
    },
  ],
}

export const mockTableHeaders = {
  id: {
    label: 'ID',
    sortable: true,
  },
  name: {
    label: 'Name',
    sortable: true,
  },
  protocols: {
    label: 'Protocols',
    sortable: false,
  },
  hosts: {
    label: 'Hosts',
    sortable: true,
  },
  methods: {
    label: 'Methods',
    sortable: false,
  },
  paths: {
    label: 'Paths',
    sortable: false,
  },
}

export const mockExactMatchFilterConfig = {
  isExactMatch: true,
  placeholder: 'Filter by exact name or ID',
} satisfies ExactMatchFilterConfig

export const mockFuzzyMatchFilterConfig = {
  isExactMatch: false,
  fields: {
    name: {
      label: 'Name',
      searchable: true,
    },
    protocols: {
      label: 'Protocols',
      searchable: true,
    },
    methods: {
      label: 'Methods',
      searchable: true,
    },
    port: {
      label: 'Port',
      searchable: true,
    },
    paths: {
      label: 'Paths',
      searchable: true,
    },
    // To hide certain fields in the filter, set their `searchable` to `false
    tags: {
      label: 'Tags',
      searchable: false,
    },
  },
  schema: {
    protocols: {
      type: 'select',
      values: ['http', 'https', 'tcp', 'tls', 'grpc', 'grpcs'],
    },
    port: {
      type: 'number',
    },
  },
} satisfies FuzzyMatchFilterConfig

export const gatewayServiceRecord = {
  ca_certificates: [
    '870c1009-d137-44c0-ab64-cdb38409ea02',
    'ce44c130-b795-462d-8299-0dfccaf63527',
  ],
  client_certificate: {
    id: '152432b9-21d5-4007-8f42-bd53979977b8',
  },
  connect_timeout: 60000,
  created_at: 1652881056,
  enabled: true,
  host: 'httpbin.com',
  id: '1dad4f65-21f6-470d-a49f-1f08fb686fcf',
  name: 'a-good-gateway-service',
  path: '/',
  port: 443,
  protocol: 'https',
  read_timeout: 60000,
  retries: 5,
  tags: [
    '_KonnectService:a-good-one',
  ],
  tls_verify: true,
  updated_at: '2023-06-07T17:01:06.000Z',
  write_timeout: 60000,
  extra: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
}

export const emptyKey = 'preferred_chain'
export const keyWithValue = 'storage'
export const pluginRecord = {
  config: {
    account_email: 'f@a.com',
    allow_any_domain: false,
    api_uri: 'https://acme-v02.api.letsencrypt.org/directory',
    cert_type: 'rsa',
    domains: null,
    eab_hmac_key: null,
    eab_kid: null,
    enable_ipv4_common_name: true,
    fail_backoff_minutes: 5,
    // leave this value null for tests!!
    [emptyKey]: null,
    renew_threshold_days: 14,
    rsa_key_size: 4096,
    // this entry must have a value for tests!
    [keyWithValue]: 'shm',
    storage_config: {
      consul: {
        host: null,
        https: false,
        kv_path: null,
        port: null,
        timeout: null,
        token: null,
      },
      kong: [],
      redis: {
        auth: null,
        database: null,
        host: null,
        port: null,
        ssl: false,
        ssl_server_name: null,
        ssl_verify: false,
      },
      shm: {
        shm_name: 'kong',
      },
      vault: {
        auth_method: 'token',
        auth_path: null,
        auth_role: null,
        host: null,
        https: false,
        jwt_path: null,
        kv_path: null,
        port: null,
        timeout: null,
        tls_server_name: null,
        tls_verify: true,
        token: null,
      },
    },
    tos_accepted: false,
  },
  created_at: 1666802686,
  enabled: false,
  id: '58af32f7-cebf-4680-8fdf-e4d99804ce01',
  name: 'acme',
  protocols: [
    'grpc',
    'grpcs',
    'http',
    'https',
  ],
  updated_at: 1679088529,
}

export const route = {
  service: {
    id: gatewayServiceRecord.id,
  },
  id: '1123-ilove-cats-woot',
  name: 'route-trad',
  methods: [],
  tags: [],
  regex_priority: 1,
  path_handling: 'v1',
  preserve_host: true,
  https_redirect_status_code: 426,
  protocols: ['http', 'https'],
  strip_path: false,
  paths: [],
}
