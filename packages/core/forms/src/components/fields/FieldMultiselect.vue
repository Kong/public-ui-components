<template>
  <KMultiselect
    :id="getFieldID(schema)"
    v-model="inputValue"
    :aria-labelledby="getLabelId(schema)"
    :class="schema.fieldClasses"
    data-testid="field-multiselect"
    :disabled="disabled"
    :items="items"
    :kpop-attributes="{ 'data-testid': `${getFieldID(schema)}-items` }"
    :label-attributes="{ info: schema.help }"
    :name="schema.inputName"
    :placeholder="schema.placeholder"
    :required="schema.required || undefined"
    width="100%"
  />
</template>

<script lang="ts" setup>
import { computed, toRefs, type PropType } from 'vue'
import type { MultiselectItem } from '@kong/kongponents'
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

const { getLabelId, getFieldID, clearValidationErrors, value: inputValue } = composables.useAbstractFields({
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

const items = computed((): MultiselectItem[] => {
  if (props.schema.values) {
    return props.schema.values
  }

  if (props.schema.elements?.one_of?.length) {
    return props.schema.elements.one_of.map((value: string | number | boolean) => ({ label: String(value), value: String(value) } satisfies MultiselectItem))
  }

  return []
})
</script>
