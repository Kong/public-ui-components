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
        {{ pType === 'advanced' ? t('baseConfigCard.sections.advanced') : pType === 'plugin' ? t('baseConfigCard.sections.plugin') : t('baseConfigCard.sections.policy') }}
      </div>

      <slot
        v-for="propertyItem in propertyCollections[pType as keyof typeof propertyCollections]"
        :name="`config-card-item-${propertyItem.key}`"
        :row="propertyItem"
      >
        <ConfigCardItem
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
      </slot>
    </div>
  </div>

  <JsonCodeBlock
    v-if="format === 'json' && entityRecord"
    :config="props.config"
    :entity-record="entityRecord"
    :fetcher-url="fetchUrlJsonBlock"
    request-method="get"
  />
  <YamlCodeBlock
    v-if="format === 'yaml' && entityRecord"
    :entity-record="entityRecord"
  />
  <TerraformCodeBlock
    v-if="format === 'terraform' && entityRecord"
    :entity-record="entityRecord"
    :entity-type="props.entityType"
    :sub-entity-type="props.subEntityType"
  />
  <DeckCodeBlock
    v-if="format === 'deck' && entityRecord"
    :app="config.app"
    :control-plane-name="config.app === 'konnect' ? config.controlPlaneName : undefined"
    :entity-record="entityRecord"
    :entity-type="props.entityType as SupportedEntityDeck"
    :geo-api-server-url="config.app === 'konnect' ? config.geoApiServerUrl : undefined"
    :kong-admin-api-url="config.app === 'kongManager' ? config.apiBaseUrl : undefined"
    :workspace="config.app === 'kongManager' ? config.workspace : undefined"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, useSlots } from 'vue'
import type { RecordItem, KonnectBaseEntityConfig, KongManagerBaseEntityConfig, SupportedEntityType, SupportedEntityDeck } from '../../types'
import { SupportedEntityTypesArray } from '../../types'
import ConfigCardItem from './ConfigCardItem.vue'
import JsonCodeBlock from '../common/JsonCodeBlock.vue'
import YamlCodeBlock from '../common/YamlCodeBlock.vue'
import TerraformCodeBlock from '../common/TerraformCodeBlock.vue'
import DeckCodeBlock from '../common/DeckCodeBlock.vue'
import composables from '../../composables'

export interface PropList {
  basic?: RecordItem[]
  advanced?: RecordItem[]
  plugin?: RecordItem[]
}

export type CodeFormat = 'yaml' | 'json' | 'terraform' | 'deck'
export type Format = 'structured' | CodeFormat

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectBaseEntityConfig | KongManagerBaseEntityConfig>,
    required: false,
    default: () => ({}),
  },
  entityType: {
    type: String as PropType<SupportedEntityType>,
    required: true,
    validator: (val: SupportedEntityType) => SupportedEntityTypesArray.includes(val),
  },
  subEntityType: {
    // only for event gateway entities
    type: String,
    default: '',
  },
  propertyCollections: {
    type: Object as PropType<PropList>,
    required: false,
    default: () => null,
  },
  format: {
    type: String as PropType<Format>,
    required: false,
    default: 'structured',
    validator: (val: string) => ['structured', 'yaml', 'json', 'terraform', 'deck'].includes(val),
  },
  propListTypes: {
    type: Array as PropType<string[]>,
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
  /**
   * A function to format the entity record before displaying it in the code block.
   */
  codeBlockRecordFormatter: {
    type: Function as PropType<(entityRecord: Record<string, any>, format: CodeFormat) => Record<string, any>>,
    required: false,
    default: (entityRecord: Record<string, any>) => entityRecord,
  },
})

const slots = useSlots()
const { i18n: { t } } = composables.useI18n()

const hasTooltip = (item: RecordItem): boolean => !!(item.tooltip || slots[`${item.key}-label-tooltip`])
const entityRecord = computed((): PropType<Record<string, any>> => {
  if (!props.record) {
    return props.record
  }
  let record = props.record
  if (props.codeBlockRecordFormatter) {
    record = props.codeBlockRecordFormatter(record, props.format as CodeFormat)
  }
  const processedRecord = JSON.parse(JSON.stringify(record))
  // remove dates from JSON/YAML config [KHCP-9837]
  delete processedRecord.created_at
  delete processedRecord.updated_at
  return processedRecord
})

const fetchUrlJsonBlock = computed(() => {
  return props.fetcherUrl
    .replace(/(\?|&)__ui_data=true/, '')
})
</script>

<style lang="scss" scoped>
.config-card-prop-section-title {
  color: var(--kui-color-text, $kui-color-text);
  font-size: var(--kui-font-size-40, $kui-font-size-40);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  margin-bottom: var(--kui-space-60, $kui-space-60);
  margin-top: var(--kui-space-110, $kui-space-110);
}
</style>
