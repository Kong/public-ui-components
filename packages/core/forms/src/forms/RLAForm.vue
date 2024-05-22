<template>
  <div class="rla-form-basic-fields">
    <VueFormGenerator
      :model="formModel"
      :options="formOptions"
      :schema="scopingSchema"
      @model-updated="(value: any, model: string) => onModelUpdated(value, model)"
    />

    <KCard
      class="rla-form-request-limits"
    >
      <template #title>
        <KLabel
          class="rla-form-request-limits-title"
          for="rla-form-request-limits-legend"
          :info="t('rla.request_limits.help')"
          required
          :tooltip-attributes="{
            maxWidth: '300',
            placement: 'top',
            tooltipId: 'rla-form-request-limits-tooltip'
          }"
        >
          {{ t('rla.request_limits.title') }}
        </KLabel>
        <div class="rla-form-request-limits-subtitle">
          {{ t('rla.request_limits.subtitle') }}
        </div>
      </template>

      <div class="rla-form-request-limits-items">
        <div
          v-for="(requestLimit, index) in requestLimits"
          :key="index.toString()"
        >
          <KLabel
            :for="`rla-form-request-limits-item-${index}-legend`"
          >
            {{ t('rla.request_limits.label', { index: index + 1 }) }}
          </KLabel>
          <div class="rla-form-request-limits-row">
            <legend
              :id="`rla-form-request-limits-item-${index}-legend`"
              class="rla-form-request-limits-inputs"
            >
              <KInput
                :model-value="requestLimit.limit && requestLimit.limit.toString()"
                :placeholder="t('rla.request_limits.request_number')"
                type="number"
                @update:model-value="(value: string) => updateRequestLimitLimit(index, Number.parseInt(value))"
              />
              <div>{{ t('rla.request_limits.interval_determiner') }}</div>
              <KInput
                :model-value="requestLimit.windowSize && requestLimit.windowSize.toString()"
                :placeholder="t('rla.request_limits.time_interval')"
                type="number"
                @update:model-value="(value: string) => updateRequestLimitWindowSize(index, Number.parseInt(value))"
              />
              <div>{{ t('rla.request_limits.seconds') }}</div>
            </legend>

            <div class="rla-form-request-limits-actions">
              <KButton
                appearance="tertiary"
                :disabled="requestLimits.length <= 1"
                @click="() => removeRequestLimit(index)"
              >
                <RemoveIcon />
              </KButton>

              <KButton
                appearance="tertiary"
                @click="() => addRequestLimit(index)"
              >
                <AddIcon />
              </KButton>
            </div>
          </div>
        </div>
      </div>

      <div class="rla-form-request-limits-examples">
        <div>Examples:</div>
        <ol>
          <li
            v-for="(example, i) in EXAMPLES"
            :key="`rla-example-${i}`"
          >
            {{ example.description }}<br>Request number: <code>{{ example.config.limit }}</code>, Time interval: <code>{{ example.config.window_size }}</code>, Window type: <code>{{ example.config.window_type }}</code>
          </li>
        </ol>
      </div>
    </KCard>

    <KSelect
      v-model="identifier"
      class="rla-form-identifiers"
      :items="identifierSelectItems"
      :label="t('rla.identifiers.label')"
      :label-attributes="{
        tooltipAttributes: {
          maxWidth: '300',
          placement: 'top',
          tooltipId: 'rla-form-request-limits-tooltip',
        },
      }"
      required
      @selected="(item: any) => props.onModelUpdated(item.value, 'config-identifier')"
    >
      <template #label-tooltip>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="identifierField && identifierField.help" />
      </template>
    </KSelect>

    <div>
      <KLabel
        for="rla-form-error-legend"
        :info="t('rla.error_message.help')"
        required
        :tooltip-attributes="{
          maxWidth: '300',
          placement: 'top',
          tooltipId: 'rla-form-error-tooltip'
        }"
      >
        {{ t('rla.error_message.label') }}
      </KLabel>
      <legend
        id="rla-form-error-legend"
        class="rla-form-error-inputs"
      >
        <KInput
          class="input-error-code"
          :model-value="errorCode && errorCode.toString()"
          :placeholder="t('rla.error_message.code_placeholder')"
          type="number"
          @update:model-value="(value: string) => onModelUpdated(Number.parseInt(value), 'config-error_code')"
        />
        <div>:</div>
        <KInput
          :model-value="errorMessage"
          :placeholder="t('rla.error_message.message_placeholder')"
          @update:model-value="(value: string) => onModelUpdated(value, 'config-error_message')"
        />
      </legend>
    </div>
  </div>

  <KCollapse
    v-model="advancedCollapsed"
    :trigger-label="t('rla.view_advanced_fields')"
  >
    <VueFormGenerator
      :model="formModel"
      :options="formOptions"
      :schema="advancedSchema"
      @model-updated="(value: any, model: string) => onModelUpdated(value, model)"
    />
  </KCollapse>
