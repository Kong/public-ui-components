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
        <NumberField
          label=""
          :name="`config.response_codes.${key}.http_status`"
        />
      </div>
      <div class="ff-response-mapping-col ff-response-mapping-col--message">
        <StringField
          label=""
          :name="`config.response_codes.${key}.message`"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KInput } from '@kong/kongponents'
import NumberField from '../../shared/NumberField.vue'
import StringField from '../../shared/StringField.vue'
import { get, set } from 'lodash-es'
import { useFormShared } from '../../shared/composables'
import useI18n from '../../../../composables/useI18n'

const { i18n: { t } } = useI18n()

// Fixed set of response code keys defined by the plugin schema. Each cell is
// bound by path to the free-form NumberField/StringField.
const RESPONSE_KEYS = [
  'NO_CREDIT_AVAILABLE',
  'USAGE_LIMIT_REACHED',
  'FEATURE_UNAVAILABLE',
  'FEATURE_NOT_FOUND',
  'CUSTOMER_NOT_FOUND',
] as const

const { formData, getDefault } = useFormShared()

// `config.response_codes` and its per-code records are not `required` in the
// plugin schema, so their defaults are not auto-populated by the form's
// init-time seeding. Seed them here (synchronously, before the child fields
// mount) so NumberField/StringField display the schema defaults and bind by
// path as usual. Existing values (edit mode) are left untouched.
for (const key of RESPONSE_KEYS) {
  for (const sub of ['http_status', 'message'] as const) {
    const path = ['config', 'response_codes', key, sub]
    if (get(formData, path) == null) {
      set(formData, path, getDefault(`config.response_codes.${key}.${sub}`))
    }
  }
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
