<template>
  <div>
    <KLabel
      class="required"
      :info="t('form.fields.cluster_nodes.tooltip')"
      :tooltip-attributes="{ maxWidth: '400' }"
    >
      {{ t('form.fields.cluster_nodes.title') }}
    </KLabel>
    <div>
      <FieldArrayCardContainer
        v-for="(node, index) of nodes"
        :key="`${index}`"
        data-testid="redis-cluster-nodes"
        :disabled="readonly"
        @remove-item="removeItem(index)"
      >
        <div class="cluster-node-items">
          <KInput
            v-model.trim="node.ip"
            :label="t('form.fields.cluster_node_ip.label')"
            :label-attributes="{
              info: t('form.fields.cluster_node_ip.tooltip'),
              tooltipAttributes: { maxWidth: '400' },
            }"
            name="ip"
            :readonly="readonly"
            required
          />
          <KInput
            v-model="node.port"
            :label="t('form.fields.cluster_node_port.label')"
            :label-attributes="{
              info: t('form.fields.cluster_node_port.tooltip'),
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
        data-testid="redis-add-cluster-node-button"
        :disabled="readonly"
        @click="addItem"
      >
        <AddCircleIcon />
        <span>{{ t('form.fields.cluster_nodes.add_button') }}</span>
      </KButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { AddCircleIcon } from '@kong/icons'

import FieldArrayCardContainer from './FieldArrayCardContainer.vue'
import composables from '../composables'
import type { ClusterNode, Identifiable } from '../types'
import { genDefaultClusterNode } from '../helpers'

defineProps<{
  readonly?: boolean
}>()

const nodes = defineModel<Array<Identifiable<ClusterNode>>>({ required: true })

const { i18n: { t } } = composables.useI18n()

const addItem = () => {
  nodes.value.push(genDefaultClusterNode())
}

const removeItem = (index: number) => {
  nodes.value.splice(index, 1)
}
</script>

<style lang="scss" scoped>
.cluster-node-items {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
}
</style>
