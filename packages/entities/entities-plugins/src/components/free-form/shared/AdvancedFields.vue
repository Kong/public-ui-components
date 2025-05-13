<template>
  <KCollapse
    v-model="advancedCollapsed"
    :trigger-label="advancedCollapsed ? t('plugins.form.grouping.advanced_parameters.view') : t('plugins.form.grouping.advanced_parameters.hide')"
  >
    <div class="ff-advanced-fields">
      <Field
        v-if="getSchema('instance_name')"
        name="instance_name"
      />
      <Field
        v-if="getSchema('protocols')"
        name="protocols"
      />
      <Field
        v-if="getSchema('tags')"
        name="tags"
      />
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

const { t } = createI18n<typeof english>('en-us', english)

const { getSchema } = useFormShared()

const advancedCollapsed = ref(true)
</script>

<style lang="scss" scoped>
.ff-advanced-fields {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
}
</style>
