<template>
  <div class="kong-ui-consumer-group-entity-config-card">
    <EntityConfigCardView
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.ConsumerGroup"
      :hide-title="hideTitle"
      :record="record"
      :request-url="requestUrl"
    >
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
import type { ConsumerGroupConfigurationSchema } from '../types'
import { EntityConfigCardView, SupportedEntityType } from '@kong-ui-public/entities-shared'
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

const { i18n: { t } } = composables.useI18n()

const configSchema = ref<ConsumerGroupConfigurationSchema>({
  id: {},
  name: {},
  created_at: {},
  updated_at: {},
  tags: {
    tooltip: t('consumer_groups.form.fields.tags.tooltip'),
  },
})
</script>
