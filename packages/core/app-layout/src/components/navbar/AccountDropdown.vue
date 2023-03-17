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
          :data-testid="'select-' + option.value"
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
    default: '175',
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
}
.k-dropdown::v-deep .k-button.primary {
  align-items: center;
  background: #9396FC; /* Purple/300 */
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 48px;
  justify-content: center;
  width: 48px;

  &:hover,
  &:focus {
    background: #9396FC; /* Purple/300 */
  }

}
</style>
