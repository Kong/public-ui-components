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

/** A field component renders the field its `name` names, except what it `omit`s */
function toField(props: { name?: string, omit?: string[] }): FieldCover | undefined {
  return props.name ? { path: props.name, exclude: props.omit } : undefined
}

for (const component of [
  ArrayField, BooleanField, CelField, EnumField, Field, ForeignField, JsonField,
  MapField, NumberField, ObjectField, StringArrayField, StringField, SwitchField,
]) {
  defineRevealAdapter(component, { field: toField })
}
