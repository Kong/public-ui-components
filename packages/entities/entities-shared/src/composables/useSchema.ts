import { provide, inject, toRef } from 'vue'
import type { Ref } from 'vue'

type Schema = Record<string, any>

const providerKey = Symbol('schema')

export const useSchemaProvider = (schema: Ref<Schema>) => {
  provide(providerKey, schema)
}

/**
 * find the sub schema by key and provide it as the parent schema for the children
 * @param subSchemaKey the key of the sub schema
 * @returns the sub schema or undefined
 */
export const useSubSchema = (subSchemaKey: string): Readonly<Ref<Schema | undefined>> => {
  const schema = inject<Ref<Schema> | undefined>(providerKey, undefined)

  const field = schema?.value?.fields?.find((subSchema: Schema) => {
    return Object.keys(subSchema)[0] === subSchemaKey
  })
  const subSchema = toRef(field?.[subSchemaKey])

  provide(providerKey, subSchema)
  return subSchema
}
