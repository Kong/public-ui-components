// FetcherRawResponse is the raw format of the endpoint's response
export interface FetcherRawResponse {
  data: any[];
  total: number;
  offset?: string;
}

export const routes: FetcherRawResponse = {
  data: [
    {
      id: '1',
      name: 'route-1',
      methods: ['GET'],
      hosts: ['example.com'],
    },
    {
      id: '2',
      name: 'route-2',
      hosts: ['example.com'],
      tags: ['tag1', 'tag2'],
    },
  ],
  total: 2,
}

export const routes100: any[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    name: `route-${i + 1}`,
    methods: ['GET'],
    hosts: [`${i + 1}.example.com`],
  }))

export const paginate = (
  routes: any[],
  size: number,
  _offset: number,
): FetcherRawResponse => {
  const sliced = routes.slice(_offset, _offset + size)
  const offset =
    _offset + size < routes.length ? String(_offset + size) : undefined

  return {
    data: sliced,
    total: sliced.length,
    offset,
  }
}

export const services = [
  {
    id: '1',
    name: 'service-1',
  },
  {
    id: '2',
    name: 'service-2',
  },
]

// traditional
export const route = {
  service: {
    id: services[0].id,
  },
  id: '1',
  name: 'route-1',
  methods: ['GET', 'CASTOM'],
  service_id: '',
  tags: ['dev', 'test'],
  regex_priority: 1,
  path_handling: 'v1',
  preserve_host: true,
  https_redirect_status_code: 426,
  protocols: ['http', 'https'],
  strip_path: false,
  paths: ['/foo', '/bar'],
  headers: { Header1: ['cropped-jeans', 'expensive-petroleum'] },
}

// expressions
export const routeExpressions = {
  service: {
    id: services[0].id,
  },
  id: '1',
  name: 'route-1',
  methods: ['GET', 'CASTOM'],
  service_id: '',
  tags: ['dev', 'test'],
  preserve_host: true,
  https_redirect_status_code: 426,
  protocols: ['http', 'https'],
  strip_path: false,
  expression: 'http.path == "/kong"',
}
