// FetcherRawResponse is the raw format of the endpoint's response
import type { KonnectVaultEntityConfig, EntityRow as VaultEntityRow, SecretEntityRow } from '../src'

export interface FetcherRawResponse {
  data: any[]
  total: number
  offset?: string
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
    api_key: 'foobar',
  },
}

export const konnectCardConfig: KonnectVaultEntityConfig = {
  app: 'konnect',
  controlPlaneId: 'f0acb165-ff05-4788-aa06-6909b8d1694e',
  apiBaseUrl: '/us/kong-api',
  entityId: '1234',
}

export const secrets: FetcherRawResponse = {
  data: [
    {
      key: 'secret-1',
    },
    {
      key: 'secret-2',
    },
  ],
  total: 2,
}

export const secrets100: any[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    key: `secret-${i + 1}`,
  }))

export const secret = {
  key: 'secret-1',
}

export const konnectConfigStoreId = '123-qwerty-french-dj'

const vaults2: VaultEntityRow[] = [
  {
    id: '1',
    name: 'hcv',
    prefix: 'hcv-1',
    description: 'HashiCorp Vault',
  },
  {
    id: '2',
    name: 'aws',
    prefix: 'aws-1',
    description: 'AWS Secrets Manager',
  },
  {
    id: '3',
    name: 'konnect',
    prefix: 'kv-1',
    description: 'Konnect Config Store',
    config: {
      config_store_id: konnectConfigStoreId,
    },
  },
  {
    id: '4',
    name: 'env',
    prefix: 'env-1',
    description: 'Environment Variables',
  },
]

// ... without Konnect vaults
const kongManagerVaults = vaults2.filter((v) => v.name !== 'konnect')

export const vaultsResponse: FetcherRawResponse = {
  data: vaults2,
  total: vaults2.length,
}

// ... without Konnect vaults
export const kongManagerVaultsResponse: FetcherRawResponse = {
  data: kongManagerVaults,
  total: kongManagerVaults.length,
}

const secrets2: SecretEntityRow[] = [
  {
    id: '1',
    key: 'password',
    value: '<redacted>',
  },
  {
    id: '2',
    key: 'username',
    value: '<redacted>',
  },
  {
    id: '3',
    key: 'tokens',
    value: '{ "refresh_token": "<redacted>" }',
  },
]

export const secretsResponse: FetcherRawResponse = {
  data: secrets2,
  total: secrets2.length,
}
