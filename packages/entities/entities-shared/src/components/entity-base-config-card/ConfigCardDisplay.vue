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
    <KCodeBlock
      id="config-card-codeblock"
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
})

const slots = useSlots()
const { i18n: { t } } = composables.useI18n()

const hasTooltip = (item: RecordItem): boolean => !!(item.tooltip || slots[`${item.key}-label-tooltip`])

const jsonContent = ref('')
const yamlContent = ref('')

watch(() => props.format, (format: string) => {
  if (format === 'json') {
    jsonContent.value = JSON.stringify(props.record, null, 2)
  } else if (format === 'yaml') {
    yamlContent.value = yaml.dump(props.record)
  }

}, { immediate: true })

</script>

<style lang="scss">
.config-card-display-json,
.config-card-display-yaml {
  #config-card-codeblock {
    .k-highlighted-code-block {
      code {
        background-color: $kui-color-background-neutral-strongest;
      }
    }
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
