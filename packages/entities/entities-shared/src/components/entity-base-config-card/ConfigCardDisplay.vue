<template>
  <div
    v-if="format === 'structured'"
    class="config-card-display-form"
  >
    <div
      v-for="pType in propListTypes"
      :key="`config-card-details-${pType}-props`"
      :class="`config-card-details-${pType}-props`"
      :data-testid="`config-card-details-${pType}-props`"
    >
      <div
        v-if="pType !== 'basic'"
        class="config-card-prop-section-title"
      >
        {{ pType === 'advanced' ? t('baseConfigCard.sections.advanced') : t('baseConfigCard.sections.plugin') }}
      </div>

      <ConfigCardItem
        v-for="propertyItem in propertyCollections[pType as keyof typeof propertyCollections]"
        :key="propertyItem.key"
        :item="propertyItem"
      >
        <template #label>
          <slot
            :name="`${propertyItem.key}-label`"
            :row="propertyItem"
          />
        </template>
        <template
          v-if="hasTooltip(propertyItem)"
          #label-tooltip
        >
          <slot
            :name="`${propertyItem.key}-label-tooltip`"
            :row="propertyItem"
          />
        </template>
        <template #[propertyItem.key]="{ rowValue }">
          <slot
            :name="propertyItem.key"
            :row="propertyItem"
            :row-value="rowValue"
          />
        </template>
      </ConfigCardItem>
    </div>
  </div>

  <JsonCodeBlock
    v-if="format === 'json' && props.record"
    :config="props.config"
    :fetcher-url="props.fetcherUrl"
    :json-record="jsonOrYamlRecord"
    request-method="get"
  />
  <YamlCodeBlock
    v-if="format === 'yaml' && props.record"
    :yaml-record="jsonOrYamlRecord"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, useSlots } from 'vue'
import type { RecordItem, KonnectBaseEntityConfig, KongManagerBaseEntityConfig } from '../../types'
import '@kong-ui-public/copy-uuid/dist/style.css'
import ConfigCardItem from './ConfigCardItem.vue'
import JsonCodeBlock from '../common/JsonCodeBlock.vue'
import YamlCodeBlock from '../common/YamlCodeBlock.vue'
import composables from '../../composables'

export interface PropList {
  basic?: RecordItem[]
  advanced?: RecordItem[]
  plugin?: RecordItem[]
}

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectBaseEntityConfig | KongManagerBaseEntityConfig>,
    required: false,
    default: () => ({}),
  },
  propertyCollections: {
    type: Object as PropType<PropList>,
    required: false,
    default: () => null,
  },
  format: {
    type: String,
    required: false,
    default: 'structured',
    validator: (val: string) => ['structured', 'yaml', 'json'].includes(val),
  },
  propListTypes: {
    type: Array as PropType<String[]>,
    required: false,
    default: () => ([]),
  },
  /** A record to indicate the entity's configuration, used to populate the JSON/YAML code blocks */
  record: {
    type: Object as PropType<Record<string, any>>,
    required: false,
    default: () => ({}),
  },
  /** Fetcher url for the entity with the filled-in controlPlaneId, workspace, and entity id. */
  fetcherUrl: {
    type: String,
    required: false,
    default: '',
  },
})

const slots = useSlots()
const { i18n: { t } } = composables.useI18n()

const hasTooltip = (item: RecordItem): boolean => !!(item.tooltip || slots[`${item.key}-label-tooltip`])
const jsonOrYamlRecord = computed((): PropType<Record<string, any>> => {
  if (!props.record) {
    return props.record
  }
  const processedRecord = JSON.parse(JSON.stringify(props.record))
  // remove dates from JSON/YAML config [KHCP-9837]
  delete processedRecord.created_at
  delete processedRecord.updated_at
  return processedRecord
})
</script>

<style lang="scss" scoped>
.config-card-prop-section-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
  margin-bottom: $kui-space-60;
  margin-top: $kui-space-110;
}
</style>
