<template>
  <div class="form-field-wrapper field-checkbox">
    <KCheckbox
      v-bind="$attrs"
      :id="getFieldID(schema)"
      v-model="inputValue"
      :autocomplete="schema.autocomplete"
      :class="schema.fieldClasses"
      :description="checkboxDescription || undefined"
      :disabled="disabled || undefined"
      :help="hint ? hint : undefined"
      :label="schema.checkboxLabel || undefined"
      :label-attributes="schema.checkboxLabel && schema.help ? { tooltipAttributes: { maxWidth: '300' } } : undefined"
      :name="schema.inputName"
      :readonly="schema.readonly"
      :required="schema.required"
      :width="schema.width"
    >
      <template
        v-if="schema.checkboxLabel && schema.help"
        #tooltip
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="tooltipHtml" />
      </template>
    </KCheckbox>
  </div>
</template>

<script lang="ts" setup>
import DOMPurify from 'dompurify'
import { computed, toRefs, type PropType } from 'vue'
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

const tooltipHtml = computed(() => {
  if (!props.schema.help) return ''
  return DOMPurify.sanitize(props.schema.help.replace(/<\/?p>/g, '').trim())
})

const checkboxDescription = computed(() => {
  const desc = props.schema.checkboxDescription
  if (typeof desc === 'function') return desc(props.model) || undefined
  return desc || undefined
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
