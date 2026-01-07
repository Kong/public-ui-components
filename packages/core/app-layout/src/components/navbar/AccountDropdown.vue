<template>
  <KDropdown
    class="account-dropdown"
    :kpop-attributes="{ placement: 'bottom-end' }"
    :trigger-text="userInitials"
    :width="width"
  >
    <template #items="{ handleSelection }">
      <slot>
        <KDropdownItem
          v-for="option in options"
          :key="option.value"
          :class="{ 'has-divider': option.hasDivider }"
          :data-testid="'select-' + option.value"
          :has-divider="option.hasDivider"
          @click="handleSelection(option)"
        >
          <slot :option="option">
            {{ option.label }}
          </slot>
        </KDropdownItem>
      </slot>
    </template>
  </KDropdown>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { DropdownItem } from '@kong/kongponents'

defineProps({
  options: {
    type: Array as PropType<DropdownItem[]>,
    required: true,
  },
  width: {
    type: String,
    default: '240',
  },
  userInitials: {
    type: String,
    required: true,
    // Important: default to a string with a single empty space to force the dropdown to always be visible
    default: ' ',
  },
})

</script>

<style lang="scss" scoped>
.account-dropdown {
  display: flex;
  margin-right: var(--kui-space-20, $kui-space-20);

  :deep(.k-button.primary),
  :deep(.k-button.primary:hover:not(:disabled)) {
    background-color: var(--kong-ui-account-dropdown-background, #9396FC);
    border-radius: var(--kui-border-radius-round, $kui-border-radius-round);
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    height: 24px;
    justify-content: center;
    padding: var(--kui-space-0, $kui-space-0);
    // Prevent text selection
    user-select: none;
    width: 24px;

    &:hover,
    &:focus,
    &:active {
      background-color: var(--kong-ui-account-dropdown-background, #9396FC) !important;
    }

    &:focus-visible {
      border-radius: var(--kui-border-radius-round, $kui-border-radius-round);
      outline: 1px solid #bee2ff !important;
      outline-offset: 2px;
    }
  }
}
</style>
