<template>
  <ObjectField
    as-child
    :name="name"
    reset-label-path="isolate"
  >
    <EnumField
      v-for="name in childFieldNames"
      :key="name"
      class="dk-inputs-field-indent"
      clearable
      :items="items"
      :name="name"
      :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
      @change="(value: InputOption | null) => $emit('change:inputs', name, value ? value.value : null)"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormShared } from '../../../shared/composables'
import ObjectField from '../../../shared/ObjectField.vue'
import type { RecordFieldSchema } from '../../../../../types/plugins/form-schema'
import EnumField from '../../../shared/EnumField.vue'
import useI18n from '../../../../../composables/useI18n'
import type { InputOption } from './composables'
import type { FieldName, IdConnection } from '../../types'

defineProps<{
  name: string
  items: InputOption[]
}>()

defineEmits<{
  (
    event: 'change:inputs',
    fieldName: FieldName,
    fieldValue: IdConnection | null,
  ): void
}>()

const { getSchema } = useFormShared()
const { i18n } = useI18n()

const childFieldNames = computed(() => {
  const schema = getSchema<RecordFieldSchema>('inputs')
  if (!schema) {
    return []
  }

  return schema.fields.map(fieldObj => Object.keys(fieldObj)[0]) as FieldName[]
})
</script>

<style lang="scss" scoped>
@use '../styles/tree-indent' as mixins;

.dk-inputs-field-indent {
  @include mixins.tree-indent(
    $line-height: 84px,
  );
}
</style>
