<template>
  <div class="kong-ui-consumer-group-entity-config-card">
    <EntityConfigCardView
      :config="config"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.ConsumerGroup"
      :hide-title="hideTitle"
      :record="record"
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
  record: { type: Object as PropType<Record<string, any>>, required: true },
  config: {
    type: Object as PropType<EntityConfigCardViewConfig>,
    default: () => ({}),
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
