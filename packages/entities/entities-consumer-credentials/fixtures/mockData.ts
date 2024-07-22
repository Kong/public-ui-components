// FetcherRawResponse is the raw format of the endpoint's response
export interface FetcherRawResponse {
  data: any[];
  total: number;
  offset?: string;
}

const now = Math.ceil(Date.now() / 1000)

export const basicAuthCredentials: FetcherRawResponse = {
  data: [
    {
      id: '1',
      username: 'user-1',
      created_at: now - 1,
    },
    {
      id: '2',
      username: 'user-2',
      created_at: now - 2,
    },
  ],
  total: 2,
}

export const basicAuthCredentials100: any[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    username: `user-${i + 1}`,
    created_at: now - i,
  }))

export const keyAuthCredentials: FetcherRawResponse = {
  data: [
    {
      id: '1',
      key: 'key-1',
      created_at: now - 1,
    },
  ],
  total: 1,
}

export const keyAuthEncCredentials: FetcherRawResponse = {
  data: [
    {
      id: '1',
      key: 'key-1',
      created_at: now - 1,
    },
  ],
  total: 1,
}

export const oauth2Credentials: FetcherRawResponse = {
  data: [
    {
      id: '1',
      name: 'oauth2-1',
      client_id: 'client-id-1',
      client_secret: 'client-secret-1',
      created_at: now - 1,
    },
  ],
  total: 1,
}

export const hmacAuthCredentials: FetcherRawResponse = {
  data: [
    {
      id: '1',
      username: 'user-1',
      secret: 'secret-1',
      created_at: now - 1,
    },
  ],
  total: 1,
}

export const jwtCredentials: FetcherRawResponse = {
  data: [
    {
      id: '1',
      key: 'key-1',
      algorithm: 'algorithm-1',
      created_at: now - 1,
    },
  ],
  total: 1,
}

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
