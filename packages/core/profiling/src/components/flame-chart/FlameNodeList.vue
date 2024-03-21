<template>
  <table class="flame-node-list">
    <thead>
      <th>Self Time</th>
      <th>Total Time</th>
      <th>Activity</th>
    </thead>
    <tbody>
      <FlameNodeListRow
        v-for="node in props.nodes"
        :key="node.name"
        :node="node"
      />
    </tbody>
  </table>
</template>

<script setup lang="ts">
import type { ExtendedFlameNode } from '../../types'
import FlameNodeListRow from './FlameNodeListRow.vue'

const props = defineProps<{
  nodes: ExtendedFlameNode[]
}>()
</script>

<style lang="scss">
.flame-node-list {
  $border: rgba(0, 0, 0, .2);

  min-width: 100%;

  thead {
    background: white;
    position: sticky;
    top: 0;
    z-index: 1;

    &:after {
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      bottom: 0;
      content: '';
      left: 0;
      position: absolute;
      width: 100%;
    }

    th {
      &:nth-child(1),
      &:nth-child(2) {
        text-align: right;
      }
    }
  }

  th,
  td {
    &:not(:last-child) {
      border-right: 1px solid $border;
    }
  }

  tr {
    border-bottom: 1px solid $border;

    td {

      &:nth-child(1),
      &:nth-child(2) {
        position: relative;
        text-align: right;
        white-space: nowrap;
        width: 120px;

        &:after {
          background: rgba(red, 0.1);
          content: '';
          height: 100%;
          position: absolute;
          right: 0;
          top: 0;
          width: var(--kong-ui-background-width);
        }
      }
    }
  }
}
</style>
