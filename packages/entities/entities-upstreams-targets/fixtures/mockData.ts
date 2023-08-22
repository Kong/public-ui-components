// FetcherRawResponse is the raw format of the endpoint's response
import type {
  KongManagerUpstreamsFormConfig, KonnectUpstreamsEntityConfig,
  KonnectUpstreamsFormConfig,
  UpstreamResponse,
} from '../src'

export interface FetcherRawResponse {
  data: any[];
  total: number;
  offset?: string;
}

export const upstreams: FetcherRawResponse = {
  data: [
    {
      id: '1',
      name: 'upstream-1',
      slots: '10',
      tags: ['dev'],
    },
    {
      id: '2',
      name: 'upstream-2',
      slots: '15',
      tags: ['prod'],
    },
  ],
  total: 2,
}

export const upstreams100: any[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    name: `upstream-${i + 1}`,
    slots: i,
    tags: [],
  }))

export const targets: FetcherRawResponse = {
  data: [
    {
      id: '123',
      target: 'localhost:3000',
      weight: '100',
      tags: ['dev'],
    },
    {
      id: '234',
      target: 'localhost:3001',
      weight: '101',
      tags: ['prod'],
    },
  ],
  total: 2,
}

export const targets100: any[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    target: `localhost:${3000 + (i + 1)}`,
    weight: '101',
    tags: [],
  }))

export const paginate = (
  entities: any[],
  size: number,
  _offset: number,
): FetcherRawResponse => {
  const sliced = entities.slice(_offset, _offset + size)
  const offset =
    _offset + size < entities.length ? String(_offset + size) : undefined

  return {
    data: sliced,
    total: sliced.length,
    offset,
  }
}

export const target = {
  id: '123-abc',
  target: 'localhost:3000',
  weight: '500',
  tags: ['dev', 'test'],
}

export const cancelRoute = { name: 'upstreams-list' }

export const konnectConfig: KonnectUpstreamsFormConfig = {
  app: 'konnect',
  controlPlaneId: 'f0acb165-ff05-4788-aa06-6909b8d1694e',
  apiBaseUrl: '/us/kong-api/konnect-api',
  cancelRoute,
}

export const KMConfig: KongManagerUpstreamsFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
}

export const services5: any[] = Array(5)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    host: `host-${i + 1}.com`,
  }))

export const certificates5: any[] = Array(5)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    cert: `certificate-${i + 1}`,
  }))

export const upstreamsResponse: UpstreamResponse = {
  algorithm: 'least-connections',
  client_certificate: {
    id: '2',
  },
  hash_fallback: 'path',
  hash_on: 'consumer',
  hash_on_cookie_path: '/',
  healthchecks: {
    active: {
      concurrency: 10,
      healthy: {
        http_statuses: [
          200,
          302,
        ],
        interval: 5,
        successes: 5,
      },
      http_path: '/',
      https_verify_certificate: true,
      timeout: 1,
      type: 'https',
      unhealthy: {
        http_failures: 5,
        http_statuses: [
          429,
          404,
          500,
          501,
          502,
          503,
          504,
          505,
        ],
        interval: 5,
        tcp_failures: 0,
        timeouts: 0,
      },
    },
    passive: {
      healthy: {
        http_statuses: [
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          226,
          300,
          301,
          302,
          303,
          304,
          305,
          306,
          307,
          308,
        ],
        successes: 0,
      },
      type: 'http',
      unhealthy: {
        http_failures: 0,
        http_statuses: [
          429,
          500,
          503,
        ],
        tcp_failures: 0,
        timeouts: 0,
      },
    },
    threshold: 0,
  },
  id: 'c372844b-a78a-4317-a81f-0606ba317816',
  name: 'host-1.com',
  slots: 2000,
  tags: [
    'tag1',
    'tag2',
  ],
}

export const upstreamsResponseFull: UpstreamResponse = {
  algorithm: 'least-connections',
  client_certificate: {
    id: '2',
  },
  host_header: 'host_header',
  hash_fallback: 'path',
  hash_on: 'consumer',
  hash_on_cookie_path: '/',
  healthchecks: {
    active: {
      concurrency: 13,
      healthy: {
        http_statuses: [
          200,
          302,
        ],
        interval: 10,
        successes: 5,
      },
      http_path: '/abc',
      https_verify_certificate: true,
      https_sni: 'test sni',
      timeout: 4,
      type: 'https',
      unhealthy: {
        http_failures: 5,
        http_statuses: [
          429,
          404,
        ],
        interval: 5,
        tcp_failures: 0,
        timeouts: 0,
      },
    },
    passive: {
      healthy: {
        http_statuses: [
          200,
          201,
        ],
        successes: 4,
      },
      type: 'http',
      unhealthy: {
        http_failures: 5,
        http_statuses: [
          429,
          500,
          503,
        ],
        tcp_failures: 0,
        timeouts: 10,
      },
    },
    threshold: 2,
  },
  id: 'c372844b-a78a-4317-a81f-0606ba317816',
  name: 'host-1.com',
  slots: 2000,
  tags: [
    'tag1',
    'tag2',
  ],
}

