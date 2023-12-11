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

  <div
    v-if="format === 'json'"
    class="config-card-display-json"
  >
    <div
      v-if="props.fetcherUrl"
      class="config-card-display-json-endpoint"
    >
      <KBadge appearance="get">
        {{ t('baseConfigCard.endpoints.get') }}
      </KBadge>
      <KCodeBlock
        id="config-card-endpoint-codeblock"
        :code="props.fetcherUrl"
        is-single-line
        language="json"
        theme="dark"
      />
    </div>
    <KCodeBlock
      id="config-card-codeblock"
      :class="{ 'config-card-display-json-content': props.fetcherUrl }"
      :code="jsonContent"
      language="json"
      theme="dark"
    />
  </div>

  <div
    v-if="format === 'yaml'"
    class="config-card-display-yaml"
  >
    <KCodeBlock
      id="config-card-codeblock"
      :code="yamlContent"
      language="yaml"
      theme="dark"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { useSlots, watch, ref } from 'vue'
import type { RecordItem } from '../../types'
import '@kong-ui-public/copy-uuid/dist/style.css'
import ConfigCardItem from './ConfigCardItem.vue'
import composables from '../../composables'
import yaml from 'js-yaml'

export interface PropList {
  basic?: RecordItem[]
  advanced?: RecordItem[]
  plugin?: RecordItem[]
}

const props = defineProps({
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
  record: {
    type: Object as PropType<Record<string, any>>,
    required: false,
    default: () => null,
  },
  fetcherUrl: {
    type: String,
    required: true,
  },
})

const slots = useSlots()
const { i18n: { t } } = composables.useI18n()

const hasTooltip = (item: RecordItem): boolean => !!(item.tooltip || slots[`${item.key}-label-tooltip`])

const jsonContent = ref('')
const yamlContent = ref('')

watch(() => props.format, (format: string) => {
  if (format !== 'structured') {
    // remove dates from JSON/YAML config [KHCP-9837]
    const jsonOrYamlRecord = JSON.parse(JSON.stringify(props.record))
    delete jsonOrYamlRecord.created_at
    delete jsonOrYamlRecord.updated_at
    if (format === 'json') {
      jsonContent.value = JSON.stringify(jsonOrYamlRecord, null, 2)
    } else if (format === 'yaml') {
      yamlContent.value = yaml.dump(jsonOrYamlRecord)
    }
  }

}, { immediate: true })

</script>

<style lang="scss">
.config-card-display-json,
.config-card-display-yaml {
  #config-card-endpoint-codeblock,
  #config-card-codeblock {
    .k-highlighted-code-block {
      code {
        background-color: $kui-color-background-neutral-strongest;
      }
    }
  }
}

.config-card-display-json-content {
  .k-highlighted-code-block {
    border-top-left-radius: $kui-border-radius-0 !important;
    border-top-right-radius: $kui-border-radius-0 !important;
  }
}

.config-card-display-json-endpoint {
  align-items: baseline;
  background-color: $kui-color-background-neutral-strongest;
  border-bottom: $kui-border-width-10 solid $kui-navigation-color-border-divider;
  border-top-left-radius: $kui-border-radius-40;
  border-top-right-radius: $kui-border-radius-40;
  display: flex;
  padding-left: $kui-space-50;
  .k-badge {
    height: 24px;
  }
  .k-code-block {
    flex: auto;
  }
  code {
    /* truncate prefix to display relevant partial url but support copying entire url */
    direction: rtl;
    max-width: 394px;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>

<style lang="scss" scoped>
.config-card-prop-section-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
  margin-bottom: $kui-space-60;
  margin-top: $kui-space-110;
}
</style>
