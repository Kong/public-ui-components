<template>
  <div
    ref="root"
    class="key-value-field"
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
      class="key-value-field-item"
      :data-index="index"
    >
      <div class="key-value-field-inputs">
        <KInput
          v-model.trim="item.key"
          :data-testid="`${testIdPrefix}-key-input`"
          :placeholder="t('form.fields.oauth.key_placeholder')"
          :readonly="readonly"
          @update:model-value="syncModel"
        />
        <KInput
          v-model.trim="item.value"
          :data-testid="`${testIdPrefix}-value-input`"
          :placeholder="t('form.fields.oauth.value_placeholder')"
          :readonly="readonly"
          @update:model-value="syncModel"
        />
      </div>
      <KButton
        appearance="tertiary"
        :aria-label="t('form.actions.remove')"
        class="key-value-field-remove"
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
      class="key-value-field-add"
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
import { isEqual } from 'lodash-es'
import { AddIcon, CloseIcon } from '@kong/icons'
import composables from '../composables'

defineProps<{
  label?: string
  tooltip?: string
  addButtonText: string
  testIdPrefix: string
  readonly?: boolean
}>()

const model = defineModel<Record<string, string>>({ required: true })

const { i18n: { t } } = composables.useI18n()

interface Item {
  id: string
  key: string
  value: string
}

const items = ref<Item[]>([])

const modelToItems = (value: Record<string, string> | undefined): Item[] =>
  Object.entries(value ?? {}).map(([key, value]) => ({ id: uuidv4(), key, value }))

// `items` is the source of truth so duplicate keys can coexist in the UI; we track the last value we
// wrote to the model to tell our own updates apart from external ones (e.g. edit hydration)
let lastSynced: Record<string, string> = {}

// Rebuild the internal (id-keyed) list only when the model is replaced externally
watch(model, (value) => {
  const next = value ?? {}
  if (isEqual(next, lastSynced)) {
    return
  }
  items.value = modelToItems(next)
}, { immediate: true })

const syncModel = () => {
  // Only rows with a non-empty key are serialized; duplicate keys collapse with the later row winning
  const next = items.value.reduce<Record<string, string>>((acc, item) => {
    if (item.key !== '') {
      acc[item.key] = item.value
    }
    return acc
  }, {})
  lastSynced = next
  model.value = next
}

const root = useTemplateRef<HTMLElement>('root')

const focusItem = async (index: number) => {
  await nextTick()
  // The first input in a row is the key input
  root.value?.querySelector<HTMLInputElement>(`[data-index="${index}"] input`)?.focus()
}

const addItem = () => {
  items.value.push({ id: uuidv4(), key: '', value: '' })
  focusItem(items.value.length - 1)
}

const removeItem = (id: string) => {
  items.value = items.value.filter((item) => item.id !== id)
  syncModel()
}
</script>

<style lang="scss" scoped>
.key-value-field {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  &-item {
    align-items: flex-start;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
  }

  &-inputs {
    display: grid;
    flex-grow: 1;
    gap: var(--kui-space-40, $kui-space-40);
    grid-template-columns: 1fr 1fr;
  }

  &-add {
    align-self: flex-start;
  }
}
</style>
