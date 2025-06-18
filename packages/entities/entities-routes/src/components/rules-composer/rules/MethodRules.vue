<template>
  <div
    class="routing-rule-container"
    data-testid="route-form-methods"
  >
    <KLabel
      :tooltip-attributes="{ maxWidth: '320' }"
    >
      <template #tooltip>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="t('form.fields.methods.tooltip')" />
      </template>
      {{ t('form.fields.methods.label') }}
    </KLabel>
    <div class="routing-rule-input">
      <KMultiselect
        enable-item-creation
        :item-creation-validator="itemCreationValidator"
        :items="methodOptions"
        :model-value="selectedMethods"
        :placeholder="t('form.fields.methods.placeholder')"
        :search-placeholder="t('form.fields.methods.search_placeholder')"
        @item-added="(item) => trackNewItems(item, true)"
        @item-removed="(item) => trackNewItems(item, false)"
        @update:model-value="onSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import composables from '../../../composables'
import { Methods, type Method, type CustomMethod } from '../../../types'

const { i18n: { t } } = composables.useI18n()

const methods = defineModel<Array<Method | CustomMethod>>('methods', { required: true })
const customMethods = defineModel<Array<{ label: string, value: string }>>('customMethods', { required: true })

const selectedMethods = computed(() => {
  return methods.value.filter((method) => Object.keys(Methods).includes(method)).concat(customMethods.value.map(method => method.value))
})

const methodOptions = computed(() => Object.keys(Methods).map((method) => ({
  label: method,
  value: method,
})).concat(customMethods.value.map((method) => ({
  label: method.label,
  value: method.value,
  custom: true,
}))))

const itemCreationValidator = (input: string) => {
  return !methodOptions.value.map(method => method.value.toLowerCase()).includes(input.toLowerCase())
}

const trackNewItems = (item: { label: string, value: string }, added: boolean) => {
  if (added) {
    customMethods.value.push(item)
  } else {
    customMethods.value = customMethods.value.filter(anItem => anItem.value !== item.value)
  }
}

const onSelect = (items: Array<string>) => {
  methods.value = items
}
</script>

<style lang="scss" scoped>
@use "../../../styles/mixins" as *;

.routing-rule {
  @include routing-rule;
}
</style>
