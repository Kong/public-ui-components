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
  },
})

</script>

<style lang="scss" scoped>
.account-dropdown {
  display: flex;
  margin-right: 4px;
  :deep(.k-button.primary), :deep(.k-button.primary:hover:not(:disabled)) {
    background-color: var(--kong-ui-account-dropdown-background, var(--purple-300, #9396FC));
    color: var(--kong-ui-account-dropdown-color, var(--white, #fff));
    height: 32px;
    justify-content: center;
    padding: 0;
    width: 32px;
    &:active {
      background-color: var(--kong-ui-account-dropdown-background, var(--purple-300, #9396FC));
    }
  }
  // Align the dropdown to the bottom of the navbar
  :deep(.k-dropdown-popover) {
    top: 10px !important;
  }

  :deep(.k-dropdown-item:first-child) {
    > button {
      color: var(--grey-600, #3C4557);
      font-weight:600 !important;
      padding-bottom: 0px;
    }
  }
  :deep(.k-dropdown-item:nth-child(2)) {
    > button {
      color: var(--grey-500, #6F7787);
      font-size:14px;
      padding-top: 4px;
    }
  }

  :deep(.k-dropdown-item.has-divider:before) {
    background-color: var(--grey-300, #E7E7EC);
  }

  :deep(.k-dropdown-item:nth-child()) {
    > button {
      color: var(--grey-600, #3C4557);
    }
  }
}
</style>
