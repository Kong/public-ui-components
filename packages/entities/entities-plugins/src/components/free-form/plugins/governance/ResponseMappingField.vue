<template>
  <div class="ff-response-mapping">
    <div class="ff-response-mapping-header">
      <span class="ff-response-mapping-col ff-response-mapping-col--code">{{ t('plugins.free-form.governance.fields.response.columns.code') }}</span>
      <span class="ff-response-mapping-col ff-response-mapping-col--status">{{ t('plugins.free-form.governance.fields.response.columns.status') }}</span>
      <span class="ff-response-mapping-col ff-response-mapping-col--message">{{ t('plugins.free-form.governance.fields.response.columns.message') }}</span>
    </div>
    <div
      v-for="key in RESPONSE_KEYS"
      :key="key"
      class="ff-response-mapping-row"
    >
      <div class="ff-response-mapping-col ff-response-mapping-col--code">
        <KInput
          :data-testid="`ff-response-mapping-code-${key}`"
          :model-value="key"
          readonly
        />
      </div>
      <div class="ff-response-mapping-col ff-response-mapping-col--status">
        <KInput
          :data-testid="`ff-response-mapping-status-${key}`"
          :model-value="getHttpStatus(key)"
          type="number"
          @update:model-value="setHttpStatus(key, $event)"
        />
      </div>
      <div class="ff-response-mapping-col ff-response-mapping-col--message">
        <KInput
          :data-testid="`ff-response-mapping-message-${key}`"
          :model-value="getMessage(key)"
          @update:model-value="setMessage(key, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KInput } from '@kong/kongponents'
import { get, set } from 'lodash-es'
import { useFormShared } from '../../shared/composables'
import useI18n from '../../../../composables/useI18n'

const { i18n: { t } } = useI18n()

/** Fixed set of response code keys defined by the plugin schema. */
const RESPONSE_KEYS = [
  'NO_CREDIT_AVAILABLE',
  'USAGE_LIMIT_REACHED',
  'FEATURE_UNAVAILABLE',
  'FEATURE_NOT_FOUND',
  'CUSTOMER_NOT_FOUND',
] as const

type ResponseKey = typeof RESPONSE_KEYS[number]

const { formData } = useFormShared()

function getHttpStatus(key: ResponseKey): number | string {
  return get(formData, ['config', 'response', key, 'http_status']) ?? ''
}

function getMessage(key: ResponseKey): string {
  return get(formData, ['config', 'response', key, 'message']) ?? ''
}

function setHttpStatus(key: ResponseKey, value: string | number) {
  const num = typeof value === 'string' ? (value === '' ? null : Number(value)) : value
  set(formData, ['config', 'response', key, 'http_status'], num)
}

function setMessage(key: ResponseKey, value: string) {
  set(formData, ['config', 'response', key, 'message'], value)
}
</script>

<style lang="scss" scoped>
.ff-response-mapping {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  &-header {
    display: flex;
    gap: var(--kui-space-60, $kui-space-60);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    padding-bottom: var(--kui-space-20, $kui-space-20);
    border-bottom: 1px solid var(--kui-color-border, $kui-color-border);
  }

  &-row {
    display: flex;
    align-items: center;
    gap: var(--kui-space-60, $kui-space-60);
  }

  &-col {
    &--code {
      flex: 2 1 0;
      min-width: 0;
    }

    &--status {
      flex: 1 1 0;
      min-width: 80px;
    }

    &--message {
      flex: 3 1 0;
      min-width: 0;
    }
  }
}
</style>
