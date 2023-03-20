<template>
  <KDropdownMenu
    class="account-dropdown"
    :kpop-attributes="{ placement: 'bottomStart' }"
    :label="userInitials"
    size="small"
    :width="width"
    @change="(selection: any) => optionSelected(selection)"
  >
    <template #items="{ handleSelection }">
      <slot>
        <KDropdownItem
          v-for="option in options"
          :key="option.value"
          :class="{ 'has-divider': option.hasDivider }"
          :data-testid="'select-' + option.value"
          :has-divider="option.hasDivider"
          :selected="selectedOption.value === option.value"
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
import { ref, Ref, PropType } from 'vue'
import type { DropdownItem } from '@kong/kongponents'

const props = defineProps({
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
const emit = defineEmits(['change'])

const selectedOption: Ref<DropdownItem> = ref(props.options?.filter((option: DropdownItem) => !!option.selected)[0] || props.options[0])

const optionSelected = (option: DropdownItem) => {
  selectedOption.value = option
  emit('change', selectedOption.value)
}

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
