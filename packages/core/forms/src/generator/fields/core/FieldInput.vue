<template>
  <div class="form-field-wrapper">
    <!--
    TODO: all these attributes are needed??
    :accept="schema.accept"
      :alt="schema.alt"
      :dirname="schema.dirname"
      :checked="schema.checked || null"
        :files="schema.files"
      :formaction="schema.formaction"
      :formenctype="schema.formenctype"
      :formmethod="schema.formmethod"
      :formnovalidate="schema.formnovalidate"
      :formtarget="schema.formtarget"
      :height="schema.height"
      :list="schema.list"
      :multiple="schema.multiple"
      :size="schema && schema.size > 0 ? schema.size : 1"
      :src="schema.src"
      :step="schema.step"
  -->
    <KInput
      v-bind="$attrs"
      :id="getFieldID(schema)"
      :autocomplete="schema.autocomplete"
      :class="schema.fieldClasses"
      :disabled="disabled || null"
      :help="hint ? hint : inputType === 'color' || inputType === 'range' ? inputValue : undefined"
      :max="schema.max"
      :maxlength="schema.maxlength"
      :min="schema.min"
      :minlength="schema.minlength"
      :model-value="inputValue"
      :name="schema.inputName"
      :pattern="schema.pattern"
      :placeholder="schema.placeholder"
      :readonly="schema.readonly"
      :required="schema.required"
      :type="inputType"
      :width="schema.width"
      @blur="onBlur"
      @input="onInput"
      @update:model-value="schema.onChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onBeforeMount, onMounted, type PropType } from 'vue'
import fecha from 'fecha'
import { debounce, get as objGet, isFunction, isNumber, type DebouncedFunc } from 'lodash'
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

const DATETIME_FORMATS = {
  date: 'YYYY-MM-DD',
  datetime: 'YYYY-MM-DD HH:mm:ss',
  'datetime-local': 'YYYY-MM-DDTHH:mm:ss',
}
const debouncedFormatFunc = ref<DebouncedFunc<(newValue: string, oldValue: string) => void> | null>(null)

const { updateModelValue, getFieldID, value: inputValue } = composables.useAbstractFields({
  model: props.model,
  schema: props.schema,
  formOptions: props.formOptions,
})

const inputType = computed((): string => {
  if (props.schema?.inputType === 'datetime') {
    // convert "datetime" to "datetime-local" (datetime deprecated in favor of "datetime-local")
    // ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime
    return 'datetime-local'
  }

  return props.schema?.inputType.toLowerCase() || 'text'
})

/*
// TODO: these functions are defined but aren't used?
const formatValueToModel = (value: any): any => {
  if (value != null) {
    switch (inputType.value) {
      case 'date':
      case 'datetime':
      case 'datetime-local':
      case 'number':
      case 'range':
        // debounce
        return (newValue, oldValue) => {
          debouncedFormatFunc(value, oldValue)
        }
    }
  }

  return value
}

const formatValueToField = (value): any => {
  switch (inputType.value) {
    case 'date':
    case 'datetime':
    case 'datetime-local':
      return formatDatetimeValueToField(value)
  }

  return value
}

const formatDatetimeValueToField = (value: any): any => {
  if (value === null || undefined === value) {
    return null
  }

  const defaultFormat = DATETIME_FORMATS[inputType.value]
  let m = value

  if (!isNumber(value)) {
    m = fecha.parse(value, defaultFormat)
  }

  if (m) {
    return fecha.format(m, defaultFormat)
  }

  return m
}
*/

const formatDatetimeToModel = (newValue: string, oldValue: string): void => {
  let formatted: string | number = newValue
  const defaultFormat = DATETIME_FORMATS[inputType.value as keyof typeof DATETIME_FORMATS] || ''
  const m = fecha.parse(newValue, defaultFormat)

  if (m) {
    if (props.schema?.format) {
      formatted = fecha.format(m, props.schema?.format)
    } else {
      formatted = m.valueOf()
    }
  }

  updateModelValue(formatted, oldValue)
}

const formatNumberToModel = (newValue: any, oldValue: any): void => {
  if (!isNumber(newValue)) {
    newValue = NaN
  }

  updateModelValue(newValue, oldValue)
}

const onInput = ($event: any): void => {
  let value = $event.target?.value

  switch (inputType.value) {
    case 'number':
    case 'range':
      if (isNumber(parseFloat($event.target?.value))) {
        value = parseFloat($event.target.value)
      }
      break
  }

  inputValue.value = value
}

const onBlur = () => {
  if (isFunction(debouncedFormatFunc.value)) {
    debouncedFormatFunc.value?.flush()
  }
}

onBeforeMount(() => {
  if (inputType.value === 'file') {
    console.warn("The 'file' type in input field is deprecated. Use 'file' field instead.")
  }
})

onMounted(() => {
  switch (inputType.value) {
    case 'number':
    case 'range':
      debouncedFormatFunc.value = debounce(
        (newValue: any, oldValue: any) => {
          formatNumberToModel(newValue, oldValue)
        },
        parseInt(objGet(props.schema, 'debounceFormatTimeout', 1000)),
        {
          trailing: true,
          leading: false,
        },
      )
      break
    case 'date':
    case 'datetime':
    case 'datetime-local':
      // wait 1s before calling 'formatDatetimeToModel' to allow user to input data
      debouncedFormatFunc.value = debounce(
        (newValue: string, oldValue: string) => {
          formatDatetimeToModel(newValue, oldValue)
        },
        parseInt(objGet(props.schema, 'debounceFormatTimeout', 1000)),
        {
          trailing: true,
          leading: false,
        },
      )
      break
  }
})
</script>

<style lang="scss" scoped>
.form-field-wrapper {
  width: 100%;

  :deep(input[type="radio"]) {
    width: 100%;
  }

  :deep(input[type="color"]) {
    width: 60px;
  }

  :deep(input[type="range"]) {
    padding: 0;
  }
}
</style>
