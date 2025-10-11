<template>
  <InputComponent
    v-bind="$attrs"
    :character-limit="characterLimit"
    :model-value="modelValue"
    :resizable="multiline ? true : undefined"
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
import { ref, watch, useSlots, computed, useAttrs } from 'vue'
import { useFormShared } from './composables'

interface Props {
  modelValue?: string
  multiline?: boolean
}

const props = defineProps<Props>()
const attrs = useAttrs()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const InputComponent = computed(() => props.multiline ? KTextArea : KInput)
const characterLimit = computed(() => {
  return (attrs.characterLimit as number) ?? (props.multiline ? false : undefined)
})

const innerValue = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  innerValue.value = newValue
})

const { formConfig } = useFormShared()

const handleInput = (value: string) => {
  if (value === innerValue.value) return

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
