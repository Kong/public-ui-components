import type { UnionFieldSchema } from '../../form-schema'
import { isTagField } from '../../utils'

export function isEnumField(schema: UnionFieldSchema): boolean {
  return 'one_of' in schema && Array.isArray(schema.one_of)
}

export function isMultiEnumField(schema: UnionFieldSchema): boolean {
  return schema.type === 'set' && 'elements' in schema && 'one_of' in schema.elements
}

export { isTagField }
