<template>
  <KCheckbox
    class="ff-boolean-field"
    v-bind="props"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template
      v-if="props.labelAttributes?.info"
      #tooltip
    >
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-html="props.labelAttributes?.info" />
    </template>
  </KCheckbox>
</template>

<script setup lang="ts">
import { KCheckbox, type LabelAttributes } from '@kong/kongponents'
import { watch } from 'vue'

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Props other than `labelAttributes` and `modelValue` here are passed down to the
// `KCheckbox` via attribute fallthrough.
interface InputProps {
  labelAttributes?: LabelAttributes
  modelValue: boolean
}

const props = defineProps<InputProps>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

watch(() => props.modelValue, (newVal) => {
  console.log(newVal)
})
</script>

<style lang="scss" scoped>
.ff-boolean-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
