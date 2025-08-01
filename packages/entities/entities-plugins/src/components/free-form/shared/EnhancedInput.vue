<template>
  <InputComponent
    v-if="!multiline"
    v-bind="$attrs"
    :model-value="modelValue"
    @change="handleChange"
    @update:model-value="handleInput"
  >
    <template
      v-for="(_, name) in useSlots()"
      #[name]="slotData"
    >
      <slot
        :name="name"
        v-bind="slotData"
      />
    </template>
  </InputComponent>
</template>

<script setup lang="ts">
import { KInput, KTextArea } from '@kong/kongponents'
import { ref, watch, useSlots, computed } from 'vue'
import { useFormShared } from './composables'

interface Props {
  modelValue?: string
  multiline?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const InputComponent = computed(() => props.multiline ? KTextArea : KInput)

const innerValue = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  innerValue.value = newValue
})

const { formConfig } = useFormShared()

const handleInput = (value: string) => {
  innerValue.value = value

  if (!formConfig.updateOnChange) {
    emit('update:modelValue', value)
  }
}

const handleChange = () => {
  if (formConfig.updateOnChange) {
    emit('update:modelValue', innerValue.value!)
  }
}
</script>
