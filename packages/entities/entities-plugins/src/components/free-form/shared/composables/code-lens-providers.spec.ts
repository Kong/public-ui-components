import { describe, expect, it, vi } from 'vitest'

vi.mock('reflect-metadata', () => ({}))
vi.mock('@peculiar/x509', () => ({}))
vi.mock('monaco-editor', () => ({
  KeyMod: { CtrlCmd: 0, Shift: 0, Alt: 0, WinCtrl: 0 },
  KeyCode: {},
  editor: { registerCommand: vi.fn() },
  Emitter: vi.fn(),
  languages: { registerCodeLensProvider: vi.fn() },
}))
vi.mock('@kong-ui-public/monaco-editor', () => ({
  collectCodeLensProviders: vi.fn(),
}))
vi.mock('@kong-ui-public/monaco-editor/languages/yaml', () => ({
  createYAMLCopyUUIDCodeLensProvider: vi.fn(),
  createYAMLValueCodeLensProvider: vi.fn(),
}))

import { buildForeignEntityLensConfig } from './code-lens-providers'
import { buildSchemaMap } from './schema'

import type { ForeignFieldSchema, FormSchema, RecordFieldSchema, UnionFieldSchema } from '../../../../types/plugins/form-schema'

describe('buildForeignEntityLensConfig', () => {
  it('discovers top-level foreign fields', () => {
    const schemaMap: Record<string, UnionFieldSchema> = {
      service: { type: 'foreign', reference: 'services' } as ForeignFieldSchema,
    }

    expect(buildForeignEntityLensConfig(schemaMap)).toEqual([
      { entity: 'service', keyPath: ['service'] },
    ])
  })

  it('discovers nested foreign fields', () => {
    const schemaMap: Record<string, UnionFieldSchema> = {
      config: { type: 'record', fields: [] } as unknown as UnionFieldSchema,
      'config.some_cert_field': { type: 'foreign', reference: 'certificates' } as ForeignFieldSchema,
    }

    expect(buildForeignEntityLensConfig(schemaMap)).toEqual([
      { entity: 'certificate', keyPath: ['config', 'some_cert_field'] },
    ])
  })

  it('skips unsupported references', () => {
    const schemaMap: Record<string, UnionFieldSchema> = {
      vault: { type: 'foreign', reference: 'vaults' } as ForeignFieldSchema,
    }

    expect(buildForeignEntityLensConfig(schemaMap)).toEqual([])
  })

  it('skips non-foreign fields', () => {
    const schemaMap: Record<string, UnionFieldSchema> = {
      'config.timeout': { type: 'number' } as UnionFieldSchema,
      'config.host': { type: 'string' } as UnionFieldSchema,
    }

    expect(buildForeignEntityLensConfig(schemaMap)).toEqual([])
  })

  it('returns empty array for empty schema map', () => {
    expect(buildForeignEntityLensConfig({})).toEqual([])
  })

  it('discovers multiple foreign fields', () => {
    const schemaMap: Record<string, UnionFieldSchema> = {
      consumer: { type: 'foreign', reference: 'consumers' } as ForeignFieldSchema,
      route: { type: 'foreign', reference: 'routes' } as ForeignFieldSchema,
      'config.cert_field': { type: 'foreign', reference: 'certificates' } as ForeignFieldSchema,
    }

    const result = buildForeignEntityLensConfig(schemaMap)
    expect(result).toHaveLength(3)
    expect(result).toContainEqual({ entity: 'consumer', keyPath: ['consumer'] })
    expect(result).toContainEqual({ entity: 'route', keyPath: ['route'] })
    expect(result).toContainEqual({ entity: 'certificate', keyPath: ['config', 'cert_field'] })
  })

  it('handles deeply nested foreign fields', () => {
    const schemaMap: Record<string, UnionFieldSchema> = {
      'config.nested.record.cert_ref': { type: 'foreign', reference: 'certificates' } as ForeignFieldSchema,
    }

    expect(buildForeignEntityLensConfig(schemaMap)).toEqual([
      { entity: 'certificate', keyPath: ['config', 'nested', 'record', 'cert_ref'] },
    ])
  })

  it('works end-to-end with buildSchemaMap on a realistic plugin schema', () => {
    const pluginSchema: FormSchema = {
      type: 'record',
      fields: [
        {
          consumer: {
            type: 'foreign',
            reference: 'consumers',
            description: 'Custom type for representing a foreign key with a null value allowed.',
          } as ForeignFieldSchema,
        },
        {
          protocols: {
            type: 'set',
            required: true,
            default: ['grpc', 'grpcs', 'http', 'https'],
            elements: { type: 'string', one_of: ['grpc', 'grpcs', 'http', 'https'] },
          } as unknown as UnionFieldSchema,
        },
        {
          consumer_group: {
            type: 'foreign',
            reference: 'consumer_groups',
            description: 'Custom type for representing a foreign key with a null value allowed.',
          } as ForeignFieldSchema,
        },
        {
          config: {
            type: 'record',
            required: true,
            fields: [
              {
                access_token_keyset_client_certificate: {
                  type: 'foreign',
                  reference: 'certificates',
                  required: false,
                  description: 'The client certificate for mTLS Auth.',
                } as ForeignFieldSchema,
              },
            ],
          } as RecordFieldSchema,
        },
      ],
    }

    const schemaMap = buildSchemaMap(pluginSchema)
    const result = buildForeignEntityLensConfig(schemaMap)

    // Should discover consumer, consumer_group, and certificate
    expect(result).toHaveLength(3)
    expect(result).toContainEqual({ entity: 'consumer', keyPath: ['consumer'] })
    expect(result).toContainEqual({ entity: 'consumer_group', keyPath: ['consumer_group'] })
    expect(result).toContainEqual({
      entity: 'certificate',
      keyPath: ['config', 'access_token_keyset_client_certificate'],
    })
  })
})
