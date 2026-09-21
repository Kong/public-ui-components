import { describe, it, expect } from 'vitest'
import composables from '..'
import { ConfigurationSchemaType } from '../../types'
import type { ConfigurationSchema } from '../../types'

const {
  isObjectRecord,
  getApiSchemaField,
  redactByApiSchema,
  redactByConfigSchema,
} = composables.useHelpers()

const REDACTED_MASK = '********'

describe('isObjectRecord()', () => {
  it('returns true for plain objects', () => {
    expect(isObjectRecord({ key: 'value' })).toBe(true)
    expect(isObjectRecord({})).toBe(true)
  })

  it('returns false for arrays', () => {
    expect(isObjectRecord([])).toBe(false)
    expect(isObjectRecord([{ key: 'value' }])).toBe(false)
  })

  it('returns false for nullish and non-object values', () => {
    const stringValue = 'string'
    const numberValue = 42
    const booleanValue = true

    expect(isObjectRecord(null)).toBe(false)
    expect(isObjectRecord(undefined)).toBe(false)
    expect(isObjectRecord(stringValue)).toBe(false)
    expect(isObjectRecord(numberValue)).toBe(false)
    expect(isObjectRecord(booleanValue)).toBe(false)
  })
})

describe('getApiSchemaField()', () => {
  const nameFieldSchema = { type: 'string' }
  const secretFieldSchema = { type: 'string', encrypted: true }
  const fields = [
    { name: nameFieldSchema },
    { secret: secretFieldSchema },
  ]

  it('returns the field schema for a matching key', () => {
    const result = getApiSchemaField(fields, 'secret')

    expect(result).toEqual(secretFieldSchema)
  })

  it('returns undefined when the key is not found', () => {
    const result = getApiSchemaField(fields, 'missing')

    expect(result).toBeUndefined()
  })

  it('returns undefined when fields are undefined', () => {
    const result = getApiSchemaField(undefined, 'secret')

    expect(result).toBeUndefined()
  })
})

