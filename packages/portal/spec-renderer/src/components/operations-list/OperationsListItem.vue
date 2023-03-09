<template>
  <button
    class="spec-operations-list-item"
    :class="{
      'item--selected': isSelected,
      [`item--method-${item.method}`]: true,
      'disabled': disableSelection
    }"
    :data-testid="testId"
    type="button"
    @click="$emit('click', item)"
  >
    <h2
      v-if="item.summary"
      class="summary truncate"
      :title="item.summary"
    >
      {{ item.summary }}
    </h2>
    <div class="details">
      <KBadge
        appearance="custom"
        :aria-label="i18n.t('specOperationsList.item.methodAriaLabel', { method: methodName.toUpperCase() })"
        background-color="var(--kong-ui-spec-renderer-operations-list-item-method-background)"
        class="method-badge"
        color="var(--kong-ui-spec-renderer-operations-list-item-method-color)"
        tabindex="-1"
      >
        {{ methodName.toUpperCase() }}
      </KBadge>
      <span
        :aria-label="i18n.t('specOperationsList.item.pathAriaLabel', { path: item.path })"
        class="path truncate"
        :title="item.path"
      >
        {{ item.path }}
      </span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { PropType, computed } from 'vue'
import type { OperationListItem } from '../../types'
import composables from '../../composables'

const props = defineProps({
  item: {
    type: Object as PropType<OperationListItem>,
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
  disableSelection: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])

const { i18n } = composables.useI18n()

const testId = computed((): string => `spec-operations-list-item-${props.item.method?.toLowerCase()}${props.item.path?.replaceAll('/', '-')}-${props.item.tag || '-'}`)

const methodName = computed((): string => {
  return props.item.method || ''
})
</script>

<style lang="scss" scoped>
.spec-operations-list-item {
  appearance: none;
  background: transparent;
  border: 1px solid var(--kong-ui-spec-renderer-operations-list-item-border-color, var(--grey-200, #f1f1f5));
  cursor: pointer;
  display: block;
  padding: var(--kong-ui-spec-renderer-operations-list-item-padding, 8px 16px);
  position: relative;
  text-align: left;
  width: 100%;

  &.disabled {
    cursor: default;
  }

  &:hover {
    background: var(--kong-ui-spec-renderer-operations-list-item-background-hover, var(--blue-100, #f2f6fe));

    .summary, .path {
      color: var(--kong-ui-spec-renderer-operations-list-item-summary-text-color-hover, var(--black-500, #0B172D));
    }
  }

  &:last-of-type {
    border-bottom-left-radius: var(--kong-ui-spec-renderer-operations-list-section-border-radius, 4px);
    border-bottom-right-radius: var(--kong-ui-spec-renderer-operations-list-section-border-radius, 4px);
  }
}

.item--selected {
  background: var(--kong-ui-spec-renderer-operations-list-item-background-selected, var(--blue-100, #f2f6fe));

  &::before {
    background: var(--kong-ui-spec-renderer-operations-list-item-selected-bar-background, var(--blue-500, #1155cb));
    bottom: 0;
    content: '';
    display: block;
    left: 0;
    position: absolute;
    top: 0;
    width: var(--kong-ui-spec-renderer-operations-list-item-selected-bar-width, 4px);
  }

  .summary {
    color: var(--kong-ui-spec-renderer-operations-list-item-summary-text-color-selected, var(--black-500, #0B172D));
  }

  .path {
    color: var(--kong-ui-spec-renderer-operations-list-item-summary-text-color-selected, var(--black-500, #0B172D));
  }
}

.item--method-get {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kong-ui-spec-renderer-method-color-get, var(--petrol-200, #0364ac));
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kong-ui-spec-renderer-method-background-get, var(--petrol-100, #eaf4fb));
}

.item--method-post {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kong-ui-spec-renderer-method-color-post, var(--green-700, #13755e));
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kong-ui-spec-renderer-method-background-post, var(--green-100, #e8f8f5));
}

.item--method-put {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kong-ui-spec-renderer-method-color-put, var(--yellow-600, #a05604));
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kong-ui-spec-renderer-method-background-put, var(--yellow-100, #fff3d8));
}

.item--method-patch {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kong-ui-spec-renderer-method-color-patch, var(--teal-500, #006e9d));
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kong-ui-spec-renderer-method-background-patch, var(--teal-100, #cdf1fe));
}

.item--method-delete {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kong-ui-spec-renderer-method-color-delete, var(--red-700, #922021));
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kong-ui-spec-renderer-method-background-delete, var(--red-100, #ffdede));
}

.item--method-options {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kong-ui-spec-renderer-method-color-options, var(--steel-700, #273c61));
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kong-ui-spec-renderer-method-background-options, var(--steel-200, #dae3f2));
}

.item--method-head {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kong-ui-spec-renderer-method-color-head, var(--yellow-600, #a05604));
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kong-ui-spec-renderer-method-background-head, var(--yellow-200, #ffe6ba));
}

.item--method-connect {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kong-ui-spec-renderer-method-color-connect, var(--purple-400, #473cfb));
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kong-ui-spec-renderer-method-background-connect, var(--purple-100, #eaf4fb));
}

.item--method-trace {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kong-ui-spec-renderer-method-color-trace, var(--white, #fff);
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kong-ui-spec-renderer-method-background-trace, var(--steel-500, #5c7299));
}

.summary {
  color: var(--kong-ui-spec-renderer-operations-list-item-summary-text-color, var(--black-400, #3C4557));
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 4px;
}

.details {
  display: flex;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.method-badge {
  font-size: 11px;
  margin-right: 8px;
}

.path {
  align-self: center;
  color: var(--kong-ui-spec-renderer-operations-list-item-summary-text-color, var(--grey-600, #3c4557));
  font-family: var(--kong-ui-spec-renderer-operations-list-item-path-font-family, var(--kong-ui-spec-renderer-font-family-monospace, monospace));
  font-size: 13px;
}
</style>
