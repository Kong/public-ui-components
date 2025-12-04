<template>
  <KCollapse
    v-model="advancedCollapsed"
    data-testid="view-advanced"
    trigger-label="Show additional settings"
  >
    <div class="ff-advanced-fields-container">
      <template v-if="!hideGeneralFields">
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
      <slot />
    </div>
  </KCollapse>
</template>

<script setup lang="ts">
import Field from '../shared/Field.vue'
import { ref } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import { KCollapse } from '@kong/kongponents'
import english from '../../../locales/en.json'
import { useFormShared } from './composables'
import StringArrayField from './StringArrayField.vue'

defineProps<{
  hideGeneralFields?: boolean
}>()

const { t } = createI18n<typeof english>('en-us', english)

const { getSchema } = useFormShared()

const advancedCollapsed = ref(true)
</script>

<style lang="scss" scoped>
.ff-advanced-fields-container {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
}
</style>
