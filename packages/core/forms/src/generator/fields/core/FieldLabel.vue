<template>
  <span
    class="field-label"
    :class="schema.fieldClasses"
  >
    <KLabel :id="getFieldID(schema)">{{ labelValue }}</KLabel>
  </span>
</template>

<script lang="ts" setup>
import { toRefs, type PropType } from 'vue'
import composables from '../../../composables'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  formOptions: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  model: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  schema: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
  vfg: {
    type: Object,
    required: true,
  },
})

const propsRefs = toRefs(props)

const { getFieldID, value: labelValue } = composables.useAbstractFields({
  model: propsRefs.model,
  schema: propsRefs.schema,
  formOptions: propsRefs.formOptions,
})
</script>

<style lang="scss" scoped>
span.field-label {
  display: block;
  margin-left: $kui-space-50;
  width: 100%;
}
</style>
