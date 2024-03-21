<template>
  <tr class="flame-node-list-row">
    <td
      :style="{ '--kong-ui-background-width': `${(0 * 100).toFixed(2)}%` }"
    >
      0ms ({{ (0 * 100).toFixed(2) }}%)
    </td>
    <td
      :style="{ '--kong-ui-background-width': `${(0 * 100).toFixed(2)}%` }"
    >
      0ms ({{ (0 * 100).toFixed(2) }}%)
    </td>
    <td>
      <div
        class="flame-node"
      >
        <div
          class="label-wrapper"
          :style="identStyle"
        >
          <span
            class="expand-control"
            @click="hasChildren && (expanded = !expanded)"
          >
            <template v-if="hasChildren">
              <ChevronDownIcon
                v-if="expanded"
                display="inline-block"
                :size="16"
              />
              <ChevronRightIcon
                v-else
                display="inline-block"
                :size="16"
              />
            </template>
          </span>
          <span>{{ props.node.name }}</span>
        </div>
      </div>
    </td>
  </tr>

  <template v-if="expanded">
    <FlameNodeListRow
      v-for="child in children"
      :key="child.name"
      :depth="(props.depth ?? 0) + 1"
      :node="child"
    />
  </template>
</template>

<script setup lang="ts">
import { ChevronDownIcon, ChevronRightIcon } from '@kong/icons'
import { computed, ref } from 'vue'
import type { ExtendedFlameNode } from '../../types'

const props = defineProps<{
  node: ExtendedFlameNode
  depth?: number
  mode?: 'bottom-up' | 'top-down'
}>()

const expanded = ref(false)

const children = computed(() => {
  if (props.mode === 'top-down') {
    return props.node.children
  }

  if (props.node.internals.parent === undefined) {
    return []
  }

  return [props.node.internals.parent]
})

const hasChildren = computed(() => children.value.length > 0)

const identStyle = computed(() => ({ marginLeft: `${(props.depth ?? 0) * 16}px` }))
</script>

<style lang="scss">
.flame-node-list-row {
  font-family: monospace;

  .label-wrapper {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: 4px;
  }

  .expand-control {
    $size: 16px;
    align-items: center;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    height: $size;
    width: $size;
  }
}
</style>
