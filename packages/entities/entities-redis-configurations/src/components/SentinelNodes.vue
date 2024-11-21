<template>
  <div>
    <KLabel
      :info="t('form.fields.sentinel_nodes.tooltip')"
      :tooltip-attributes="{ maxWidth: '400' }"
    >
      {{ t('form.fields.sentinel_nodes.title') }}
    </KLabel>
    <div>
      <FieldArrayCardContainer
        v-for="(item, index) of items"
        :key="`${index}`"
        @remove-item="items.splice(index, 1)"
      >
        <div
          class="cluster-node-items"
        >
          <KInput
            :label="t('form.fields.sentinel_node_host.label')"
            :label-attributes="{
              info: t('form.fields.sentinel_node_host.tooltip'),
              tooltipAttributes: { maxWidth: '400' },
            }"
            required
          />
          <KInput
            :label="t('form.fields.sentinel_node_port.label')"
            :label-attributes="{
              info: t('form.fields.sentinel_node_port.tooltip'),
              tooltipAttributes: { maxWidth: '400' },
            }"
            type="number"
          />
        </div>
      </FieldArrayCardContainer>
      <KButton
        appearance="tertiary"
        @click="addItem"
      >
        <AddCircleIcon />
        <span>{{ t('form.fields.sentinel_nodes.add_button') }}</span>
      </KButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { AddCircleIcon } from '@kong/icons'

import FieldArrayCardContainer from './FieldArrayCardContainer.vue'
import composables from '../composables'

const { i18n: { t } } = composables.useI18n()
type Item = {
  ip: string
  port: number
}
const items = ref<Item[]>([{ ip: '', port: 0 }])
const addItem = () => {
  items.value.push({ ip: '', port: 0 })
}
</script>

<style lang="scss" scoped>
.cluster-node-items {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
}
</style>
