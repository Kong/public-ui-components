<template>
  <KDropdownMenu
    appearance="selectionMenu"
    class="top-bar-dropdown-menu"
    :kpop-attributes="{ placement: 'bottomStart', disabled: disabled }"
    :label="userInitials"
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
.top-bar-dropdown-menu {
  display: flex;
  margin-right: 4px;
}
</style>
