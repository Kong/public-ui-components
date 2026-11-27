import { defineRevealAdapter } from './composables/reveal-adapter'
import ArrayField from './components/ArrayField.vue'
import BooleanField from './components/BooleanField.vue'
import CelField from './components/CelField.vue'
import EnumField from './components/EnumField.vue'
import Field from './components/Field.vue'
import ForeignField from './components/ForeignField.vue'
import JsonField from './components/JsonField.vue'
import MapField from './components/MapField.vue'
import NumberField from './components/NumberField.vue'
import ObjectField from './components/ObjectField.vue'
import StringArrayField from './components/StringArrayField.vue'
import StringField from './components/StringField.vue'
import SwitchField from './components/SwitchField.vue'

import type { FieldCover } from './composables/reveal-adapter'
import type { RenderRules } from './types'

/**
 * A field component renders the field its `name` names, except what it `omit`s,
 * and applies its `renderRules` to its children
 */
function toField(props: { name?: string, omit?: string[], renderRules?: RenderRules, 'render-rules'?: RenderRules }): FieldCover | undefined {
  if (!props.name) {
    return undefined
  }
  const renderRules = props.renderRules ?? props['render-rules']
  return { path: props.name, exclude: props.omit, ...(renderRules ? { renderRules } : {}) }
}

for (const component of [
  ArrayField, BooleanField, CelField, EnumField, Field, ForeignField, JsonField,
  MapField, NumberField, ObjectField, StringArrayField, StringField, SwitchField,
]) {
  defineRevealAdapter(component, { field: toField })
}
