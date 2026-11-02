import { provide, inject, computed, toValue } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'

type Schema = Record<string, any>

const providerKey = Symbol('schema')

export const useSchemaProvider = (schema: Readonly<Ref<Schema | undefined>>) => {
  provide(providerKey, schema)
}

export const useSchema = (): Readonly<Ref<Schema | undefined>> => {
  return inject<Ref<Schema> | undefined>(providerKey, undefined) as Readonly<Ref<Schema | undefined>>
}

const isIndexKey = (key: string): boolean => /^\d+$/.test(key)

/**
 * find the sub schema by key and provide it as the parent schema for the children
 * @param subSchemaKey the key of the sub schema, or the index of an element when the parent schema is an array or set
 * @returns the sub schema or undefined
 */
export const useSubSchema = (subSchemaKey: MaybeRefOrGetter<string>): Readonly<Ref<Schema | undefined>> => {
  const schema = useSchema()
  const subSchemaRef = computed(() => {
    const parentSchema = schema?.value
    const key = toValue(subSchemaKey)

    let subSchema: Schema | undefined
    if ((parentSchema?.type === 'array' || parentSchema?.type === 'set') && isIndexKey(key)) {
      const elementSchema = parentSchema.elements
      subSchema = elementSchema && {
        ...elementSchema,
        // encryption set if either parent or child is encrypted
        encrypted: Boolean(parentSchema.encrypted || elementSchema.encrypted),
      }
    } else {
      const field = parentSchema?.fields?.find((subSchema: Schema) => {
        return Object.keys(subSchema)[0] === key
      })
      subSchema = field?.[key]
    }

    return subSchema
  })
  provide(providerKey, subSchemaRef)
  return subSchemaRef
}
