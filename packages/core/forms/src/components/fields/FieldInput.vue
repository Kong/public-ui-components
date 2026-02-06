<template>
  <div class="form-field-wrapper">
    <KInput
      v-bind="$attrs"
      :id="getFieldID(schema)"
      :autocomplete="schema.autocomplete"
      :class="schema.fieldClasses"
      :disabled="disabled || undefined"
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
      :show-password-mask-toggle="inputType === 'password'"
      :type="inputType"
      :width="schema.width"
      @blur="onBlur"
      @update:model-value="onInput"
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
import { computed, inject, onBeforeMount, onMounted, ref, toRefs, type PropType } from 'vue'
import fecha from 'fecha'
import type { DebouncedFunc } from 'lodash-es'
import type { AutofillSlot } from '../../types'
import { AUTOFILL_SLOT } from '../../const'
import debounce from 'lodash-es/debounce'
import objGet from 'lodash-es/get'
import isFunction from 'lodash-es/isFunction'
import isNumber from 'lodash-es/isNumber'
import isFinite from 'lodash-es/isFinite'
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

const inputType = computed((): string => {
  const iType = props.schema?.inputType.toLowerCase()

  // special case: referenceable number type should use text input to allow for vault-formatted strings
  if (iType === 'number' && props.schema?.referenceable === true) {
    return 'text'
  }

  switch (iType) {
    // 'string' maps to 'text' input type
    case 'string':
      return 'text'

    // 'datetime' maps to 'datetime-local'
    case 'datetime':
      return 'datetime-local'

    default:
      return iType || 'text'
  }
})

const DATETIME_FORMATS = {
  date: 'YYYY-MM-DD',
  datetime: 'YYYY-MM-DD HH:mm:ss',
  'datetime-local': 'YYYY-MM-DDTHH:mm:ss',
}

// manually update model with correctly formatted value when input changes
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

// parse numeric values, track new input value, and emit model updated event
const onInput = (val: string): void => {
  let formattedVal: string | number = val

  switch (props.schema.inputType) {
    case 'number':
    case 'range':
      if (isFinite(parseFloat(val))) {
        formattedVal = parseFloat(val)
      }
      break
  }

  inputValue.value = formattedVal
  updateModelValue(formattedVal, val)
}

const handleAutofill = (value: string) => {
  inputValue.value = value
  updateModelValue(value, value)
}

const debouncedFormatFunc = ref<DebouncedFunc<(newValue: string, oldValue: string) => void> | null>(null)

// Clean up debounced calls
const onBlur = (): void => {
  if (isFunction(debouncedFormatFunc.value)) {
    debouncedFormatFunc.value?.flush()
  }
}

onMounted((): void => {
  // Set up debounced functions for formatting dates and numbers
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

onBeforeMount((): void => {
  // Deprecation warnings - these should not be shown. If we see them, it means the logic determining which component to render is broken.
  if (inputType.value === 'checkbox') {
    console.warn("The use of 'checkbox' inputType with 'input' type fields is deprecated. Use 'checkbox' type instead.")
  } else if (inputType.value === 'radio') {
    console.warn("The use of 'radio' inputType with 'input' type fields is deprecated. Use 'radio' type instead.")
  } else if (inputType.value === 'file') {
    console.warn("The 'file' type in input field is deprecated. Use 'file' field instead.")
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
    padding: var(--kui-space-0, $kui-space-0);
  }

  :deep(input[type="password"]::-ms-reveal) {
    display: none;
  }
}
</style>
