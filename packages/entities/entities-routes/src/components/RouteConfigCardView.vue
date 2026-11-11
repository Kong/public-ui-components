<template>
  <div>
    <EntityConfigCardView
      :config="config"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Route"
      :hide-title="hideTitle"
      :record="record"
    >
      <template #service="{ row }">
        <!-- Loading -->
        <KSkeleton
          v-if="service?.loading && service.id === internalServiceId"
          data-testid="service-name-loader"
          type="spinner"
        />
        <InternalLinkItem
          v-else-if="row.value && row.value.id === internalServiceId && serviceName"
          :item="{
            key: row.value.id,
            value: serviceName,
            type: ConfigurationSchemaType.LinkInternal,
          }"
          @navigation-click="() => $emit('navigation-click', row.value.id, 'services')"
        />
        <div
          v-else
        >
          {{ '-' }}
        </div>
      </template>
      <template
        v-if="$slots.title"
        #title
      >
        <slot name="title" />
      </template>
      <template
        v-if="$slots.actions"
        #actions
      >
        <slot name="actions" />
      </template>
    </EntityConfigCardView>
  </div>
</template>

<script setup lang="ts">
import { createConfigCardSchema } from './config-card-schema'
import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { computed } from 'vue'
import { ConfigurationSchemaType, EntityConfigCardView, InternalLinkItem, SupportedEntityType } from '@kong-ui-public/entities-shared'
import composables from '../composables'

import '@kong-ui-public/entities-shared/dist/style.css'

defineEmits<{
  (e: 'navigation-click', id: string, entityType: string): void
}>()

const props = defineProps({
  /** Resolved association display state; defaults to the ID in record.service. */
  service: { type: Object as PropType<{ id: string, name?: string, loading?: boolean }>, default: undefined },
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
const internalServiceId = computed(() => props.service?.id || props.record.service?.id || '')
const serviceName = computed(() => props.service?.name || internalServiceId.value)

const configSchema = createConfigCardSchema(t)
</script>
