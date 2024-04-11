<template>
  <span
    class="field-label"
    :class="schema.fieldClasses"
  >
    <KLabel
      :id="getFieldID(schema)"
    >{{ labelValue }}</KLabel>
  </span>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import composables from '../../../composables'

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

const { getFieldID, value: labelValue } = composables.useAbstractFields({
  model: props.model,
  schema: props.schema,
  formOptions: props.formOptions,
})
</script>

<style lang="scss" scoped>
span.field-label {
  display: block;
  margin-left: 12px;
  width: 100%;
}
</style>
