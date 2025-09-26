<template>
  <div class="field-textarea">
    <KTextArea
      v-bind="$attrs"
      :id="getFieldID(schema)"
      v-model="inputValue"
      autosize
      :character-limit="schema.max ?? false"
      :class="schema.fieldClasses"
      :disabled="disabled || undefined"
      :help="hint || undefined"
      :minlength="schema.min"
      :name="schema.inputName"
      :placeholder="schema.placeholder"
      :readonly="schema.readonly"
      :required="schema.required"
      resizable
      :rows="schema.rows || 3"
    />

    <!-- autofill -->
    <component
      :is="autofillSlot"
      :schema="schema"
      :update="handleAutofill"
      :value="inputValue"
    />
  </div>
</template>

<script lang="ts" setup>
import { inject, toRefs, type PropType } from 'vue'
import type { AutofillSlot } from '../../types'
import { AUTOFILL_SLOT } from '../../const'
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

const autofillSlot = inject<AutofillSlot | undefined>(AUTOFILL_SLOT, undefined)

const { updateModelValue, getFieldID, clearValidationErrors, value: inputValue } = composables.useAbstractFields({
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

const handleAutofill = (value: string) => {
  inputValue.value = value
  updateModelValue(value, value)
}
</script>

<style lang="scss" scoped>
.field-textarea {
  width: 100%;
}
</style>
