import StringField from './StringField.vue'
import BooleanField from './BooleanField.vue'
import ArrayField from './ArrayField.vue'
import ObjectField from './ObjectField.vue'
import NumberField from './NumberField.vue'
import EnumField from './EnumField.vue'
import StringArrayField from './StringArrayField.vue'
import JsonField from './JsonField.vue'
import ForeignField from './ForeignField.vue'
import MapField from './MapField.vue'
import * as utils from './utils'

import type { Component } from 'vue'
import type { UnionFieldSchema } from '../../../types/plugins/form-schema'

function pickFieldComponent(schema: UnionFieldSchema | undefined) {
  switch (schema?.type) {
    case 'string':
      return ('one_of' in schema) ? EnumField : StringField
    case 'boolean':
      return ('one_of' in schema) ? EnumField : BooleanField
    case 'number':
    case 'integer':
      return ('one_of' in schema) ? EnumField : NumberField
    case 'array':
      return ArrayField
    case 'set':
      return utils.isTagField(schema) ? StringArrayField : EnumField
    case 'record':
      return ObjectField
    case 'map':
      return MapField
    case 'json':
      return JsonField
    case 'foreign':
      return ForeignField
    default:
      return undefined
  }
}

/**
 * Resolves the component that renders a field's plain value, from its schema
 * type alone.
 *
 * Lives here rather than inside `Field.vue` because `ExpressionField` needs the
 * same mapping to render the value half of an expressible field, and importing
 * `Field.vue` for it would be circular.
 *
 * Returns `undefined` for a type with no renderer yet; callers surface that.
 */
export function resolveFieldComponent(schema: UnionFieldSchema | undefined): Component | undefined {
  // Widened deliberately: the SFCs' own inferred types reference their private
  // prop interfaces, which declaration emit cannot name, and some are generic
  // enough that `Component` rejects them outright. `Component` is all any
  // caller needs to hand the result to `<component :is>`.
  return pickFieldComponent(schema) as Component | undefined
}
