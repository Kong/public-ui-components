import { describe, expect, it } from 'vitest'
import {
  buildArraySchemaMap,
  buildMapSchemaMap,
  buildRecordSchemaMap,
  buildSchemaMap,
} from './schema'

import type {
  ArrayFieldSchema,
  MapFieldSchema,
  RecordFieldSchema,
  SetFieldSchema,
  UnionFieldSchema,
} from '../../../../types/plugins/form-schema'

const str = (): UnionFieldSchema => ({ type: 'string' } as UnionFieldSchema)
const bool = (): UnionFieldSchema => ({ type: 'boolean' } as UnionFieldSchema)

const record = (fields: Array<Record<string, UnionFieldSchema>>): RecordFieldSchema => ({
  type: 'record',
  fields,
} as RecordFieldSchema)

const array = (elements?: UnionFieldSchema): ArrayFieldSchema => ({
  type: 'array',
  elements,
} as ArrayFieldSchema)

const set = (elements?: UnionFieldSchema): SetFieldSchema => ({
  type: 'set',
  elements,
} as SetFieldSchema)

const map = (values: UnionFieldSchema): MapFieldSchema => ({
  type: 'map',
  keys: { type: 'string' } as UnionFieldSchema,
  values,
} as MapFieldSchema)

describe('buildSchemaMap', () => {
  it('returns record entries for record schema root', () => {
    const name = str()
    const output = buildSchemaMap(record([{ name }]))

    expect(output).toEqual({ name })
  })

  it('returns wildcard entry for array schema root', () => {
    const item = str()
    const output = buildSchemaMap(array(item), 'items')

    expect(output).toEqual({ 'items.*': item })
  })

  it('returns wildcard entry for map schema root', () => {
    const value = str()
    const output = buildSchemaMap(map(value), 'headers')

    expect(output).toEqual({ 'headers.*': value })
  })

  it('returns empty map for scalar schema root', () => {
    expect(buildSchemaMap(str())).toEqual({})
  })

  it('supports pathPrefix for record schema root', () => {
    const enabled = bool()
    const output = buildSchemaMap(record([{ enabled }]), 'config')

    expect(output).toEqual({ 'config.enabled': enabled })
  })
})

describe('buildRecordSchemaMap', () => {
  it('builds flat entries for scalar fields without prefix', () => {
    const a = str()
    const b = bool()

    expect(buildRecordSchemaMap(record([{ a }, { b }]))).toEqual({ a, b })
  })

  it('builds entries with prefix', () => {
    const host = str()

    expect(buildRecordSchemaMap(record([{ host }]), 'config')).toEqual({
      'config.host': host,
    })
  })

  it('returns empty object for empty fields array', () => {
    expect(buildRecordSchemaMap(record([]))).toEqual({})
  })

  it('recurses through nested record > record > record (deep nesting)', () => {
    const c = str()
    const schema = record([
      {
        a: record([
          {
            b: record([
              { c },
            ]),
          },
        ]),
      },
    ])

    expect(buildRecordSchemaMap(schema)).toEqual({
      a: schema.fields[0].a,
      'a.b': (schema.fields[0].a as RecordFieldSchema).fields[0].b,
      'a.b.c': c,
    })
  })

  it('covers recursion combinations for record children (record, array, map)', () => {
    const recLeaf = str()
    const arrLeaf = str()
    const mapLeaf = str()
    const schema = record([
      { rec: record([{ leaf: recLeaf }]) },
      { arr: array(arrLeaf) },
      { dict: map(mapLeaf) },
    ])

    expect(buildRecordSchemaMap(schema)).toEqual({
      rec: schema.fields[0].rec,
      'rec.leaf': recLeaf,
      arr: schema.fields[1].arr,
      'arr.*': arrLeaf,
      dict: schema.fields[2].dict,
      'dict.*': mapLeaf,
    })
  })

  it('pins set asymmetry: record child with type set does not recurse', () => {
    const tags = set(str())
    const output = buildRecordSchemaMap(record([{ tags: tags as unknown as UnionFieldSchema }]))

    expect(output).toEqual({ tags })
    expect(Object.keys(output)).not.toContain('tags.*')
  })

  it('uses only the first key when a field definition has multiple keys', () => {
    const first = str()
    const second = bool()
    const fieldDef = { first, second } as unknown as Record<string, UnionFieldSchema>

    const output = buildRecordSchemaMap(record([fieldDef]))

    expect(output).toEqual({ first })
    expect(output.second).toBeUndefined()
  })
})

