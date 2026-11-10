<template>
  <div
    class="dpg-stack"
    data-testid="dpg-display"
  >
    <template v-if="!entries.length">
      –
    </template>
    <div
      v-for="(entry, index) in entries"
      :key="index"
      class="dpg-sub-row"
      :data-testid="`dpg-sub-row-${index}`"
    >
      <div
        class="dpg-sub-label"
        :data-testid="`dpg-item-heading-${index}`"
      >
        {{ entryHeading(entry, index) }}
      </div>
      <div
        class="dpg-sub-value"
        :data-testid="`dpg-entry-blob-${index}`"
      >
        <KCodeBlock
          :id="`dpg-${id}-${index}`"
          :code="entryJson(entry)"
          language="json"
          max-height="480px"
          :show-line-numbers="false"
          @code-block-render="highlightCodeBlock"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { KCodeBlock } from '@kong/kongponents'
import { highlightCodeBlock } from '@kong-ui-public/entities-shared'
import type { AddOnRecord, AddOnValue } from '../types/cloud-gateways-add-on'
import composables from '../composables'

const props = defineProps<{ value?: AddOnValue }>()
const id = useId()
const { i18n: { t } } = composables.useI18n()

const isGroup = (value: AddOnValue | undefined): value is AddOnRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const entries = computed(() => {
  const value = props.value
  if (Array.isArray(value)) return value.filter(isGroup)
  return isGroup(value) ? [value] : []
})

const entryHeading = (entry: AddOnRecord, index: number): string => {
  const name = entry.name
  if (typeof name === 'string' && name.trim() !== '') return name
  return t('config_card.managed_dpg.entry_heading', { n: index + 1 })
}

const entryJson = (entry: AddOnRecord): string => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `name` is the UI heading
  const { name, ...payload } = entry
  return JSON.stringify(payload, null, 2)
}
</script>

<style lang="scss" scoped>
// Fills the config card value column
.dpg-stack {
  width: 100%;
}

// Mirror `ConfigCardItem`’s default label/value split
.dpg-sub-row {
  align-items: flex-start;
  border-bottom: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
  box-sizing: border-box;
  display: flex;
  padding: var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0);
  width: 100%;
}

.dpg-sub-label {
  box-sizing: border-box;
  color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  padding-right: var(--kui-space-60, $kui-space-60);
  width: 25%;
}

.dpg-sub-value {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  width: 75%;
}
</style>
