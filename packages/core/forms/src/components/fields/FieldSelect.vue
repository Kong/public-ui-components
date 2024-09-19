<template>
  <KSelect
    :id="getFieldID(schema)"
    v-model="inputValue"
    :class="schema.fieldClasses"
    :disabled="disabled || undefined"
    :items="items"
    :kpop-attributes="{ 'data-testid': `${getFieldID(schema)}-items` }"
    :label-attributes="{ info: schema.help }"
    :name="schema.inputName"
    :placeholder="!selectOptions.hideNoneSelectedText ? selectOptions.noneSelectedText || 'Nothing Selected' : undefined"
    :required="schema.required || undefined"
    width="100%"
  />
</template>

<script lang="ts" setup>
import { computed, toRefs, type PropType } from 'vue'
import type { SelectItem } from '@kong/kongponents'
import isObject from 'lodash-es/isObject'
import isNil from 'lodash-es/isNil'
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

const selectOptions = computed((): Record<string, any> => props.schema.selectOptions || {})

const formatValueToField = (value: Record<string, any>) => {
  if (isNil(value)) {
    return null
  }
  return value
}

const propsRefs = toRefs(props)

const { getFieldID, clearValidationErrors, value: inputValue } = composables.useAbstractFields({
  model: propsRefs.model,
  schema: props.schema,
  formOptions: props.formOptions,
  formatValueToField,
  emitModelUpdated: (data: { value: any, model: Record<string, any> }): void => {
    emit('modelUpdated', data.value, data.model)
  },
})

defineExpose({
  clearValidationErrors,
})

const items = computed((): SelectItem[] => {
  // values to be used in the select items
  const selectOptions = props.schema.values

  if (typeof selectOptions === 'function') {
    return getItemsFromValues(selectOptions.apply(this, [props.model, props.schema]))
  } else {
    return getItemsFromValues(selectOptions)
  }
})

const getItemsFromValues = (values: Record<string, any>[] | string[] | number[]): SelectItem[] => {
  const itemArray: SelectItem[] = []

  values.forEach(item => {
    itemArray.push({
      label: getItemName(item),
      value: getItemValue(item),
      disabled: typeof item === 'object' ? item.disabled || undefined : undefined,
      group: typeof item === 'object' ? String(item.group || '').toUpperCase() || undefined : undefined,
    })
  })

  // With Groups.
  return itemArray
}

const getItemValue = (item: string | number | Record<string, any>): string | number => {
  if (isObject(item)) {
    if (selectOptions.value && typeof selectOptions.value.value !== 'undefined') {
      return item[selectOptions.value.value]
    } else {
      // Use 'id' instead of 'value' cause of backward compatibility
      if (typeof item.id !== 'undefined') {
        return String(item.id)
      } else {
        throw new Error('`id` is not defined. If you want to use another key name, add a `value` property under `selectOptions` in the schema. https://icebob.gitbooks.io/vueformgenerator/content/fields/select.html#select-field-with-object-items')
      }
    }
  } else {
    return item
  }
}

const getItemName = (item: string | number | Record<string, any>): string => {
  if (isObject(item)) {
    if (selectOptions.value && typeof selectOptions.value.name !== 'undefined') {
      return item[selectOptions.value.name]
    } else {
      if (typeof item.name !== 'undefined') {
        return String(item.name)
      } else {
        throw new Error('`name` is not defined. If you want to use another key name, add a `name` property under `selectOptions` in the schema. https://icebob.gitbooks.io/vueformgenerator/content/fields/select.html#select-field-with-object-items')
      }
    }
  } else {
    return String(item)
  }
}
</script>
