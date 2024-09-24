<template>
  <div class="form-field-wrapper">
    <KInputSwitch
      :id="getFieldID(schema)"
      v-model="inputValue"
      :autocomplete="schema.autocomplete"
      :class="schema.fieldClasses"
      :disabled="disabled || undefined"
      :label="inputValue ? schema.textOn || t('vfg.labels.on') : schema.textOff || t('vfg.labels.off')"
      :label-attributes="{ info: schema.help }"
      :name="schema.inputName"
      :required="schema.required || undefined"
    />
  </div>
</template>

<script lang="ts" setup>
import { toRefs, type PropType } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import composables from '../../composables'
import english from '../../locales/en.json'

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

const { t } = createI18n<typeof english>('en-us', english)

const formatValueToField = (value: boolean): boolean => {
  if (value != null && props.schema.valueOn) {
    return value === props.schema.valueOn
  }

  return value
}

const formatValueToModel = (value: boolean): boolean => {
  if (value != null && props.schema.valueOn) {
    if (value) {
      return props.schema.valueOn
    }

    return props.schema.valueOff
  }

  return value
}

const propsRefs = toRefs(props)

const { getFieldID, value: inputValue, clearValidationErrors } = composables.useAbstractFields({
  model: propsRefs.model,
  schema: props.schema,
  formOptions: props.formOptions,
  formatValueToField,
  formatValueToModel,
  emitModelUpdated: (data: { value: any, model: Record<string, any> }): void => {
    emit('modelUpdated', data.value, data.model)
  },
})

defineExpose({
  clearValidationErrors,
})
</script>
