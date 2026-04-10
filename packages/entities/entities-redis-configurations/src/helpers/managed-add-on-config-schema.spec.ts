import { describe, expect, it } from 'vitest'
import { ConfigurationSchemaSection, ConfigurationSchemaType } from '@kong-ui-public/entities-shared'
import type { AddOnRecord } from '../types/cloud-gateways-add-on'
import { buildManagedAddOnCardSchema, pickManagedAddOnCardRecord } from './managed-add-on-config-schema'

describe('pickManagedAddOnCardRecord', () => {
  it('keeps only allowlisted keys in stable order', () => {
    const record = {
      id: 'addon-1',
      name: 'cache-1',
      extra_from_api: 'drop-me',
      kind: 'managed-cache.v0',
      created_at: '2026-04-01T08:42:10Z',
      updated_at: '2026-04-06T11:30:21Z',
      status: 'active',
    } as AddOnRecord

    const picked = pickManagedAddOnCardRecord(record)
    expect(Object.keys(picked)).toEqual(['id', 'name', 'created_at', 'updated_at', 'kind'])
    expect(picked).toMatchObject({
      id: 'addon-1',
      name: 'cache-1',
      created_at: '2026-04-01T08:42:10Z',
      updated_at: '2026-04-06T11:30:21Z',
      kind: 'managed-cache.v0',
    })
    expect('extra_from_api' in picked).toBe(false)
  })
})

describe('buildManagedAddOnCardSchema', () => {
  it('uses JsonArray for data_plane_groups when value is an array', () => {
    const schema = buildManagedAddOnCardSchema(
      {
        data_plane_groups: [{ id: 'dpg-1' }],
      },
      (key: string) => key,
    )
    expect(schema.data_plane_groups).toMatchObject({
      section: ConfigurationSchemaSection.Basic,
      type: ConfigurationSchemaType.JsonArray,
    })
  })

  it('uses Json for data_plane_groups when value is a single object', () => {
    const schema = buildManagedAddOnCardSchema(
      {
        data_plane_groups: { id: 'dpg-1' },
      },
      (key: string) => key,
    )
    expect(schema.data_plane_groups).toMatchObject({
      section: ConfigurationSchemaSection.Basic,
      type: ConfigurationSchemaType.Json,
    })
  })

  it('includes a cloud_authentication row when the picked record carries nested auth', () => {
    const schema = buildManagedAddOnCardSchema(
      {
        id: 'addon-1',
        cloud_authentication: {
          auth_provider: 'aws',
          aws_region: 'us-east-1',
        },
      },
      (key: string) => key,
    )
    expect(schema.cloud_authentication).toMatchObject({
      section: ConfigurationSchemaSection.Basic,
      label: 'form.sections.cloud_auth.title',
    })
  })
})