describe('redactByApiSchema()', () => {
  it('returns the original value when fieldSchema is missing', () => {
    const secretValue = 'secret'
    const recordValue = { key: 'value' }

    expect(redactByApiSchema(secretValue)).toBe(secretValue)
    expect(redactByApiSchema(recordValue)).toEqual(recordValue)
  })

  it('returns nullish values unchanged', () => {
    const encryptedStringSchema = { type: 'string', encrypted: true }

    expect(redactByApiSchema(null, encryptedStringSchema)).toBeNull()
    expect(redactByApiSchema(undefined, encryptedStringSchema)).toBeUndefined()
  })

  it('redacts encrypted string fields and leaves non-encrypted string fields unchanged', () => {
    const nonSecretValue = 'non-secret'
    const encryptedStringSchema = { type: 'string', encrypted: true }
    const stringSchema = { type: 'string' }
    const nonEncryptedStringSchema = { type: 'string', encrypted: false }

    expect(redactByApiSchema('super-secret', encryptedStringSchema)).toBe(REDACTED_MASK)
    expect(redactByApiSchema(nonSecretValue, stringSchema)).toBe(nonSecretValue)
    expect(redactByApiSchema(nonSecretValue, nonEncryptedStringSchema)).toBe(nonSecretValue)
  })

  it('recursively redacts nested record fields', () => {
    const name = 'alice'
    const label = 'safe'
    const unknownValue = 'kept'
    const value = {
      name,
      secret: 'token',
      nested: {
        password: 'hunter2',
        label,
      },
      unknown: unknownValue,
    }
    const fieldSchema = {
      type: 'record',
      fields: [
        { name: { type: 'string' } },
        { secret: { type: 'string', encrypted: true } },
        {
          nested: {
            type: 'record',
            fields: [
              { password: { type: 'string', encrypted: true } },
              { label: { type: 'string' } },
            ],
          },
        },
      ],
    }

    expect(redactByApiSchema(value, fieldSchema)).toEqual({
      name,
      secret: REDACTED_MASK,
      nested: {
        password: REDACTED_MASK,
        label,
      },
      unknown: unknownValue,
    })
  })

  it('if non-object values are provided for record schemas, they are unchanged', () => {
    const nonRecordValue = 'not-a-record'
    const arrayValue = ['a']
    const recordSchema = { type: 'record', fields: [] }

    expect(redactByApiSchema(nonRecordValue, recordSchema)).toBe(nonRecordValue)
    expect(redactByApiSchema(arrayValue, recordSchema)).toEqual(arrayValue)
  })

  it('redacts array elements and inherits parent encrypted flag', () => {
    const fieldSchema = {
      type: 'array',
      encrypted: true,
      elements: { type: 'string' },
    }

    expect(redactByApiSchema(['secret-1', 'secret-2'], fieldSchema)).toEqual([REDACTED_MASK, REDACTED_MASK])
  })

  it('preserves elements.encrypted when parent array encrypted is unset', () => {
    const fieldSchema = {
      type: 'array',
      elements: { type: 'string', encrypted: true },
    }

    expect(redactByApiSchema(['secret-1', 'secret-2'], fieldSchema)).toEqual([REDACTED_MASK, REDACTED_MASK])
  })

  it('recursively redacts arrays of records', () => {
    const firstName = 'one'
    const secondName = 'two'
    const value = [
      { token: 'abc', name: firstName },
      { token: 'def', name: secondName },
    ]
    const fieldSchema = {
      type: 'array',
      elements: {
        type: 'record',
        fields: [
          { token: { type: 'string', encrypted: true } },
          { name: { type: 'string' } },
        ],
      },
    }

    expect(redactByApiSchema(value, fieldSchema)).toEqual([
      { token: REDACTED_MASK, name: firstName },
      { token: REDACTED_MASK, name: secondName },
    ])
  })

  it('redacts set elements and inherits parent encrypted flag', () => {
    const fieldSchema = {
      type: 'set',
      encrypted: true,
      elements: { type: 'string' },
    }

    expect(redactByApiSchema(['secret-1', 'secret-2'], fieldSchema)).toEqual([REDACTED_MASK, REDACTED_MASK])
  })

  it('preserves elements.encrypted when parent set encrypted is unset', () => {
    const fieldSchema = {
      type: 'set',
      elements: { type: 'string', encrypted: true },
    }

    expect(redactByApiSchema(['secret-1', 'secret-2'], fieldSchema)).toEqual([REDACTED_MASK, REDACTED_MASK])
  })

  it('recursively redacts sets of records', () => {
    const firstName = 'one'
    const secondName = 'two'
    const value = [
      { token: 'abc', name: firstName },
      { token: 'def', name: secondName },
    ]
    const fieldSchema = {
      type: 'set',
      elements: {
        type: 'record',
        fields: [
          { token: { type: 'string', encrypted: true } },
          { name: { type: 'string' } },
        ],
      },
    }

    expect(redactByApiSchema(value, fieldSchema)).toEqual([
      { token: REDACTED_MASK, name: firstName },
      { token: REDACTED_MASK, name: secondName },
    ])
  })

  it('redacts map values and inherits parent encrypted flag', () => {
    const fieldSchema = {
      type: 'map',
      encrypted: true,
      keys: { type: 'string' },
      values: { type: 'string' },
    }

    expect(redactByApiSchema({ alpha: 'secret-1', beta: 'secret-2' }, fieldSchema)).toEqual({
      alpha: REDACTED_MASK,
      beta: REDACTED_MASK,
    })
  })

  it('preserves values.encrypted when parent map encrypted is unset', () => {
    const fieldSchema = {
      type: 'map',
      keys: { type: 'string' },
      values: { type: 'string', encrypted: true },
    }

    expect(redactByApiSchema({ alpha: 'secret-1', beta: 'secret-2' }, fieldSchema)).toEqual({
      alpha: REDACTED_MASK,
      beta: REDACTED_MASK,
    })
  })

  it('recursively redacts map values that are records', () => {
    const firstLabel = 'one'
    const secondLabel = 'two'
    const value = {
      first: { token: 'abc', label: firstLabel },
      second: { token: 'def', label: secondLabel },
    }
    const fieldSchema = {
      type: 'map',
      keys: { type: 'string' },
      values: {
        type: 'record',
        fields: [
          { token: { type: 'string', encrypted: true } },
          { label: { type: 'string' } },
        ],
      },
    }

    expect(redactByApiSchema(value, fieldSchema)).toEqual({
      first: { token: REDACTED_MASK, label: firstLabel },
      second: { token: REDACTED_MASK, label: secondLabel },
    })
  })

  it('leaves map values unchanged when values schema is missing', () => {
    const value = { alpha: 'secret-1', beta: 'secret-2' }
    const fieldSchema = {
      type: 'map',
      keys: { type: 'string' },
    }

    expect(redactByApiSchema(value, fieldSchema)).toEqual(value)
  })

  it('returns the original value for unsupported schema types', () => {
    const booleanValue = true
    const numberValue = 10

    expect(redactByApiSchema(booleanValue, { type: 'boolean' })).toBe(booleanValue)
    expect(redactByApiSchema(numberValue, { type: 'number' })).toBe(numberValue)
  })
})

describe('redactByConfigSchema()', () => {
  it('redacts fields marked as Redacted', () => {
    const name = 'alice'
    const value = {
      secret: 'token',
      name,
    }
    const configSchema: ConfigurationSchema = {
      secret: { type: ConfigurationSchemaType.Redacted },
      name: { type: ConfigurationSchemaType.Text },
    }

    expect(redactByConfigSchema(value, configSchema)).toEqual({
      secret: REDACTED_MASK,
      name,
    })
  })

  it('redacts each item in RedactedArray fields', () => {
    const name = 'alice'
    const value = {
      secrets: ['a', 'b', 'c'],
      name,
    }
    const configSchema: ConfigurationSchema = {
      secrets: { type: ConfigurationSchemaType.RedactedArray },
    }

    expect(redactByConfigSchema(value, configSchema)).toEqual({
      secrets: [REDACTED_MASK, REDACTED_MASK, REDACTED_MASK],
      name,
    })
  })

  it('redacts nested records', () => {
    const name = 'alice'
    const label = 'safe'
    const value = {
      name,
      nested: {
        secret: 'inner-secret',
        label,
      },
    }
    const configSchema: ConfigurationSchema = {
      secret: { type: ConfigurationSchemaType.Redacted },
    }

    expect(redactByConfigSchema(value, configSchema)).toEqual({
      name,
      nested: {
        secret: REDACTED_MASK,
        label,
      },
    })
  })

  it('recursively redacts arrays of records', () => {
    const firstName = 'a'
    const secondName = 'b'
    const value = [
      { secret: 'one', name: firstName },
      { secret: 'two', name: secondName },
    ]
    const configSchema: ConfigurationSchema = {
      secret: { type: ConfigurationSchemaType.Redacted },
    }

    expect(redactByConfigSchema(value, configSchema)).toEqual([
      { secret: REDACTED_MASK, name: firstName },
      { secret: REDACTED_MASK, name: secondName },
    ])
  })
})
