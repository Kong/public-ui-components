<template>
  <div
    ref="root"
    class="string-array-field"
  >
    <KLabel
      v-if="label"
      :info="tooltip"
      :tooltip-attributes="{ maxWidth: '400' }"
    >
      {{ label }}
    </KLabel>
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="string-array-field-item"
      :data-index="index"
    >
      <KInput
        v-model.trim="item.value"
        :data-testid="`${testIdPrefix}-input`"
        :readonly="readonly"
        @update:model-value="syncModel"
      />
      <KButton
        appearance="tertiary"
        :aria-label="t('form.actions.remove')"
        class="string-array-field-remove"
        :data-testid="`${testIdPrefix}-remove`"
        :disabled="readonly"
        icon
        @click="removeItem(item.id)"
      >
        <CloseIcon />
      </KButton>
    </div>
    <KButton
      appearance="tertiary"
      class="string-array-field-add"
      :data-testid="`${testIdPrefix}-add`"
      :disabled="readonly"
      @click="addItem"
    >
      <AddIcon />
      <span>{{ addButtonText }}</span>
    </KButton>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, useTemplateRef } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { AddIcon, CloseIcon } from '@kong/icons'
import composables from '../composables'

defineProps<{
  label?: string
  tooltip?: string
  addButtonText: string
  testIdPrefix: string
  readonly?: boolean
}>()

const model = defineModel<string[]>({ required: true })

const { i18n: { t } } = composables.useI18n()

interface Item {
  id: string
  value: string
}

const items = ref<Item[]>([])

// Keep the internal (id-keyed) list in sync when the model is replaced externally (e.g. edit hydration)
watch(model, (value) => {
  const next = value ?? []
  // Avoid clobbering local editing state when the model already matches
  if (next.length === items.value.length && next.every((v, i) => v === items.value[i]?.value)) {
    return
  }
  items.value = next.map((value) => ({ id: uuidv4(), value }))
}, { immediate: true })

const syncModel = () => {
  model.value = items.value.map((item) => item.value)
}

const root = useTemplateRef<HTMLElement>('root')

const focusItem = async (index: number) => {
  await nextTick()
  root.value?.querySelector<HTMLInputElement>(`[data-index="${index}"] input`)?.focus()
}

const addItem = () => {
  items.value.push({ id: uuidv4(), value: '' })
  syncModel()
  focusItem(items.value.length - 1)
}

const removeItem = (id: string) => {
  items.value = items.value.filter((item) => item.id !== id)
  syncModel()
}
</script>

<style lang="scss" scoped>
.string-array-field {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  &-item {
    align-items: flex-start;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);

    :deep(.k-input) {
      flex-grow: 1;
    }
  }

  &-add {
    align-self: flex-start;
  }
}
</style>
