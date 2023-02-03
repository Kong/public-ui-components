<template>
  <button
    :aria-controls="contentElementId"
    :aria-expanded="isCollapsed ? 'false' : 'true'"
    :aria-label="collapseAriaLabel"
    class="header"
    :class="{ 'header--collapsed': isCollapsed }"
    type="button"
    @click="$emit('toggle')"
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
      class="label truncate"
    >
      {{ name }}
    </h1>
    <div
      class="description truncate"
      :title="description"
    >
      {{ description }}
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import composables from '../../composables'

const props = defineProps({
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

defineEmits(['toggle'])

const { i18n } = composables.useI18n()

const collapseAriaLabel = computed((): string => {
  return props.isCollapsed ? i18n.t('specOperationsList.section.expandAriaLabel', { section: `"${props.name}"` }) : i18n.t('specOperationsList.section.collapseAriaLabel', { section: `"${props.name}"` })
})
</script>

<style scoped lang="scss">
.header {
  align-items: center;
  appearance: none;
  background: var(--kong-ui-spec-renderer-operations-list-section-background, transparent);
  border: 1px solid var(--kong-ui-spec-renderer-operations-list-section-border-color, var(--grey-200, #f1f1f5));
  border-top-left-radius: var(--kong-ui-spec-renderer-operations-list-section-border-radius, 4px);
  border-top-right-radius: var(--kong-ui-spec-renderer-operations-list-section-border-radius, 4px);
  color: currentColor;
  cursor: pointer;
  display: flex;
  padding: var(--kong-ui-spec-renderer-operations-list-section-padding, 8px);
  width: 100%;
}

.header--collapsed {
  border-bottom-left-radius: var(--kong-ui-spec-renderer-operations-list-section-border-radius, 4px);
  border-bottom-right-radius: var(--kong-ui-spec-renderer-operations-list-section-border-radius, 4px);
}

.label {
  color: var(--kong-ui-spec-renderer-operations-list-section-label-text-color, currentColor);
  font-family: inherit;
  font-size: var(--kong-ui-spec-renderer-operations-list-section-label-font-size, 15px);
  font-weight: 600;
  line-height: 1;
  margin: 0 8px 0 0;

  &:first-letter {
    text-transform: capitalize;
  }
}

.header--collapsed .label {
  color: var(--kong-ui-spec-renderer-operations-list-section-label-text-color-collapsed, var(--black-400, #3C4557));
}

.description {
  font-family: var(--kong-ui-spec-renderer-operations-list-section-description-font-family, var(--kong-ui-spec-renderer-font-monospace, monospace));
  line-height: 1;
  margin-left: auto;
  max-width: 65%;
}

.icon-wrapper {
  height: 18px;
  margin-right: 8px;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
