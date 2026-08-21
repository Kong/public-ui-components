<template>
  <div class="ff-card-radio-field">
    <KLabel v-if="label">
      {{ label }}
    </KLabel>
    <div class="ff-card-radio-field-cards">
      <KRadio
        v-for="option in options"
        :key="String(option.value)"
        v-model="fieldValue"
        card
        card-orientation="horizontal"
        :description="option.description"
        :label="option.label"
        :selected-value="option.value"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KLabel, KRadio } from '@kong/kongponents'
import { get, set } from 'lodash-es'
import { useFormShared } from '../../shared/composables'

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

const { formData } = useFormShared()

const fieldValue = computed<boolean | string>({
  get: () => {
    const parts = props.name.split('.')
    return get(formData, parts)
  },
  set: (v) => {
    const parts = props.name.split('.')
    set(formData, parts, v)
  },
})
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
