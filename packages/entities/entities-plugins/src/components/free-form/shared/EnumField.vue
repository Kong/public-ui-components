<template>
  <SelectComponent
    class="ff-enum-field"
    v-bind="props"
  >
    <template
      v-if="props.labelAttributes?.info"
      #label-tooltip
    >
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-html="props.labelAttributes?.info" />
    </template>
  </SelectComponent>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KSelect, KMultiselect, type LabelAttributes } from '@kong/kongponents'

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Props other than `labelAttributes` here are passed down to the `KSelect` via
// attribute fallthrough.
interface InputProps {
  labelAttributes?: LabelAttributes
  multiple?: boolean
}

const props = defineProps<InputProps>()

const SelectComponent = computed(() => {
  return props.multiple ? KMultiselect : KSelect
})
</script>

<style lang="scss" scoped>
.ff-enum-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
