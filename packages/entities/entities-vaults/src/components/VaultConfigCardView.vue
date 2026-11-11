<template>
  <div>
    <EntityConfigCardView
      :code-block-record-formatter="codeBlockRecordFormatter"
      :config="config"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Vault"
      :formats-to-hide="isAiGateway ? ['terraform', 'deck'] : []"
      :hide-title="hideTitle"
      :record="displayRecord"
    >
      <template #config="{ rowValue }">
        <ConfigCardItem
          v-for="item in configItems(rowValue)"
          :key="item.key"
          :item="item"
        />
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
import { EntityConfigCardView, ConfigCardItem, SupportedEntityType } from '@kong-ui-public/entities-shared'
import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { computed } from 'vue'
import { fromAiGatewayVault } from '../ai-gateway-mappers'
import '@kong-ui-public/entities-shared/dist/style.css'
import useVaultConfigCardPresentation from '../composables/useVaultConfigCardPresentation'

const props = defineProps({
  record: { type: Object as PropType<Record<string, any>>, required: true },
  config: {
    type: Object as PropType<EntityConfigCardViewConfig>,
    default: () => ({}),
  },
  /** API that returned the record. AI Gateway records are reshaped to gateway field names for display. */
  apiType: {
    type: String as PropType<'gateway' | 'aiGateway'>,
    default: 'gateway',
  },
  /**
   * Control visibility of card title content
   */
  hideTitle: {
    type: Boolean,
    default: false,
  },
})

const isAiGateway = computed((): boolean => props.apiType === 'aiGateway')

const { configSchema, codeBlockRecordFormatter, configItems } = useVaultConfigCardPresentation(isAiGateway)
// AI Gateway returns a different vault shape; reshape it to the gateway-named record the
// schema and config slot expect.
const displayRecord = computed(() => isAiGateway.value ? fromAiGatewayVault(props.record) : props.record)
</script>
