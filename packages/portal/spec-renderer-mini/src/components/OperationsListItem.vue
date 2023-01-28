<template>
  <button
    class="item"
    :class="{ 'item--selected': isSelected, [`item--method-${item.method}`]: true }"
    :data-testid="`mini-spec-item-${item.path}`"
    type="button"
    @click="emit('click', item)"
  >
    <h2
      class="summary truncate"
      :title="item.summary"
    >
      {{ item.summary }}
    </h2>
    <div class="details">
      <KBadge
        appearance="custom"
        :aria-label="`Method: ${item.method?.toUpperCase()}`"
        background-color="var(--spec-renderer-operations-list-item-method-background)"
        class="method-badge"
        color="var(--spec-renderer-operations-list-item-method-color)"
        tabindex="-1"
      >
        {{ item.method?.toUpperCase() }}
      </KBadge>
      <span
        :aria-label="`Path: ${item.path}`"
        class="path truncate"
        :title="item.path"
      >
        {{ item.path }}
      </span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import type { Operation } from '../types'
import { KBadge } from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

defineProps({
  item: {
    type: Object as PropType<Operation>,
    required: true,
    // Items must have a method, summary, and path
    validator: (item: Record<string, unknown>): boolean => (
      item.method !== undefined &&
      item.summary !== undefined &&
      item.path !== undefined
    ),
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])
</script>

<style lang="scss" scoped>
.item {
  appearance: none;
  background: transparent;
  text-align: left;
  width: 100%;
  display: block;
  cursor: pointer;
  border: 1px solid var(--spec-renderer-operations-list-item-border-color, var(--grey-200, #f1f1f5));
  padding: var(--spec-renderer-operations-list-item-padding, 12px 16px);
  position: relative;

  &:hover {
    background: var(--spec-renderer-operations-list-item-background-hover, var(--blue-100, #f2f6fe));
  }

  &:last-of-type {
    border-radius: 0 0 4px 4px;
  }
}

.item--selected {
  background: var(--spec-renderer-operations-list-item-background-selected, var(--blue-100, #f2f6fe));

  &::before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: var(--spec-renderer-operations-list-item-selected-bar-width, 4px);
    background: var(--spec-renderer-operations-list-item-selected-bar-background, var(--blue-500, #1155cb));
  }
}

.item--method-get {
  --spec-renderer-operations-list-item-method-color: var(--spec-renderer-method-color-get, var(--blue-500, #1155cb));
  --spec-renderer-operations-list-item-method-background: var(--spec-renderer-method-background-get, var(--blue-100, #f2f6fe));
}

.item--method-post {
  --spec-renderer-operations-list-item-method-color: var(--spec-renderer-method-color-post, var(--green-700, #13755e));
  --spec-renderer-operations-list-item-method-background: var(--spec-renderer-method-background-post, var(--green-100, #e8f8f5));
}

.item--method-put {
  --spec-renderer-operations-list-item-method-color: var(--spec-renderer-method-color-put, var(--yellow-600, #a05604));
  --spec-renderer-operations-list-item-method-background: var(--spec-renderer-method-background-put, var(--yellow-100, #fff3d8));
}

.item--method-patch {
  --spec-renderer-operations-list-item-method-color: var(--spec-renderer-method-color-patch, var(--teal-500, #006e9d));
  --spec-renderer-operations-list-item-method-background: var(--spec-renderer-method-background-patch, var(--teal-100, #cdf1fe));
}

.item--method-delete {
  --spec-renderer-operations-list-item-method-color: var(--spec-renderer-method-color-delete, var(--red-700, #922021));
  --spec-renderer-operations-list-item-method-background: var(--spec-renderer-method-background-delete, var(--red-100, #ffdede));
}

.item--method-options {
  --spec-renderer-operations-list-item-method-color: var(--spec-renderer-method-color-options, var(--steel-700, #273c61));
  --spec-renderer-operations-list-item-method-background: var(--spec-renderer-method-background-options, var(--steel-100, #f0f4fa));
}

.item--method-head {
  --spec-renderer-operations-list-item-method-color: var(--spec-renderer-method-color-head, var(--yellow-600, #a05604));
  --spec-renderer-operations-list-item-method-background: var(--spec-renderer-method-background-head, var(--yellow-100, #fff3d8));
}

.item--method-connect {
  --spec-renderer-operations-list-item-method-color: var(--spec-renderer-method-color-connect, var(--purple-400, #473cfb));
  --spec-renderer-operations-list-item-method-background: var(--spec-renderer-method-background-connect, var(--purple-100, #eaf4fb));
}

.item--method-trace {
  --spec-renderer-operations-list-item-method-color: var(--spec-renderer-method-color-trace, var(--steel-500, #5c7299));
  --spec-renderer-operations-list-item-method-background: var(--spec-renderer-method-background-trace, var(--steel-100, #f0f4fa));
}

.summary {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--black-500);
}

.details {
  margin-top: 4px;
  display: flex;
}

.truncate {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.method-badge {
  margin-right: 8px;
}

.path {
  font-size: 13px;
  color: var(--grey-600);
  font-family: var(--spec-renderer-operations-list-item-path-font-family, var(--spec-renderer-font-monospace, monospace));
  align-self: center;
}
</style>
