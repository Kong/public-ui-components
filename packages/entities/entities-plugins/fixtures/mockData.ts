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
      ordering: {},
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
