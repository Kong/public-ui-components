import { defineComponent, h } from 'vue'

import ArrayField from './ArrayField.vue'
import BooleanField from './BooleanField.vue'
import EnumField from './EnumField.vue'
import Field from './Field.vue'
import KeyValueField from './KeyValueField.vue'
import NumberField from './NumberField.vue'
import ObjectField from './ObjectField.vue'
import StringField from './StringField.vue'
import TagField from './TagField.vue'
import FieldRenderer from './FieldRenderer.vue'

import type { FieldCommonProps } from './types/field-types'
import type { DeepKeys, DeepValue } from './types/util-types'
import type { ObjectFieldComponent } from './ObjectField.vue'
import type { StringFieldComponent } from './StringField.vue'
import type { ArrayFieldComponent } from './ArrayField.vue'
import type { EnumFieldComponent } from './EnumField.vue'
import type { BooleanFieldComponent } from './BooleanField.vue'
import type { FieldComponent } from './Field.vue'
import type { KeyValueFieldComponent } from './KeyValueField.vue'
import type { NumberFieldComponent } from './NumberField.vue'
import type { TagFieldComponent } from './TagField.vue'

export function fieldsBuilder<TData>() {
  function setScope<TScope extends DeepKeys<TData> | undefined = undefined>(scope?: TScope) {

    type ScopedData = TScope extends DeepKeys<TData>
      ? DeepValue<TData, TScope>
      : TData

    return {
      ArrayField: buildField<ArrayFieldComponent<ScopedData>>(ArrayField, scope),
      BooleanField: buildField<BooleanFieldComponent<ScopedData>>(BooleanField, scope),
      EnumField: buildField<EnumFieldComponent<ScopedData>>(EnumField, scope),
      Field: buildField<FieldComponent<ScopedData>>(Field, scope),
      KeyValueField: buildField<KeyValueFieldComponent<ScopedData>>(KeyValueField, scope),
      NumberField: buildField<NumberFieldComponent<ScopedData>>(NumberField, scope),
      ObjectField: buildField<ObjectFieldComponent<ScopedData>>(ObjectField, scope),
      StringField: buildField<StringFieldComponent<ScopedData>>(StringField, scope),
      TagField: buildField<TagFieldComponent<ScopedData>>(TagField, scope),
      FieldRenderer: FieldRenderer as typeof FieldRenderer<ScopedData>,
    }
  }

  return {
    ...setScope(),
    setScope,
  }
}

function buildField<T>(Component: any, scope?: string): T {
  return defineComponent((props, { slots }) => {
    return () => h(Component, {
      ...props,
      scope,
      ignoreRelativePath: true,
    } as FieldCommonProps<any, any>, slots)
  }) as T
}
