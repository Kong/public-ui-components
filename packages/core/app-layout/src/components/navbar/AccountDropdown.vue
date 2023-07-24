<template>
  <KDropdownMenu
    class="account-dropdown"
    :kpop-attributes="{ placement: 'bottomStart' }"
    :label="userInitials"
    size="small"
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
  </KDropdownMenu>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
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
  margin-right: $kui-space-20;

  :deep(.k-button.primary),
  :deep(.k-button.primary:hover:not(:disabled)) {
    background-color: var(--kong-ui-account-dropdown-background, $kui-color-background-primary);
    color: var(--kong-ui-account-dropdown-color, $kui-color-background);
    font-size: $kui-font-size-20;
    height: 24px;
    justify-content: center;
    padding: $kui-space-0;
    // Prevent text selection
    user-select: none;
    width: 24px;

    &:active {
      background-color: var(--kong-ui-account-dropdown-background, var(--purple-300, #9396FC));
    }
  }

  // Align the dropdown to the bottom of the navbar
  :deep(.k-dropdown-popover) {
    top: 10px !important;
  }
}
</style>
