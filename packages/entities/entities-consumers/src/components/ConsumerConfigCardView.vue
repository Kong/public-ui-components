<template>
  <div class="kong-ui-consumer-entity-config-card">
    <EntityConfigCardView
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Consumer"
      :hide-title="hideTitle"
      :record="record"
      :request-url="requestUrl"
    >
      <template #username-label-tooltip>
        <i18nT
          keypath="consumers.fields.username.tooltip"
          scope="global"
        >
          <template #custom_id>
            <code>{{ t('consumers.fields.username.custom_id') }}</code>
          </template>
        </i18nT>
      </template>

      <template #custom_id-label-tooltip>
        <i18nT
          keypath="consumers.fields.custom_id.tooltip"
          scope="global"
        >
          <template #username>
            <code>{{ t('consumers.fields.custom_id.username') }}</code>
          </template>
        </i18nT>
      </template>
      <template
        v-for="slotKey in Object.keys($slots)"
        :key="slotKey"
        #[slotKey]="slotProps"
      >
        <slot
          :name="slotKey"
          v-bind="slotProps"
        />
      </template>
    </EntityConfigCardView>
  </div>
</template>

<script setup lang="ts">
import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { ref } from 'vue'
import type { ConsumerConfigurationSchema } from '../types'
import { EntityConfigCardView, ConfigurationSchemaSection, SupportedEntityType } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'


defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  record: { type: Object as PropType<Record<string, any>>, required: true },
  requestUrl: { type: String, default: '' },
  config: {
    type: Object as PropType<EntityConfigCardViewConfig>,
    default: () => ({}),
  },
  /**
   * External link for documentation that determines visibility of Documentation button
   */
  configCardDoc: {
    type: String,
    default: '',
    required: false,
  },
  /**
   * Control visibility of card title content
   */
  hideTitle: {
    type: Boolean,
    default: false,
  },
})

const { i18n: { t }, i18nT } = composables.useI18n()

const configSchema = ref<ConsumerConfigurationSchema>({
  id: {},
  username: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('consumers.fields.username.tooltip'),
    order: 1,
  },
  custom_id: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('consumers.fields.custom_id.tooltip'),
    label: t('consumers.fields.custom_id.label'),
    order: 2,
  },
  updated_at: {},
  created_at: {},
  tags: {
    tooltip: t('consumers.fields.tags.tooltip'),
  },
  username_lower: {
    hidden: true,
  },
  type: {
    hidden: true,
  },
})
</script>
