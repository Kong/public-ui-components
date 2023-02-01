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
import { PropType, computed } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'
import VueFormGenerator from '../generator/FormGenerator.vue'

const { t, te } = createI18n('en-us', english)

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
    type: Function as PropType<() => {}>,
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

const finalSchema = computed((): Object => {
  const final = props.formSchema

  final.fields.map((f:any) => {
    const stringKey = `post-function.${f.model}`
    f.hint = (te(`${stringKey}.hint`) && t(`${stringKey}.hint`)) || f.hint
    f.help = (te(`${stringKey}.help`) && t(`${stringKey}.help`)) || f.help

    f.newElementButtonLabel = (t(`${stringKey}.newElementButtonLabel`) || f.newElementButtonLabel)

    if (f.model !== 'tags' && (f.valueType === 'array' || f.type === 'array')) {
      f.type = 'array'
      f.valueArrayType = 'array'
      f.itemContainerComponent = 'FieldArrayItem'
      f.fieldClasses = 'w-100'
      f.fieldItemsClasses = 'w-100 mt-2 mb-2'
      f.inputAttributes = { ...f.inputAttributes, type: 'textarea' }
    }
    return f
  })
  return final
})
</script>