</template>

<script lang="ts" setup>
import { createI18n } from '@kong-ui-public/i18n'
import { AddIcon, RemoveIcon } from '@kong/icons'
import type { SelectItem } from '@kong/kongponents'
import cloneDeep from 'lodash-es/cloneDeep'
import { computed, ref } from 'vue'
import english from '../locales/en.json'

const EXAMPLES = [
  {
    description: 'A fixed limit of 500 requests per hour resetting sharply on the hour, ensuring no user can exceed this limit.',
    config: {
      limit: 500,
      window_size: 3600,
      window_type: 'fixed',
    },
  },
  {
    description: 'Users are allowed 200 requests per 30 minutes, resetting exactly on the 30 minute mark with no carryover of unused limits.',
    config: {
      limit: 200,
      window_size: 1800,
      window_type: 'fixed',
    },
  },
  {
    description: 'A strict limit of 5000 requests per day resetting promptly at midnight, preventing any burst traffic or inconsistent user experiences.',
    config: {
      limit: 500,
      window_size: 86400,
      window_type: 'fixed',
    },
  },
  {
    description: 'Maximum of 100 requests every rolling hour, continuously adjusting the count over the course of the hour. No hard limit or known reset.',
    config: {
      limit: 100,
      window_size: 3600,
      window_type: 'sliding',
    },
  },
  {
    description: 'Each user can make up to 300 requests in any rolling 30 minute period, with older requests dropping off as new requests are made.',
    config: {
      limit: 300,
      window_size: 1800,
      window_type: 'sliding',
    },
  },
  {
    description: 'Each user is allowed 500 requests per hour. \nIf the limit is exceeded and the user receives a 429 error, each additional request within the sliding window (hour) \nwill extend the wait time by about 12 minutes, continuously adjusting as new requests are made.',
    config: {
      limit: 500,
      window_size: 3600,
      window_type: 'sliding',
      disable_penalty: false,
    },
  },
]

interface RequestLimit {
  limit?: number
  windowSize?: number
}

const { t } = createI18n<typeof english>('en-us', english)

const props = defineProps<{
  formSchema: any
  formModel: Record<string, any>
  formOptions: any
  onModelUpdated: (value: any, model: string) => void
  isEditing?: boolean
}>()

const scopingSchema = computed(() => {
  const selectionGroup = props.formSchema?.fields?.find((field: any) => field.model === 'selectionGroup')
  if (!selectionGroup) {
    return undefined
  }

  return {
    fields: [{
      ...selectionGroup,
      horizontalRadios: true,
    }],
  }
})

const advancedSchema = computed(() => {
  const omittedFields = new Set([
    'selectionGroup',
    ...['identifier', 'limit', 'window_size', 'error_code', 'error_message']
      .map((field) => `config-${field}`),
  ])

  return {
    fields: props.formSchema?.fields
      ?.filter((field: any) => typeof field.model === 'string' && !omittedFields.has(field.model))
      ?.map((field: any) => {
        if (field.model === 'config-redis-cluster_addresses') {
          return {
            ...field,
            hint: 'e.g. localhost:6379',
          }
        }
        return field
      }),
  }
})

const identifierField = computed(() => props.formSchema?.fields?.find((field: any) => field.model === 'config-identifier'))

