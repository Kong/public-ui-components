<template>
  <Field
    v-if="getSchema('instance_name')"
    name="instance_name"
  />
  <Field
    v-if="getSchema('protocols')"
    name="protocols"
  />
  <StringArrayField
    v-if="getSchema('tags')"
    help="e.g. tag1, tag2, tag3"
    name="tags"
    :placeholder="t('plugins.form.fields.tags.placeholder')"
  />
</template>

<script setup lang="ts">
import Field from '../shared/Field.vue'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../locales/en.json'
import { useFormShared } from './composables'
import StringArrayField from './StringArrayField.vue'

defineProps<{
  hideGeneralFields?: boolean
}>()

const { t } = createI18n<typeof english>('en-us', english)

const { getSchema } = useFormShared()
</script>
