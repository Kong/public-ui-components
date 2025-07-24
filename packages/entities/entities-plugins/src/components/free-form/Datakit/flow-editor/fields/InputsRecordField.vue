<template>
  <ObjectField
    as-child
    name="inputs"
    reset-label-path="isolate"
  >
    <EnumField
      v-for="name in childFieldNames"
      :key="name"
      class="dk-inputs-indent"
      :items="[]"
      :name="name"
      placeholder="Select output(s)"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormShared } from '../../../shared/composables'
import ObjectField from '../../../shared/ObjectField.vue'
import type { RecordFieldSchema } from '../../../../../types/plugins/form-schema'
import EnumField from '../../../shared/EnumField.vue'

const { getSchema } = useFormShared()

const childFieldNames = computed(() => {
  const schema = getSchema<RecordFieldSchema>('inputs')
  if (!schema) {
    return []
  }

  return schema.fields.map(fieldObj => Object.keys(fieldObj)[0])
})
</script>

<style lang="scss" scoped>
.dk-inputs-indent {
  padding-left: $kui-space-70;
  position: relative;

  &::before {
    border-left-color: $kui-color-border;
    border-left-style: solid;
    border-left-width: $kui-border-width-10;
    content: '';
    display: block;
    height: 92px;
    left: 8px;
    position: absolute;
    top: -16px;
    width: 0;
  }

  &::after {
    border-top-color: $kui-color-border;
    border-top-style: solid;
    border-top-width: $kui-border-width-10;
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
