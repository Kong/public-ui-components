<template>
  <div>
    <KLabel
      class="required"
      :info="t('form.fields.sentinel_nodes.tooltip')"
      :tooltip-attributes="{ maxWidth: '400' }"
    >
      {{ t('form.fields.sentinel_nodes.title') }}
    </KLabel>
    <div>
      <FieldArrayCardContainer
        v-for="(node, index) of nodes"
        :key="node.id"
        data-testid="redis-sentinel-nodes"
        :disabled="readonly"
        @remove-item="removeItem(index)"
      >
        <div class="sentinel-node-items">
          <KInput
            v-model.trim="node.host"
            :label="t('form.fields.sentinel_node_host.label')"
            :label-attributes="{
              info: t('form.fields.sentinel_node_host.tooltip'),
              tooltipAttributes: { maxWidth: '400' },
            }"
            name="host"
            :readonly="readonly"
            required
          />
          <KInput
            v-model="node.port"
            :label="t('form.fields.sentinel_node_port.label')"
            :label-attributes="{
              info: t('form.fields.sentinel_node_port.tooltip'),
              tooltipAttributes: { maxWidth: '400' },
            }"
            name="port"
            :readonly="readonly"
            type="number"
          />
        </div>
      </FieldArrayCardContainer>
      <KButton
        appearance="tertiary"
        data-testid="redis-add-sentinel-node-button"
        :disabled="readonly"
        @click="addItem"
      >
        <AddCircleIcon />
        <span>{{ t('form.fields.sentinel_nodes.add_button') }}</span>
      </KButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { AddCircleIcon } from '@kong/icons'

import FieldArrayCardContainer from './FieldArrayCardContainer.vue'
import composables from '../composables'
import type { Identifiable, SentinelNode } from '../types'
import { genDefaultSentinelNode } from '../helpers'

defineProps<{
  readonly?: boolean
}>()

const nodes = defineModel<Array<Identifiable<SentinelNode>>>({ required: true })

const { i18n: { t } } = composables.useI18n()

const addItem = () => {
  nodes.value.push(genDefaultSentinelNode())
}

const removeItem = (index: number) => {
  nodes.value.splice(index, 1)
}
</script>

<style lang="scss" scoped>
.sentinel-node-items {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
}
</style>
