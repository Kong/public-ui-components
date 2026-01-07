<template>
  <div class="partial-config-card">
    <div
      v-for="{ key, label, value, type } in allConfigDetails"
      :key="key"
      class="partial-config-card-row"
    >
      <div class="config-card-row-label">
        <div class="label-text">
          {{ label }}
        </div>
      </div>
      <div
        class="config-card-row-value"
        :data-testid="`${key}-property-value`"
      >
        <div
          v-if="!itemHasValue(value)"
          :data-testid="`${key}-no-value`"
        >
          –
        </div>
        <div v-else>
          <div
            v-if="type === 'password'"
            :data-testid="`${key}-copy-password`"
          >
            <KCopy
              format="redacted"
              :text="String(value)"
            />
          </div>

          <div
            v-else
            :data-testid="`${key}-plain-text`"
          >
            {{ value }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Field } from '../composables/useRedisPartial'
import composables from '../composables'
import { useStringHelpers } from '@kong-ui-public/entities-shared'
import { computed } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'
import type { FlattendRedisConfigurationFields } from '../types'

const { t, formatUnixTimeStamp } = createI18n<typeof english>('en-us', english)

const standardEntityfields: Record<string, any> = {
  id: {
    order: 1,
  },
  name: {
    order: 1,
  },
  type: {
    label: t('redis.config_card.common_fields.type_label'),
    hidden: true,
    type: 'hidden',
  },
  created_at: {
    label: t('redis.config_card.common_fields.created_at_label'),
    formatter: formatUnixTimeStamp,
    order: 2,
  },
  updated_at: {
    label: t('redis.config_card.common_fields.updated_at_label'),
    formatter: formatUnixTimeStamp,
    order: 3,
  },
}

const props = defineProps({
  configFields: {
    type: Object as PropType<FlattendRedisConfigurationFields>,
    required: true,
  },
  pluginRedisFields: {
    type: Array<Field>,
    required: true,
  },
})

const itemHasValue = (item: any): boolean => {
  return item !== null && item !== undefined
}

const fieldEncrptyed = (key: string, val: any) => {
  if (!itemHasValue(val)) {
    return 'text'
  }
  return ['password', 'sentinel_password'].includes(key) ? 'password' : 'text'
}

const { convertKeyToTitle } = useStringHelpers()

const configDetails = computed(() => {
  return Object.entries(props.configFields).map(([key, value]) => {
    return {
      key,
      label: standardEntityfields[key]?.label ?? convertKeyToTitle(key),
      value: standardEntityfields[key]?.formatter ? standardEntityfields[key].formatter(value) : value,
      type: standardEntityfields[key]?.type ?? fieldEncrptyed(key, value),
      order: standardEntityfields[key]?.order ?? 100,
    // attrs: value.attrs,
    }
  }).sort((a, b) => a.order - b.order).filter((item) => item.type !== 'hidden')
})

const nonStandardConfigDetails = composables.useRedisNonStandardFields(props.configFields, props.pluginRedisFields)

const allConfigDetails = computed(() => configDetails.value.concat(nonStandardConfigDetails as any[]))

</script>

<style lang="scss" scoped>
.partial-config-card {
  display: flex;
  flex-direction: column;
  padding: var(--kui-space-70, $kui-space-70);

  .partial-config-card-row {
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-disabled, $kui-color-border-disabled);
    color: var(--kui-color-text, $kui-color-text);
    display: flex;

    .config-card-row-label {
      align-items: center;
      flex: 1;
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      padding: var(--kui-space-50, $kui-space-50) 0 var(--kui-space-60, $kui-space-60);

      .label-text {
        line-height: var(--kui-line-height-40, $kui-line-height-40);
      }
    }

    .config-card-row-value {
      align-items: center;
      display: flex;
      flex: 1;
      font-family: var(--kui-font-family-code, $kui-font-family-code);
      font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
      padding-left: var(--kui-space-60, $kui-space-60);

      .value-text {
        line-height: var(--kui-line-height-30, $kui-line-height-30);
      }
    }
  }
}
</style>