const identifierSelectItems = computed<SelectItem[]>(() =>
  ((props.formSchema?.fields?.find((field: any) => field.model === 'config-identifier')?.values ?? []) as string[])
    .map((value: string) => ({
      label: t(`rla.identifiers.options.${value}` as any),
      value,
    })),
)

const advancedCollapsed = ref(true)

const requestLimits = computed<RequestLimit[]>(() => {
  const modelValue = props.formModel['config-limit']?.map((limit: number, index: number) => ({
    limit,
    windowSize: props.formModel?.['config-window_size']?.[index],
  }))

  if (!Array.isArray(modelValue) || modelValue.length === 0) {
    return [{ limit: undefined, windowSize: undefined }]
  }

  return modelValue
})

const identifier = computed<string | undefined>(() => props.formModel?.['config-identifier'] ?? props.formSchema?.fields?.find((field: any) => field.model === 'config-identifier')?.default)
const errorCode = computed<number | undefined>(() => props.formModel?.['config-error_code'] ?? props.formSchema?.fields?.find((field: any) => field.model === 'config-error_code')?.default)
const errorMessage = computed<string | undefined>(() => props.formModel?.['config-error_message'] ?? props.formSchema?.fields?.find((field: any) => field.model === 'config-error_message')?.default)

const updateRequestLimitLimit = (index: number, limit?: number) => {
  const limits = cloneDeep(props.formModel?.['config-limit'] ?? [])
  limits[index] = limit
  props.onModelUpdated(limits, 'config-limit')
}

const updateRequestLimitWindowSize = (index: number, windowSize?: number) => {
  const windowSizes = cloneDeep(props.formModel?.['config-window_size'] ?? [])
  windowSizes[index] = windowSize
  props.onModelUpdated(windowSizes, 'config-window_size')
}

const addRequestLimit = (index: number) => {
  const limits = cloneDeep(props.formModel?.['config-limit'] ?? [])
  const windowSizes = cloneDeep(props.formModel?.['config-window_size'] ?? [])
  if (limits.length === 0) {
    limits.push(undefined)
  }
  if (windowSizes.length === 0) {
    windowSizes.push(undefined)
  }
  limits.splice(index + 1, 0, undefined)
  windowSizes.splice(index + 1, 0, undefined)
  props.onModelUpdated(limits, 'config-limit')
  props.onModelUpdated(windowSizes, 'config-window_size')
}

const removeRequestLimit = (index: number) => {
  if (requestLimits.value.length > 1) {
    const limits = cloneDeep(props.formModel?.['config-limit'] ?? [])
    const windowSizes = cloneDeep(props.formModel?.['config-window_size'] ?? [])
    if (limits.length === 0) {
      limits.push(undefined)
    }
    if (windowSizes.length === 0) {
      windowSizes.push(undefined)
    }
    limits.splice(index, 1)
    windowSizes.splice(index, 1)
    props.onModelUpdated(limits, 'config-limit')
    props.onModelUpdated(windowSizes, 'config-window_size')
  }
}
</script>

<style lang="scss" scoped>
.rla-form-basic-fields {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
  margin-bottom: $kui-space-80;

  .rla-form-request-limits {
    &-title {
      font-size: $kui-font-size-40;
      font-weight: $kui-font-weight-bold;
    }

    &-subtitle {
      color: $kui-color-text-neutral;
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-regular;
    }

    &-items {
      display: flex;
      flex-direction: column;
      gap: $kui-space-50;
    }

    &-row,
    &-inputs,
    &-actions {
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: $kui-space-50;
      justify-content: space-between;
    }

    &-inputs {
      flex-grow: 1;
    }

    &-actions {
      flex-shrink: 0;
    }

    :deep(.form-group) {
      margin-bottom: 0 !important;
    }

    &-examples {
      color: $kui-color-text-neutral;
      margin-bottom: $kui-space-50;
      margin-top: $kui-space-50;

      ol {
        margin-bottom: 0;
        margin-top: 0;
      }
    }
  }

  .rla-form-identifiers {
    :deep(.k-tooltip p) {
      margin: 0;
    }
  }

  .rla-form-error-inputs {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: $kui-space-50;
    justify-content: space-between;

    .input-error-code {
      max-width: 200px;
      min-width: 100px;
      width: 20%;
    }
  }
}
</style>
