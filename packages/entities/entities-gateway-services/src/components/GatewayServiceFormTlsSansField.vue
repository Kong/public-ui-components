<template>
  <div class="tls-sans-field-container">
    <KLabel :info="tooltip">
      {{ label }}
    </KLabel>
    <div
      v-for="(_, index) in modelValue"
      :key="index"
      class="tls-sans-field-input"
    >
      <KInput
        autocomplete="off"
        :data-testid="`${testIdPrefix}-input-${index}`"
        :error="error"
        :model-value="modelValue[index]"
        :placeholder="placeholder"
        :readonly="readonly"
        type="text"
        @update:model-value="updateItem(index, $event.trim())"
      />
      <div
        v-if="!readonly"
        class="tls-sans-field-controls"
      >
        <KButton
          appearance="tertiary"
          :data-testid="`remove-${testIdPrefix}`"
          icon
          @click="removeItem(index)"
        >
          <TrashIcon :color="KUI_COLOR_TEXT_DANGER" />
        </KButton>
        <KButton
          appearance="tertiary"
          :data-testid="`add-${testIdPrefix}`"
          :disabled="index !== modelValue.length - 1"
          icon
          @click="addItem"
        >
          <AddIcon />
        </KButton>
      </div>
    </div>
    <div v-if="modelValue.length === 0 && !readonly">
      <KButton
        :data-testid="`add-${testIdPrefix}`"
        @click="addItem"
      >
        <AddIcon />
        {{ addButtonText }}
      </KButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AddIcon, TrashIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_DANGER } from '@kong/design-tokens'

const props = defineProps<{
  modelValue: string[]
  label: string
  tooltip: string
  placeholder: string
  addButtonText: string
  testIdPrefix: string
  error: boolean
  readonly: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
  (e: 'input'): void
}>()

const addItem = () => {
  emit('update:modelValue', [...props.modelValue, ''])
}

const removeItem = (index: number) => {
  const updated = [...props.modelValue]
  updated.splice(index, 1)
  emit('update:modelValue', updated)
}

const updateItem = (index: number, value: string) => {
  const updated = [...props.modelValue]
  updated[index] = value
  emit('update:modelValue', updated)
  emit('input')
}
</script>

<style lang="scss" scoped>
.tls-sans-field-container {
  .tls-sans-field-input {
    align-items: center;
    display: flex;
    gap: var(--kui-space-80, $kui-space-80);

    &:not(:last-child) {
      margin-bottom: var(--kui-space-60, $kui-space-60);
    }
  }

  .tls-sans-field-controls {
    display: flex;
    gap: var(--kui-space-20, $kui-space-20);
  }
}
</style>
