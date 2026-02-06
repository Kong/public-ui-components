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
      <ChevronRightIcon
        v-if="isCollapsed"
        :color="`var(--kong-ui-spec-renderer-operations-list-section-icon-color-collapsed, ${KUI_COLOR_TEXT_NEUTRAL_WEAK})`"
        :size="KUI_ICON_SIZE_40"
      />
      <ChevronDownIcon
        v-else
        :color="`var(--kong-ui-spec-renderer-operations-list-section-icon-color-expanded, ${KUI_COLOR_TEXT_NEUTRAL_STRONGER})`"
        :size="KUI_ICON_SIZE_40"
      />
    </div>
    <h1
      aria-hidden="true"
      class="label truncated"
    >
      {{ name }}
    </h1>
    <div
      class="description truncated"
      :title="description"
    >
      {{ description }}
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import composables from '../../composables'
import { KUI_COLOR_TEXT_NEUTRAL_WEAK, KUI_COLOR_TEXT_NEUTRAL_STRONGER, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { ChevronRightIcon, ChevronDownIcon } from '@kong/icons'

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
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-disabled, $kui-color-border-disabled);
  border-top-left-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  border-top-right-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  color: currentColor;
  cursor: pointer;
  display: flex;
  padding: var(--kui-space-40, $kui-space-40);
  width: 100%;
}

.header--collapsed {
  border-bottom-left-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  border-bottom-right-radius: var(--kui-border-radius-20, $kui-border-radius-20);
}

.label {
  color: var(--kong-ui-spec-renderer-operations-list-section-label-text-color, currentColor);
  font-family: inherit;
  font-size: var(--kui-font-size-40, $kui-font-size-40);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  line-height: var(--kui-line-height-40, $kui-line-height-40);
  margin: var(--kui-space-0, $kui-space-0) var(--kui-space-40, $kui-space-40) var(--kui-space-0, $kui-space-0) var(--kui-space-0, $kui-space-0);

  &:first-letter {
    text-transform: capitalize;
  }
}

.header--collapsed .label {
  color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
}

.description {
  font-family: var(--kong-ui-spec-renderer-operations-list-section-description-font-family, var(--kui-font-family-code, $kui-font-family-code));
  line-height: 1;
  margin-left: var(--kui-space-auto, $kui-space-auto);
  max-width: 65%;
}

.icon-wrapper {
  height: 18px;
  margin-right: var(--kui-space-40, $kui-space-40);
}

.truncated {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
