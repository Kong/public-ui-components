<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div
    v-else
    class="ff-card-radio-field"
  >
    <KLabel v-if="label">
      {{ label }}
    </KLabel>
    <div class="ff-card-radio-field-cards">
      <KRadio
        v-for="option in options"
        :key="String(option.value)"
        v-model="field.value.value"
        card
        card-orientation="horizontal"
        :description="option.description"
        :label="option.label"
        :selected-value="option.value"
      />
    </div>
    <FieldErrors
      :errors="field.fieldErrors.value"
      :path="field.path.value"
    />
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { KAlert, KLabel, KRadio } from '@kong/kongponents'
import { FieldErrors, useField } from '@kong-ui-public/freeform'

interface CardRadioOption {
  label: string
  description?: string
  value: boolean | string
}

const props = defineProps<{
  /** Dot-notation path into formData, e.g. 'config.fail_policy' */
  name: string
  label?: string
  options: CardRadioOption[]
}>()

const field = useField<boolean | string>(toRef(() => props.name))
</script>

<style lang="scss" scoped>
.ff-card-radio-field {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  &-cards {
    display: grid;
    gap: var(--kui-space-50, $kui-space-50);
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
