<template>
  <button
    :aria-controls="contentElementId"
    :aria-expanded="isCollapsed ? 'false' : 'true'"
    :aria-label="isCollapsed ? `Expand section &quot;${name}&quot;` : `Collapse section &quot;${name}&quot;`"
    class="header"
    type="button"
    @click="emits('toggle')"
  >
    <div
      aria-hidden="true"
      class="icon-wrapper"
    >
      <KIcon
        v-if="isCollapsed"
        color="var(--kong-ui-spec-renderer-operations-list-section-icon-color-collapsed, var(--grey-400, #b6b6bd))"
        icon="chevronRight"
        size="18"
      />
      <KIcon
        v-else
        color="var(--kong-ui-spec-renderer-operations-list-section-icon-color-expanded, var(--grey-600, #3c4557))"
        icon="chevronDown"
        size="18"
      />
    </div>
    <h1
      aria-hidden="true"
      class="label"
    >
      {{ name }}
    </h1>
    <div
      class="description"
      :title="description"
    >
      {{ description }}
    </div>
  </button>
</template>

<script setup lang="ts">
import { KIcon } from '@kong/kongponents'

defineProps({
  isCollapsed: {
    type: Boolean,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: undefined,
  },
  contentElementId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['toggle'])
</script>

<style scoped lang="scss">
.header {
  align-items: center;
  appearance: none;
  background: var(--kong-ui-spec-renderer-operations-list-section-background, transparent);
  border: 1px solid var(--kong-ui-spec-renderer-operations-list-section-border-color, var(--grey-200, #f1f1f5));
  border-radius: var(--kong-ui-spec-renderer-operations-list-section-border-radius, 4px 4px 0 0);
  cursor: pointer;
  display: flex;
  padding: var(--kong-ui-spec-renderer-operations-list-section-padding, 10px 8px 10px 12px);
  width: 100%;
}

.label {
  font-size: var(--kong-ui-spec-renderer-operations-list-section-label-font-size, 18px);
  font-weight: 600;
  margin: 0 8px 0 0;

  &:first-letter {
    text-transform: capitalize;
  }
}

.description {
  font-family: var(--kong-ui-spec-renderer-operations-list-section-description-font-family, var(--kong-ui-spec-renderer-font-monospace, monospace));
  margin-left: auto;
  max-width: 65%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-wrapper {
  align-self: end;
  height: 18px;
  margin-right: 8px;
}
</style>