describe('buildArraySchemaMap', () => {
  it('builds wildcard entry for scalar elements with prefix', () => {
    const elem = str()

    expect(buildArraySchemaMap(array(elem), 'items')).toEqual({
      'items.*': elem,
    })
  })

  it('returns empty object when elements is missing', () => {
    expect(buildArraySchemaMap(array(undefined), 'items')).toEqual({})
  })

  it('pins leading-dot behavior when prefix is empty string', () => {
    const elem = str()

    expect(buildArraySchemaMap(array(elem), '')).toEqual({
      '.*': elem,
    })
  })

  it('covers recursion combinations for array elements (record, array, map)', () => {
    const recLeaf = str()
    const arrLeaf = str()
    const mapLeaf = str()

    expect(buildArraySchemaMap(array(record([{ leaf: recLeaf }])), 'items')).toEqual({
      'items.*': record([{ leaf: recLeaf }]),
      'items.*.leaf': recLeaf,
    })

    expect(buildArraySchemaMap(array(array(arrLeaf)), 'items')).toEqual({
      'items.*': array(arrLeaf),
      'items.*.*': arrLeaf,
    })

    expect(buildArraySchemaMap(array(map(mapLeaf)), 'items')).toEqual({
      'items.*': map(mapLeaf),
      'items.*.*': mapLeaf,
    })
  })

  it('supports deep nesting array > map > record', () => {
    const value = bool()
    const schema = array(map(record([{ enabled: value }])))

    expect(buildArraySchemaMap(schema, 'items')).toEqual({
      'items.*': (schema.elements as UnionFieldSchema),
      'items.*.*': (schema.elements as MapFieldSchema).values,
      'items.*.*.enabled': value,
    })
  })
})

describe('buildMapSchemaMap', () => {
  it('builds wildcard entry for scalar values with prefix', () => {
    const value = str()

    expect(buildMapSchemaMap(map(value), 'headers')).toEqual({
      'headers.*': value,
    })
  })

  it('builds wildcard entry with no prefix', () => {
    const value = str()

    expect(buildMapSchemaMap(map(value))).toEqual({
      '.*': value,
    })
  })

  it('covers recursion combinations for map values (record, array, map)', () => {
    const recLeaf = str()
    const arrLeaf = str()
    const mapLeaf = str()

    expect(buildMapSchemaMap(map(record([{ leaf: recLeaf }])), 'headers')).toEqual({
      'headers.*': record([{ leaf: recLeaf }]),
      'headers.*.leaf': recLeaf,
    })

    expect(buildMapSchemaMap(map(array(arrLeaf)), 'headers')).toEqual({
      'headers.*': array(arrLeaf),
      'headers.*.*': arrLeaf,
    })

    expect(buildMapSchemaMap(map(map(mapLeaf)), 'headers')).toEqual({
      'headers.*': map(mapLeaf),
      'headers.*.*': mapLeaf,
    })
  })

  it('handles set-typed map values like array values', () => {
    const tag = str()
    const setValue = set(tag)

    expect(buildMapSchemaMap(map(setValue as unknown as UnionFieldSchema), 'headers')).toEqual({
      'headers.*': setValue,
      'headers.*.*': tag,
    })
  })

  it('supports deep nesting record > array > map > record', () => {
    const host = str()
    const output = buildMapSchemaMap(map(record([
      {
        config: array(map(record([{ host }]))),
      },
    ])), 'root')

    expect(output).toEqual({
      'root.*': record([
        {
          config: array(map(record([{ host }]))),
        },
      ]),
      'root.*.config': array(map(record([{ host }]))),
      'root.*.config.*': map(record([{ host }])),
      'root.*.config.*.*': record([{ host }]),
      'root.*.config.*.*.host': host,
    })
  })
})

describe('schema map builders', () => {
  it('do not mutate input schema objects', () => {
    const input = record([
      {
        config: map(array(record([{ enabled: bool() }]))),
      },
    ])
    const before = JSON.parse(JSON.stringify(input))

    buildSchemaMap(input)
    buildRecordSchemaMap(input)
    buildArraySchemaMap(array(input), 'items')
    buildMapSchemaMap(map(input), 'headers')

    expect(input).toEqual(before)
  })
})
