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

const { formData, getDefault } = useFormShared()

// `config.response_codes` and its per-code records are not `required` in the
// plugin schema, so their defaults are not auto-populated on creation. This
// fixed 5-row table always shows the schema default as a fallback.
function getHttpStatus(key: ResponseKey): number | string {
  return get(formData, ['config', 'response_codes', key, 'http_status'])
    ?? getDefault(`config.response_codes.${key}.http_status`)
    ?? ''
}

function getMessage(key: ResponseKey): string {
  return get(formData, ['config', 'response_codes', key, 'message'])
    ?? getDefault(`config.response_codes.${key}.message`)
    ?? ''
}

function setHttpStatus(key: ResponseKey, value: string | number) {
  const num = typeof value === 'string' ? (value === '' ? null : Number(value)) : value
  set(formData, ['config', 'response_codes', key, 'http_status'], num)
}

function setMessage(key: ResponseKey, value: string) {
  set(formData, ['config', 'response_codes', key, 'message'], value)
}
</script>

<style lang="scss" scoped>
.ff-response-mapping {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  &-header {
    border-bottom: 1px solid var(--kui-color-border, $kui-color-border);
    color: var(--kui-color-text, $kui-color-text);
    display: flex;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    gap: var(--kui-space-60, $kui-space-60);
    padding-bottom: var(--kui-space-20, $kui-space-20);
  }

  &-row {
    align-items: center;
    display: flex;
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
