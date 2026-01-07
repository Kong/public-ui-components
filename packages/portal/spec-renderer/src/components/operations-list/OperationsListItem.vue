<template>
  <button
    class="spec-operations-list-item"
    :class="{
      'item--selected': isSelected,
      [`item--method-${item.method}`]: true,
      'disabled': disableSelection,
    }"
    :data-testid="testId"
    type="button"
    @click="$emit('click', item)"
  >
    <h2
      v-if="item.summary"
      class="summary truncated"
      :title="item.summary"
    >
      {{ item.summary }}
    </h2>
    <div class="details">
      <KBadge
        :appearance="methodName"
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
        class="path truncated"
        :title="item.path"
      >
        {{ item.path }}
      </span>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import type { OperationListItem } from '../../types'
import composables from '../../composables'
import type { BadgeAppearance } from '@kong/kongponents'

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

const methodName = computed((): BadgeAppearance => {
  return props.item.method || ''
})
</script>

<style lang="scss" scoped>
.spec-operations-list-item {
  appearance: none;
  background: transparent;
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  cursor: pointer;
  display: block;
  padding: var(--kui-space-40, $kui-space-40);
  position: relative;
  text-align: left;
  width: 100%;

  &.disabled {
    cursor: default;
  }

  &:hover {
    background: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);

    .summary, .path {
      color: var(--kui-color-text, $kui-color-text);
    }
  }

  &:last-of-type {
    border-bottom-left-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    border-bottom-right-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  }
}

.item--selected {
  background: var(--kui-color-background-primary-weakest, $kui-color-background-primary-weakest);

  &::before {
    background: var(--kui-color-background-primary, $kui-color-background-primary);
    bottom: 0;
    content: '';
    display: block;
    left: 0;
    position: absolute;
    top: 0;
    width: var(--kong-ui-spec-renderer-operations-list-item-selected-bar-width, 4px);
  }

  .summary {
    color: var(--kong-ui-spec-renderer-operations-list-item-summary-text-color-selected, #0B172D);
  }

  .path {
    color: var(--kong-ui-spec-renderer-operations-list-item-summary-text-color-selected, #0B172D);
  }
}

.item--method-get {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kui-method-color-text-get, $kui-method-color-text-get);
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kui-method-color-background-get, $kui-method-color-background-get);
}

.item--method-post {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kui-method-color-text-post, $kui-method-color-text-post);
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kui-method-color-background-post, $kui-method-color-background-post);
}

.item--method-put {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kui-method-color-text-put, $kui-method-color-text-put);
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kui-method-color-background-put, $kui-method-color-background-put);
}

.item--method-patch {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kui-method-color-text-patch, $kui-method-color-text-patch);
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kui-method-color-background-patch, $kui-method-color-background-patch);
}

.item--method-delete {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kui-method-color-text-delete, $kui-method-color-text-delete);
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kui-method-color-background-delete, $kui-method-color-background-delete);
}

.item--method-options {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kui-method-color-text-options, $kui-method-color-text-options);
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kui-method-color-background-options, $kui-method-color-background-options);
}

.item--method-head {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kui-method-color-text-head, $kui-method-color-text-head);
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kui-method-color-background-head, $kui-method-color-background-head);
}

.item--method-connect {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kui-method-color-text-connect, $kui-method-color-text-connect);
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kui-method-color-background-connect, $kui-method-color-background-connect);
}

.item--method-trace {
  --kong-ui-spec-renderer-operations-list-item-method-color: var(--kui-method-color-text-trace, $kui-method-color-text-trace);
  --kong-ui-spec-renderer-operations-list-item-method-background: var(--kui-method-color-background-trace, $kui-method-color-background-trace);
}

.summary {
  color: var(--kui-color-text, $kui-color-text);
  font-family: inherit;
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
  margin: var(--kui-space-0, $kui-space-0) var(--kui-space-0, $kui-space-0) var(--kui-space-20, $kui-space-20);
}

.details {
  display: flex;
}

.truncated {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.method-badge {
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  margin-right: var(--kui-space-40, $kui-space-40);
}

.path {
  align-self: center;
  color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
  font-family: var(--kong-ui-spec-renderer-operations-list-item-path-font-family, var(--kui-font-family-code, $kui-font-family-code));
  font-size: var(--kui-font-size-20, $kui-font-size-20);
}
</style>
