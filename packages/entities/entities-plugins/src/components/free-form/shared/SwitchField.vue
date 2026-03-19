<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div
    v-else
    v-show="!hide"
    class="ff-switch-field"
    :data-testid="`ff-${field.path.value}`"
  >
    <KInputSwitch
      v-bind="fieldAttrs"
      :model-value="!!(fieldValue == null ? (emptyOrDefaultValue || false) : fieldValue)"
      @update:model-value="handleUpdate"
    >
      <template #label>
        {{ fieldValue ? (enabledText || t('actions.enabled')) : (disabledText || t('actions.disabled')) }}
      </template>
    </KInputSwitch>
  </div>
</template>

<script setup lang="ts">
import { KInputSwitch, type LabelAttributes } from '@kong/kongponents'
import { useField, useFieldAttrs } from './composables'
import { toRef } from 'vue'
import type { BaseFieldProps } from './types'
import composables from '../../../composables'

interface SwitchFieldProps extends BaseFieldProps {
  labelAttributes?: LabelAttributes
  enabledText?: string
  disabledText?: string
}

const { i18n: { t } } = composables.useI18n()

const { name, enabledText, disabledText, ...props } = defineProps<SwitchFieldProps>()
const { value: fieldValue, hide, emptyOrDefaultValue, ...field } = useField<boolean>(toRef(() => name))
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const handleUpdate = (v: boolean) => {
  fieldValue!.value = v
  emit('update:modelValue', v)
}

const fieldAttrs = useFieldAttrs(field.path!, props)
</script>

<style lang="scss" scoped>
.ff-switch-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
