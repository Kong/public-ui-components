<template>
  <KDropdownMenu
    appearance="selectionMenu"
    class="top-bar-dropdown-menu"
    :disabled="disabled"
    :disabled-tooltip="tooltip"
    :kpop-attributes="{ placement: 'bottomStart', disabled: disabled }"
    :label="selectedOption.label"
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
import type { NavbarDropdownMenuItem } from '../../types'

const props = defineProps({
  options: {
    type: Array as PropType<NavbarDropdownMenuItem[]>,
    default: () => ([]),
  },
  tooltip: {
    type: String,
    default: '',
  },
  width: {
    type: String,
    default: '175',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['change'])

const selectedOption: Ref<NavbarDropdownMenuItem> = ref(props.options?.filter((option: NavbarDropdownMenuItem) => !!option.selected)[0] || props.options[0])

const optionSelected = (option: NavbarDropdownMenuItem) => {
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
