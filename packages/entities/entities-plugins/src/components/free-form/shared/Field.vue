<template>
  <component :is="$slots[FIELD_RENDERERS]" />

  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <!-- custom rendering -->
  <component
    :is="field.renderer.value"
    v-else-if="field.renderer.value"
    :name="utils.resolveRoot(field.path.value)"
  />

  <template v-else>
    <!-- matched renderer -->
    <component
      :is="fieldRenderer"
      v-if="fieldRenderer"
      :name="utils.resolveRoot(field.path.value)"
    />

    <!-- renderer missing alert -->
    <KAlert
      v-else
      appearance="warning"
      :message="`${field.path.value } ${ field.schema.value!.type } (no renderer yet)`"
    />

    <!-- child elements -->
    <slot />
  </template>
</template>

<script lang="ts">
import type {
  ComponentOptionsMixin,
  CreateComponentPublicInstanceWithMixins,
  EmitsOptions,
  EmitsToProps,
  PublicProps,
  SlotsType,
} from 'vue'
import type { DeepKeys, DeepValue } from './types/util-types'
import type { FieldCommonProps, ContainerFieldCommonSlots } from './types/types'

export type FieldProps<
  TParentData,
  TName extends DeepKeys<TParentData>,
> = FieldCommonProps<TParentData, TName>

export type FieldSlots<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName>,
> = ContainerFieldCommonSlots<TParentData, TName, TData>

export type FieldComponent<
  TParentData,
> = new <
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName>,
>(
  props: FieldProps<TParentData, TName> &
    EmitsToProps<EmitsOptions> &
    PublicProps,
) => CreateComponentPublicInstanceWithMixins<
  FieldProps<TParentData, TName>,
  object,
  object,
  Record<string, any>,
  Record<string, any>,
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  EmitsOptions,
  PublicProps,
  object,
  false,
  Record<string, any>,
  SlotsType<ContainerFieldCommonSlots<TParentData, TName, TData>>
>

</script>

<script
  setup
  lang="ts"
  generic="
    TParentData,
    TName extends DeepKeys<TParentData>,
    TData extends DeepValue<TParentData, TName>,
  "
>
import { computed, toRef } from 'vue'
import { useField, FIELD_RENDERERS } from './composables'
import * as utils from './utils'

import StringField from './StringField.vue'
import BooleanField from './BooleanField.vue'
import ArrayField from './ArrayField.vue'
import ObjectField from './ObjectField.vue'
import NumberField from './NumberField.vue'
import EnumField from './EnumField.vue'
import KeyValueField from './KeyValueField.vue'
import TagField from './TagField.vue'

defineOptions({ name: 'AutoField' })

const props = defineProps<FieldProps<TParentData, TName>>()

defineSlots<FieldSlots<TParentData, TName, TData>>()

const field = useField(toRef(props, 'name'), props.ignoreRelativePath, props.scope)

const fieldRenderer = computed(() => {

  switch (field.schema?.value?.type) {
    case 'string':
      return ('one_of' in field.schema.value) ? EnumField : StringField
    case 'boolean':
      return ('one_of' in field.schema.value) ? EnumField : BooleanField
    case 'number':
    case 'integer':
      return ('one_of' in field.schema.value) ? EnumField : NumberField
    case 'array':
      return ArrayField
    case 'set':
      if (utils.isTagField(field.schema)) {
        return TagField
      }
      return EnumField
    case 'record':
      return ObjectField
    case 'map':
      return KeyValueField
    default:
      return undefined
  }
})
</script>
