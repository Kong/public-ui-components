<template>
  <KSelect
    :id="domId"
    ref="suggestion"
    v-model="id"
    clearable
    :disabled="disabled"
    enable-filtering
    :error="error !== null"
    :filter-function="() => true"
    :help="error !== null ? error : undefined"
    :items="suggestions"
    :loading="loading"
    :placeholder="placeholder"
    width="100%"
    @change="$emit('change', $event)"
    @query-change="$emit('query-change', $event)"
  >
    <template
      v-if="!!$slots.before"
      #before
    >
      <slot name="before" />
    </template>
    <template #item-template="{ item }">
      <slot
        :item="item"
        name="item"
      >
        <span
          class="item-label"
          :data-testid="item.id && `${item.id}-0`"
          :data-testlabel="item.label"
        >
          {{ item.label }}
        </span>
      </slot>
    </template>

    <template #selected-item-template="{ item }">
      <slot
        :item="item"
        name="selected-item"
      >
        <span class="item-label">
          {{ item.label }}
        </span>
      </slot>
    </template>
    <template #empty>
      <div class="autosuggest__results_message">
        <span>{{ emptyMessage || t('fields.auto_suggest.no_results') }}</span>
      </div>
    </template>
  </KSelect>
</template>

<script setup lang="ts" generic="T extends number | string">
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../locales/en.json'

import type { SelectItem } from '@kong/kongponents'

const { t } = createI18n('en-us', english)

const {
  placeholder = '',
  disabled = false,
  suggestions,
  loading = false,
  emptyMessage = '',
  domId,
} = defineProps<{
  placeholder?: string
  suggestions: Array<SelectItem<T>>
  disabled?: boolean
  loading?: boolean
  emptyMessage?: string
  domId: string
  error?: string | null
}>()

defineEmits<{
  change: [item: SelectItem<T> | null]
  'query-change': [query: string]
}>()

const id = defineModel<T>('id', { required: true })
</script>

<style scoped lang="scss">
.autosuggest .k-select {
  .k-select-list .k-select-item {
    button:active {
      box-shadow: none;

      &:not(.selected) {
        background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
      }
    }
  }
}
</style>
