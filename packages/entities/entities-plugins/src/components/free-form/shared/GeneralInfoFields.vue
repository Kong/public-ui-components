<template>
  <div class="ff-general-info-fields">
    <StringField
      v-if="getSchema('instance_name')"
      label="Name"
      name="instance_name"
      placeholder="Enter a unique name"
    />
    <StringArrayField
      v-if="getSchema('tags')"
      help="An optional set of strings for grouping and filtering, separated by commas."
      name="tags"
      placeholder="tag1, tag2, tag3"
    />
    <Field
      v-if="getSchema('protocols')"
      name="protocols"
    />
  </div>
</template>

<script setup lang="ts">
import Field from '../shared/Field.vue'
// import { createI18n } from '@kong-ui-public/i18n'
// import english from '../../../locales/en.json'
import { useFormShared } from './composables'
import StringArrayField from './StringArrayField.vue'
import StringField from './StringField.vue'

defineProps<{
  hideGeneralFields?: boolean
}>()

// const { t } = createI18n<typeof english>('en-us', english)

const { getSchema } = useFormShared()
</script>

<style lang="scss" scoped>
.ff-general-info-fields {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
}
</style>
