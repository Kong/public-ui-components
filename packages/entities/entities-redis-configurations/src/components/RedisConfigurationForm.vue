<template>
  <div class="kong-ui-entities-redis-configurations-form">
    <EntityBaseForm
      :can-submit="false"
      :config="config"
      :edit-id="partialId"
      :entity-type="SupportedEntityType.RedisConfiguration"
      :error-message="undefined"
      :fetch-url="undefined"
      :form-fields="{}"
      :is-readonly="false"
      @cancel="noop"
      @fetch:error="noop"
      @fetch:success="noop"
      @loading="noop"
      @submit="noop"
    >
      <EntityFormSection
        :description="t('form.sections.type.description')"
        :title="t('form.sections.type.title')"
      >
        <KSelect
          :items="[]"
          :label="t('form.fields.type.label')"
          required
        />
      </EntityFormSection>

      <EntityFormSection
        :description="t('form.sections.general.description')"
        :title="t('form.sections.general.title')"
      >
        <KInput
          :label="t('form.fields.name.label')"
          :placeholder="t('form.fields.name.placeholder')"
          required
        />
      </EntityFormSection>
    </EntityBaseForm>
  </div>
</template>

<script setup lang="ts">
import {
  EntityBaseForm,
  EntityFormSection,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import type { KonnectRedisConfigurationFormConfig } from 'src/types'
import type { PropType } from 'vue'
import '@kong-ui-public/entities-shared/dist/style.css'

import composables from '../composables'

const props = defineProps({
  config: {
    type: Object as PropType<KonnectRedisConfigurationFormConfig>,
    required: true,
    validator: (config: unknown) => {
      return true
    },
  },
  partialId: {
    type: String,
    required: false,
    default: '',
  },
})

const { i18nT, i18n: { t } } = composables.useI18n()

const noop = () => {}
</script>

<style lang="scss" scoped>
.kong-ui-entities-redis-configurations-form {
  // Add component styles as needed
}
</style>
