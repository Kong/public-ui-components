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
import { SecretInput } from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'
import { ref, watch, useSlots, computed, useAttrs } from 'vue'
import { useFormShared } from './composables'

interface Props {
  modelValue?: string
  multiline?: boolean
  secret?: boolean
}

const props = defineProps<Props>()
const attrs = useAttrs()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const InputComponent = computed(() => props.multiline ? KTextArea : props.secret ? SecretInput : KInput)
const characterLimit = computed(() => {
  return (attrs.characterLimit as number) ?? (props.multiline ? false : undefined)
})

const innerValue = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  innerValue.value = newValue
})

const { config } = useFormShared()

const handleInput = (value: string) => {
  if (value === innerValue.value) return

  innerValue.value = value

  if (!config.value.updateOnChange) {
    emit('update:modelValue', value)
  }
}

const handleChange = () => {
  if (config.value.updateOnChange) {
    emit('update:modelValue', innerValue.value!)
  }
}
</script>
