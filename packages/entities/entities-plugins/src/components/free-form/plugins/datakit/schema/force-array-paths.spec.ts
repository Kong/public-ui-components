import { describe, expect, it } from 'vitest'
import { DatakitConfigSchema, isValidForceArrayPath } from './strict'
import { DatakitConfigSchema as DatakitConfigCompatSchema } from './compat'

const xmlToJson = (force_array_paths: unknown) => ({
  nodes: [{ name: 'X', type: 'xml_to_json', attributes_name_prefix: '@', force_array_paths }],
})

describe('xml_to_json force_array_paths', () => {
  // Mirrors `validate_force_array_path` in kong-ee `kong/plugins/datakit/nodes/xml_to_json/init.lua`
  it.each([
    'store',
    'store/product',
    'soap:Envelope/soap:Body/ns.item-list_2',
    '_private',
  ])('accepts the element path "%s"', (path) => {
    expect(isValidForceArrayPath(path)).toBe(true)
  })

  it.each([
    '',
    '/store/product',
    'store/product/',
    'store//product',
    '1store',
    'store/pro duct',
    'store/*',
    'a'.repeat(257),
  ])('rejects the element path "%s"', (path) => {
    expect(isValidForceArrayPath(path)).toBe(false)
  })

  it.each([
    ['omitted', undefined],
    ['empty', []],
    ['set', ['store/product', 'store/tags']],
  ])('is accepted by the strict and compat schemas when %s', (_, paths) => {
    const config = xmlToJson(paths)

    expect(DatakitConfigSchema.safeParse(config).error).toBeUndefined()
    expect(DatakitConfigCompatSchema.safeParse(config).error).toBeUndefined()
  })

  it('is kept by the strict schema', () => {
    const { data } = DatakitConfigSchema.safeParse(xmlToJson(['store/product']))
    expect(data?.nodes[0]).toHaveProperty('force_array_paths', ['store/product'])
  })

  it.each([
    ['an invalid path', ['/store/product']],
    ['an empty path', ['']],
    ['a path longer than 256 characters', ['a'.repeat(257)]],
  ])('is rejected by the strict schema with %s', (_, paths) => {
    expect(DatakitConfigSchema.safeParse(xmlToJson(paths)).success).toBe(false)
  })
})
