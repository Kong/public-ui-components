<template>
  <div class="field-string-array">
    <KInput
      v-bind="$attrs"
      :id="getFieldID(schema)"
      :aria-labelledby="getLabelId(schema)"
      :class="schema.fieldClasses"
      :help="'Use comma to separate values. eg: value1, value2'"
      :model-value="rawInputValue"
      :placeholder="schema.placeholder || 'Comma separated values'"
      type="text"
      @update:model-value="handleUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, toRef, watch } from 'vue'
import composables from '../../composables'

const {
  formOptions,
  model,
  schema,
} = defineProps<{
  formOptions?: Record<string, any>
  model?: Record<string, any>
  schema: Record<string, any>
}>()

const emit = defineEmits<{
  'modelUpdated': [value: any, model: Record<string, any>]
}>()

const { updateModelValue, getFieldID, getLabelId, clearValidationErrors, value: fieldValue } = composables.useAbstractFields<string[] | null>({
  model: toRef(() => model),
  schema,
  formOptions,
  emitModelUpdated: (data: { value: any, model: Record<string, any> }): void => {
    emit('modelUpdated', data.value, data.model)
  },
})

defineExpose({
  clearValidationErrors,
})

// Internal state to preserve user's raw input
const rawInputValue = ref('')

/**
 * Convert an array of strings to a comma-separated string for display.
 * @param arr - The array to convert
 * @returns Comma-separated string
 */
function arrToStr(arr: string[] | null | undefined) {
  if (!Array.isArray(arr)) return ''
  return arr.map(item => String(item).trim()).filter(Boolean).join(', ')
}

/**
 * Convert a comma-separated string to an array of strings.
 * @param str - The comma-separated string
 * @returns Array of trimmed, non-empty strings
 */
function strToArr(str: string) {
  if (!str) return []
  return str.trim().split(',').map(item => item.trim()).filter(Boolean)
}

/**
 * Handle input changes.
 * Preserves raw input value and updates model with parsed array.
 * @param value - The raw input string value
 */
function handleUpdate(value: string) {
  rawInputValue.value = value
  const arr = strToArr(value)
  updateModelValue(arr, fieldValue.value)
}

/**
 * Sync fieldValue to rawInputValue ONLY when their formatted values are different.
 * This prevents overwriting user's raw input while they're still typing.
 */
watch(fieldValue, (newValue) => {
  const nv = newValue ? arrToStr(newValue) : ''
  const ov = arrToStr(strToArr(rawInputValue.value))
  if (ov !== nv) {
    rawInputValue.value = nv
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.field-string-array {
  width: 100%;
}
</style>
