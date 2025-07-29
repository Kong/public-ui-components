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
import { useFormShared } from '../../../shared/composables'
import ObjectField from '../../../shared/ObjectField.vue'
import type { RecordFieldSchema } from '../../../../../types/plugins/form-schema'
import EnumField from '../../../shared/EnumField.vue'
import useI18n from '../../../../../composables/useI18n'

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
.dk-inputs-field-indent {
  padding-left: $kui-space-70;
  position: relative;

  &::before {
    border-left: $kui-border-width-10 solid $kui-color-border;
    content: '';
    display: block;
    height: 84px;
    left: 8px;
    position: absolute;
    top: -16px;
    width: 0;
  }

  &::after {
    border-top: $kui-border-width-10 solid $kui-color-border;
    content: '';
    display: block;
    height: 0;
    left: 9px;
    position: absolute;
    top: 9px;
    width: 8px;
  }

  &:last-child::before {
    border-bottom: 1px solid $kui-color-border;
    border-bottom-left-radius: 2px;
    height: 25px;
    width: 8px;
  }

  &:last-child::after {
    display: none;
  }
}
</style>
