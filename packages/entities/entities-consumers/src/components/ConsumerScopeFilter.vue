<template>
  <div class="consumer-scope-filter">
    <span class="scope-filter-label">{{ t('consumers.list.scope_filter.label') }}:</span>
    <KSegmentedControl
      v-model="filterValue"
      :options="filterOptions"
      size="large"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { SegmentedControlOption } from '@kong/kongponents'
import type { ConsumerScopeFilterValue } from '../types'
import composables from '../composables'

const { i18n: { t } } = composables.useI18n()

const props = defineProps({
  modelValue: {
    type: String as PropType<ConsumerScopeFilterValue>,
    required: true,
  },
  hasRealm: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const filterOptions = computed((): SegmentedControlOption[] => [
  { label: t('consumers.list.scope_filter.cp'), value: 'cp' },
  { label: t('consumers.list.scope_filter.realm'), value: 'realm', disabled: !props.hasRealm },
])

const filterValue = ref<ConsumerScopeFilterValue>(props.modelValue)

watch(filterValue, (value) => {
  emit('update:modelValue', value)
})
</script>

<style lang="scss" scoped>
.consumer-scope-filter {
  align-items: center;
  display: flex;
  gap: $kui-space-50;
  margin-right: $kui-space-70;

  .scope-filter-label {
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-regular;
    line-height: $kui-line-height-30;
  }
}
</style>
