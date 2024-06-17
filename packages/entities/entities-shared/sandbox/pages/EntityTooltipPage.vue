<template>
  <div class="sandbox-container">
    <main>
      <h3>Entity Tooltip</h3>
      <EntityTooltip
        :entity-config="tooltipConfig"
        :external-link="'https://www.google.com'"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ConfigurationSchemaType, EntityTooltip } from '../../src'
import type { EntityTooltipConfig } from '../../src/types'
import { computed } from 'vue'


const tooltipData = () => (Promise.resolve({
  label: 'Test',
  items: [
    {
      key: 'item-1',
      label: 'Name',
      value: 'My name',
    },
    {
      key: 'item-2',
      label: 'Badges',
      value: ['badge1', 'badge2'],
      type: ConfigurationSchemaType.BadgeTag,
    },
    {
      key: 'item-3',
      label: 'Some ID',
      value: 'my-unique-id',
      type: ConfigurationSchemaType.ID,
    },
    {
      key: 'item-4',
      label: 'ID Array',
      value: ['item1', 'item2'],
      type: ConfigurationSchemaType.IdArray,
    },
    {
      key: 'item-5',
      label: 'Redacted ID',
      value: 'my-unique-id',
      type: ConfigurationSchemaType.Redacted,
    },
    {
      key: 'item-6',
      label: 'Redacted Array',
      value: ['item1', 'item2'],
      type: ConfigurationSchemaType.RedactedArray,
    },
    {
      key: 'item-7',
      label: 'Date',
      value: 1686245746,
      type: ConfigurationSchemaType.Date,
    },
  ],
}))

const tooltipConfig = computed < EntityTooltipConfig>(() => ({
  id: 'entity-id',
  title: 'Title',
  deleted: false,
  data: tooltipData,
}))

</script>
