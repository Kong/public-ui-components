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
import composables from '../../composables'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  formOptions: {
    type: Object as PropType<Record<string, any>>,
    default: () => undefined,
  },
  model: {
    type: Object as PropType<Record<string, any>>,
    default: () => undefined,
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
  schema: props.schema,
  formOptions: props.formOptions,
})
</script>

<style lang="scss" scoped>
span.field-label {
  display: block;
  margin-left: var(--kui-space-50, $kui-space-50);
  width: 100%;
}
</style>
