// FetcherRawResponse is the raw format of the endpoint's response
export interface FetcherRawResponse {
  data: any[];
  total: number;
  offset?: string;
}

export const gatewayService1 = {
  id: '1',
  name: 'gateway-service-1',
  url: 'http://mockbin.org',
  protocol: 'http',
  host: 'example.com',
  port: '80',
  tags: ['tag1', 'tag2'],
  enabled: false,
}

export const gatewayService2 = {
  id: '2',
  name: 'gateway-service-2',
  url: 'http://mockbin.org',
  protocol: 'https',
  host: 'example.com',
  port: '443',
  tags: ['tag1', 'tag2'],
  enabled: false,
}

export const gatewayServices: FetcherRawResponse = {
  data: [
    {
      id: '1',
      name: 'gateway-service-1',
      protocol: 'http',
      port: '80',
      host: 'example.com',
      path: '/',
      enabled: true,
    },
    {
      id: '2',
      name: 'gateway-service-2',
      protocol: 'https',
      host: 'example.com',
      port: '443',
      tags: ['tag1', 'tag2'],
      enabled: false,
    },
  ],
  total: 2,
}

export const gatewayServices100: any[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    name: `gateway-service-${i + 1}`,
    protocol: 'http',
    host: `${i + 1}.example.com`,
    port: '80',
    path: '/foo',
    enabled: true,
  }))

export const paginate = (
  gatewayServices: any[],
  size: number,
  _offset: number,
): FetcherRawResponse => {
  const sliced = gatewayServices.slice(_offset, _offset + size)
  const offset =
    _offset + size < gatewayServices.length ? String(_offset + size) : undefined

  return {
    data: sliced,
    total: sliced.length,
    offset,
  }
}
