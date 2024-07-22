// FetcherRawResponse is the raw format of the endpoint's response
export interface FetcherRawResponse {
  data: any[];
  total: number;
  offset?: string;
}

export const keySet1 = {
  id: '1',
  name: 'key-set-1',
  tags: ['tag1'],
}

export const keySets: FetcherRawResponse = {
  data: [
    keySet1,
    {
      id: '2',
      name: 'key-set-2',
      tags: ['tag1', 'tag2'],
    },
  ],
  total: 2,
}

export const keySets100: any[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    name: `key-set-${i + 1}`,
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
