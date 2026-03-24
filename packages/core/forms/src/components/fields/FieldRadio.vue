<template>
  <div class="radio-selection-group">
    <KRadio
      v-for="(option, i) in schema.values"
      :id="schema.name + '-' + i"
      :key="option.value"
      v-model="inputValue"
      :label="option.name"
      :label-attributes="{ info: schema.help }"
      :name="schema.name"
      :required="schema.required || undefined"
      :selected-value="option.value"
      @change="onChange"
    />
  </div>
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
  /**
   * TODO: stronger type
   * TODO: pass this down to KInput error and errorMessage
   */
  errors: {
    type: Array,
    default: () => [],
  },
  hint: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (event: 'modelUpdated', value: any, model: Record<string, any>): void
}>()

const propsRefs = toRefs(props)

const { updateModelValue, value: inputValue, clearValidationErrors } = composables.useAbstractFields({
  model: propsRefs.model,
  schema: props.schema,
  formOptions: props.formOptions,
  emitModelUpdated: (data: { value: any, model: Record<string, any> }): void => {
    emit('modelUpdated', data.value, data.model)
  },
})

defineExpose({
  clearValidationErrors,
})

const onChange = (val: string | number | boolean | object | null) => {
  let updatedValue = val
  if (typeof val === 'string') {
    updatedValue = val.split(',')
    if (!props.schema.array) {
      updatedValue = updatedValue.toString()
    }
  }

  updateModelValue(updatedValue, val)
}
</script>

<style lang="scss" scoped>
.radio-selection-group {
  align-items: center;
  display: flex;
  gap: var(--kui-space-60, $kui-space-60);

  :deep(.k-radio) {
    align-items: baseline;
  }
}
</style>
