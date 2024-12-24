<template>
  <div class="partial-config-card">
    <div
      v-for="{key, label, value, type} in allConfigDetails"
      :key="key"
      class="partial-config-card-row"
    >
      <div class="config-card-row-label">
        <div class="label-text">
          {{ label }}
        </div>
      </div>
      <div class="config-card-row-value">
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

const props = defineProps({
  configFields: {
    type: Object as PropType<any>,
    required: true,
  },
  pluginRedisFields: {
    type: Array<Field>,
    required: true,
  },
  redisMeta: {
    type: Object as PropType<any>,
    required: false,
    default: () => ({}),
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

const configDetails = Object.entries(props.configFields).map(([key, value]) => {
  return {
    key,
    label: convertKeyToTitle(key),
    value,
    type: fieldEncrptyed(key, value),
    // attrs: value.attrs,
  }
})

const nonStandardConfigDetails = composables.useRedisNonStandardFields(props.configFields, props.pluginRedisFields)

const allConfigDetails = configDetails.concat(nonStandardConfigDetails)

</script>

<style lang="scss">
.partial-config-card {
  display: flex;
  flex-direction: column;
  padding: $kui-space-70;

  .partial-config-card-row {
    border-bottom: $kui-border-width-10 solid $kui-color-border-disabled;
    color: $kui-color-text;
    display: flex;

    .config-card-row-label {
      align-items: center;
      flex: 1;
      font-weight: $kui-font-weight-semibold;
      padding: $kui-space-50 0 $kui-space-60;

      .label-text {
        line-height: $kui-line-height-40;
      }
    }
    .config-card-row-value {
      align-items: center;
      display: flex;
      flex: 1;
      font-family: var(--kui-font-family-code, $kui-font-family-code);
      font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
      padding-left: $kui-space-60;

      .value-text {
        line-height: $kui-line-height-30;
      }
    }
  }
}
</style>
