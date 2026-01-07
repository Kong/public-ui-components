<template>
  <div class="form-field-wrapper field-checkbox">
    <KCheckbox
      v-bind="$attrs"
      :id="getFieldID(schema)"
      v-model="inputValue"
      :autocomplete="schema.autocomplete"
      :class="schema.fieldClasses"
      :disabled="disabled || undefined"
      :help="hint ? hint : undefined"
      :name="schema.inputName"
      :readonly="schema.readonly"
      :required="schema.required"
      :width="schema.width"
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

const { getFieldID, value: inputValue, clearValidationErrors } = composables.useAbstractFields({
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
</script>

<style lang="scss" scoped>
.field-checkbox input {
  margin-left: var(--kui-space-50, $kui-space-50);
}
</style>
