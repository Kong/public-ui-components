import type { UnionFieldSchema } from '../../../../types/plugins/form-schema'
import { isTagField } from '../../shared/utils'

export function isEnumField(schema: UnionFieldSchema): boolean {
  return 'one_of' in schema && Array.isArray(schema.one_of)
}

export function isMultiEnumField(schema: UnionFieldSchema): boolean {
  return schema.type === 'set' && 'elements' in schema && 'one_of' in schema.elements
}

export { isTagField }
