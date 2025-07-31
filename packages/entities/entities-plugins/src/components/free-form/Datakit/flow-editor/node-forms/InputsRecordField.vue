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
      :items="[]"
      :name="name"
      :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormShared } from '@freeform/composables'
import ObjectField from '@freeform/ObjectField.vue'
import type { RecordFieldSchema } from '@/types/plugins/form-schema'
import EnumField from '@freeform/EnumField.vue'
import useI18n from '@/composables/useI18n'

defineProps<{
  name: string
}>()

const { getSchema } = useFormShared()
const { i18n } = useI18n()

const childFieldNames = computed(() => {
  const schema = getSchema<RecordFieldSchema>('inputs')
  if (!schema) {
    return []
  }

  return schema.fields.map(fieldObj => Object.keys(fieldObj)[0])
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
