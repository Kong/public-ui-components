<template>
  <KSelect
    v-model="selected"
    class="gateway-service-form-margin-top"
    data-testid="gateway-service-http-version-select"
    :help="help"
    :items="items"
    :label="t('gateway_services.form.fields.http_version.label')"
    :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
    :readonly="readonly"
    required
    width="100%"
  >
    <template #label-tooltip>
      <i18nT
        keypath="gateway_services.form.fields.http_version.tooltip"
        scope="global"
      >
        <template #code1>
          <code>{{ t('gateway_services.form.fields.http_version.code1') }}</code>
        </template>
        <template #code2>
          <code>{{ t('gateway_services.form.fields.http_version.code2') }}</code>
        </template>
      </i18nT>
    </template>
  </KSelect>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SelectItem } from '@kong/kongponents'
import composables from '../composables'

const props = defineProps<{
  modelValue: string
  readonly: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const { i18nT, i18n: { t } } = composables.useI18n()

const selected = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
})

const items: SelectItem[] = [
  {
    label: t('gateway_services.form.fields.http_version.options.http_1_1'),
    value: '1.1',
  },
  {
    label: t('gateway_services.form.fields.http_version.options.http_2'),
    value: '2',
  },
]

const help = computed((): string =>
  props.modelValue === '2' ? t('gateway_services.form.fields.http_version.help') : '')
</script>