export const upstreamsKMResponseFull: UpstreamResponse = {
  algorithm: 'least-connections',
  client_certificate: {
    id: '2',
  },
  host_header: 'host_header',
  hash_fallback: 'path',
  hash_on: 'consumer',
  hash_on_cookie_path: '/',
  healthchecks: {
    active: {
      headers: { header1: ['v1', 'v2'] },
      concurrency: 13,
      healthy: {
        http_statuses: [
          200,
          302,
        ],
        interval: 10,
        successes: 5,
      },
      http_path: '/abc',
      https_verify_certificate: true,
      https_sni: 'test sni',
      timeout: 4,
      type: 'https',
      unhealthy: {
        http_failures: 5,
        http_statuses: [
          429,
          404,
        ],
        interval: 5,
        tcp_failures: 0,
        timeouts: 0,
      },
    },
    passive: {
      healthy: {
        http_statuses: [
          200,
          201,
        ],
        successes: 4,
      },
      type: 'http',
      unhealthy: {
        http_failures: 5,
        http_statuses: [
          429,
          500,
          503,
        ],
        tcp_failures: 0,
        timeouts: 10,
      },
    },
    threshold: 2,
  },
  id: 'c372844b-a78a-4317-a81f-0606ba317816',
  name: 'host-1.com',
  slots: 2000,
  tags: [
    'tag1',
    'tag2',
  ],
}

export const upstreamsKMResponsePassiveDisabled: UpstreamResponse = {
  algorithm: 'least-connections',
  client_certificate: {
    id: '2',
  },
  host_header: 'host_header',
  hash_fallback: 'path',
  hash_on: 'consumer',
  hash_on_cookie_path: '/',
  healthchecks: {
    active: {
      headers: { header1: ['v1', 'v2'] },
      concurrency: 13,
      healthy: {
        http_statuses: [
          200,
          302,
        ],
        interval: 10,
        successes: 5,
      },
      http_path: '/abc',
      https_verify_certificate: true,
      https_sni: 'test sni',
      timeout: 4,
      type: 'https',
      unhealthy: {
        http_failures: 5,
        http_statuses: [
          429,
          404,
        ],
        interval: 5,
        tcp_failures: 0,
        timeouts: 0,
      },
    },
    passive: {
      healthy: {
        http_statuses: [
          200,
          201,
        ],
        successes: 0,
      },
      type: 'http',
      unhealthy: {
        http_failures: 0,
        http_statuses: [
          429,
          500,
          503,
        ],
        tcp_failures: 0,
        timeouts: 0,
      },
    },
    threshold: 2,
  },
  id: 'c372844b-a78a-4317-a81f-0606ba317816',
  name: 'host-1.com',
  slots: 2000,
  tags: [
    'tag1',
    'tag2',
  ],
}

export const upstreamsKMResponseDisableActive: UpstreamResponse = {
  algorithm: 'least-connections',
  client_certificate: {
    id: '2',
  },
  host_header: 'host_header',
  hash_fallback: 'path',
  hash_on: 'consumer',
  hash_on_cookie_path: '/',
  healthchecks: {
    active: {
      headers: {},
      concurrency: 13,
      healthy: {
        http_statuses: [
          200,
          302,
        ],
        interval: 0,
        successes: 5,
      },
      http_path: '/abc',
      https_verify_certificate: true,
      https_sni: 'test sni',
      timeout: 4,
      type: 'https',
      unhealthy: {
        http_failures: 5,
        http_statuses: [
          429,
          404,
        ],
        interval: 0,
        tcp_failures: 0,
        timeouts: 0,
      },
    },
    passive: {
      healthy: {
        http_statuses: [
          200,
          201,
        ],
        successes: 4,
      },
      type: 'http',
      unhealthy: {
        http_failures: 5,
        http_statuses: [
          429,
          500,
          503,
        ],
        tcp_failures: 0,
        timeouts: 10,
      },
    },
    threshold: 2,
  },
  id: 'c372844b-a78a-4317-a81f-0606ba317816',
  name: 'host-1.com',
  slots: 2000,
  tags: [
    'tag1',
    'tag2',
  ],
}

export const konnectCardConfig: KonnectUpstreamsEntityConfig = {
  app: 'konnect',
  controlPlaneId: 'f0acb165-ff05-4788-aa06-6909b8d1694e',
  apiBaseUrl: '/us/kong-api/konnect-api',
  entityId: '1234',
}
