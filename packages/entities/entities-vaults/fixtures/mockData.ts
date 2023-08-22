// FetcherRawResponse is the raw format of the endpoint's response
import type { KonnectVaultEntityConfig } from '../src'

export interface FetcherRawResponse {
  data: any[];
  total: number;
  offset?: string;
}

export const vaults: FetcherRawResponse = {
  data: [
    {
      id: '1',
      name: 'vault-1',
      prefix: 'prefix-1',
      description: 'description-1',
      hosts: ['tag1'],
    },
    {
      id: '2',
      name: 'vault-2',
      prefix: 'prefix-2',
      description: 'description-2',
      tags: ['tag1', 'tag2'],
    },
  ],
  total: 2,
}

export const vaults100: any[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    name: `vault-${i + 1}`,
    prefix: `prefix-${i + 1}`,
    description: `description-${i + 1}`,
    hosts: [`tag${i + 1}`],
  }))

export const paginate = (
  vaults: any[],
  size: number,
  _offset: number,
): FetcherRawResponse => {
  const sliced = vaults.slice(_offset, _offset + size)
  const offset =
    _offset + size < vaults.length ? String(_offset + size) : undefined

  return {
    data: sliced,
    total: sliced.length,
    offset,
  }
}

export const vault = {
  id: '1',
  name: 'env',
  prefix: 'prefix-1',
  description: 'description-1',
  tags: ['dev', 'test'],
  config: {
    prefix: 'dev',
  },
}

export const konnectCardConfig: KonnectVaultEntityConfig = {
  app: 'konnect',
  controlPlaneId: 'f0acb165-ff05-4788-aa06-6909b8d1694e',
  apiBaseUrl: '/us/kong-api/konnect-api',
  entityId: '1234',
}
