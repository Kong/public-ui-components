<template>
  <VueFormGenerator
    v-if="displayForm"
    :model="formModel"
    :options="formOptions"
    :schema="finalSchema"
    @model-updated="onModelUpdated"
  />
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import type { PropType } from 'vue'
import { computed, provide, useSlots } from 'vue'
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '../../const'
import english from '../../locales/en.json'
import type { AutofillSlot } from '../../types'
import VueFormGenerator from '../FormGenerator.vue'

// Provide AUTOFILL_SLOT
provide<AutofillSlot | undefined>(AUTOFILL_SLOT, useSlots()?.[AUTOFILL_SLOT_NAME])

const { t, te } = createI18n<typeof english>('en-us', english)

const props = defineProps({
  formModel: {
    type: Object,
    required: true,
  },
  formSchema: {
    type: Object,
    required: true,
  },
  formOptions: {
    type: Object,
    default: () => {},
  },
  onModelUpdated: {
    type: Function as PropType<() => void>,
    required: true,
  },
  isEditing: {
    type: Boolean,
    required: true,
  },
})

const displayForm = computed((): boolean => {
  return (props.formModel.id && props.isEditing) || !props.isEditing
})

const finalSchema = computed((): Record<string, any> => {
  const final = props.formSchema

  final.fields.map((f:any) => {
    const stringKey = `exit-transformer.${f.model}`
    // @ts-ignore - dynamic i18n key
    f.hint = (te(`${stringKey}.hint`) && t(`${stringKey}.hint`)) || f.hint
    // @ts-ignore - dynamic i18n key
    f.help = (te(`${stringKey}.help`) && t(`${stringKey}.help`)) || f.help
    // @ts-ignore - dynamic i18n key
    f.newElementButtonLabel = (te(`${stringKey}.newElementButtonLabel`) && t(`${stringKey}.newElementButtonLabel`)) || f.newElementButtonLabel

    if (f.model !== 'tags' && (f.valueType === 'array' || f.type === 'array')) {
      f.type = 'array'
      f.valueArrayType = 'array'
      f.itemContainerComponent = 'FieldArrayItem'
      f.fieldClasses = 'exit-transformer-array-item-container'
      f.fieldItemsClasses = 'exit-transformer-array-item'
      f.inputAttributes = { ...f.inputAttributes, type: 'textarea' }
    }
    return f
  })
  return final
})
</script>

<style lang="scss" scoped>
:deep(.exit-transformer-array-item-container) {
  width: 100%;
}

:deep(.exit-transformer-array-item) {
  margin-top: 8px;
}
</style>
