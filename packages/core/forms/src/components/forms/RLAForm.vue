<template>
  <div class="rla-form-basic-fields">
    <VueFormGenerator
      :model="formModel"
      :options="formOptions"
      :schema="globalFields"
      @model-updated="(value: any, model: string) => onModelUpdated(value, model)"
    />

    <KCard class="rla-form-request-limits">
      <template #title>
        <KLabel
          class="rla-form-request-limits-title"
          for="rla-form-request-limits-legend"
          required
        >
          {{ t('rla.request_limits.title') }}
        </KLabel>

        <div class="rla-form-request-limits-subtitle">
          {{ t('rla.request_limits.subtitle') }}
        </div>
      </template>

      <div class="rla-form-request-limits-content">
        <div class="rla-form-window-type">
          <KLabel
            class="rla-form-window-type-label"
            :tooltip-attributes="{
              maxWidth: '300',
              placement: 'top',
            }"
          >
            {{ t('rla.window_type.label') }}

            <template #tooltip>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-html="t('rla.window_type.help')" />
            </template>
          </KLabel>

          <div class="rla-form-window-type-radios">
            <KRadio
              v-for="wt in availableWindowTypes"
              :key="`window-type-${wt}`"
              :model-value="windowType"
              :name="wt"
              :selected-value="wt"
              @update:model-value="updateWindowType"
            >
              {{ t(`rla.window_type.options.${wt}` as Parameters<typeof t>[0]) }}
            </KRadio>
          </div>
        </div>

        <div class="rla-form-request-limits-items">
          <div
            v-for="(requestLimit, index) in requestLimits"
            :key="index.toString()"
          >
            <KLabel :for="`rla-form-request-limits-item-${index}-legend`">
              {{ t('rla.request_limits.label_index', { index: index + 1 }) }}
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

        <div
          v-if="filteredUseCases.length > 0"
          class="rla-form-request-limits-examples"
        >
          <div>{{ t('rla.start_with_a_use_case') }}</div>
          <div class="rla-form-request-limits-examples-badges">
            <KTooltip
              v-for="(useCase, i) in filteredUseCases"
              :key="`use-case-${i}`"
              max-width="300"
            >
              <KBadge
                :appearance="selectedUseCase === `${windowType}-${i}` ? 'info' : 'decorative'"
                class="rla-form-request-limits-examples-badge"
                @click="() => toggleUseCase(useCase, `${windowType}-${i}`)"
              >
                {{ useCase.label }}
              </KBadge>

              <template #content>
                <div>{{ useCase.description }}</div>
                <br>
                <div>{{ t('rla.request_limits.label') }}: {{ useCase.config.limit }}</div>
                <div>{{ t('rla.request_limits.time_interval') }}: {{ useCase.config.window_size }}</div>
              </template>
            </KTooltip>
          </div>
        </div>
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
      :schema="advancedSchema.endsWithStrategy"
      @model-updated="(value: any, model: string) => onModelUpdated(value, model)"
    />

    <div
      v-if="formModel['config-strategy'] === 'redis'"
      class="rla-form-redis-card"
    >
      <VueFormGenerator
        :model="formModel"
        :options="formOptions"
        :schema="advancedSchema.redis"
        @model-updated="(value: any, model: string) => onModelUpdated(value, model)"
        @partial-toggled="onPartialToggled"
        @show-new-partial-modal="showNewPartialModal"
      />
    </div>

    <VueFormGenerator
      :class="{ 'rla-last-vfg': formModel['config-strategy'] !== 'redis' }"
      :model="formModel"
      :options="formOptions"
      :schema="advancedSchema.afterStrategy"
      @model-updated="(value: any, model: string) => onModelUpdated(value, model)"
    />
  </KCollapse>
</template>

<script lang="ts" setup>
import { createI18n } from '@kong-ui-public/i18n'
import { AddIcon, RemoveIcon } from '@kong/icons'
import type { SelectItem } from '@kong/kongponents'
import cloneDeep from 'lodash-es/cloneDeep'
import { computed, nextTick, provide, ref, useSlots } from 'vue'
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '../../const'
import english from '../../locales/en.json'
import type { AutofillSlot } from '../../types'

interface UseCase {
  label: string
  description: string
  config: {
    limit: number
    window_size:number
  }
}

// Provide AUTOFILL_SLOT
provide<AutofillSlot | undefined>(AUTOFILL_SLOT, useSlots()?.[AUTOFILL_SLOT_NAME])

const USE_CASES: Record<string, UseCase[]> = {
  fixed: [
    {
      label: '500 requests every hour',
      description: 'A fixed limit of 500 requests per hour resetting sharply on the hour, ensuring no user can exceed this limit.',
      config: {
        limit: 500,
        window_size: 3600,
      },
    },
    {
      label: '200 requests every 30 minutes',
      description: 'Users are allowed 200 requests per 30 minutes, resetting exactly on the 30 minute mark with no carryover of unused limits.',
      config: {
        limit: 200,
        window_size: 1800,
      },
    },
    {
      label: '500 requests every day',
      description: 'A strict limit of 5000 requests per day resetting promptly at midnight, preventing any burst traffic or inconsistent user experiences.',
      config: {
        limit: 500,
        window_size: 86400,
      },
    },
  ],
  sliding: [
    {
      label: '100 requests every hour',
      description: 'Maximum of 100 requests every rolling hour, continuously adjusting the count over the course of the hour. No hard limit or known reset.',
      config: {
        limit: 100,
        window_size: 3600,
      },
    },
    {
      label: '300 requests every 30 minutes',
      description: 'Each user can make up to 300 requests in any rolling 30 minute period, with older requests dropping off as new requests are made.',
      config: {
        limit: 300,
        window_size: 1800,
      },
    },
    {
      label: '500 requests every hour',
      description: 'Each user is allowed 500 requests per hour. \nIf the limit is exceeded and the user receives a 429 error, each additional request within the sliding window (hour) \nwill extend the wait time by about 12 minutes, continuously adjusting as new requests are made.',
      config: {
        limit: 500,
        window_size: 3600,
        // disable_penalty: false, // not used yet
      },
    },
  ],
}

/**
 * These are fields that we will take care of out of the VFG
 */
const OMITTED_MODEL_KEYS_FULL_MATCH = new Set([
  'selectionGroup', 'enabled',
  ...['identifier', 'limit', 'window_size', 'error_code', 'error_message']
    .map((field) => `config-${field}`),
])

const shouldOmit = (modelKey?: string) => {
  if (modelKey === undefined) {
    return false
  }

  return OMITTED_MODEL_KEYS_FULL_MATCH.has(modelKey)
}

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
  onPartialToggled: (field: string, model: any) => void
  showNewPartialModal: () => void
  isEditing?: boolean
}>()

const globalFields = computed(() => {
  const selectionGroup = props.formSchema?.fields?.find((field: any) => field.type === 'selectionGroup' && field.model === 'selectionGroup')

  const enableSwitch = props.formSchema?.fields.find((field: any) => field.model === 'enabled')

  return { fields: [enableSwitch, selectionGroup].filter(Boolean) }
})

const advancedSchema = computed(() => {
  const withoutOmittedFields = props.formSchema?.fields?.filter((field: any) => !shouldOmit(field.model)) ?? []
  const endsWithStrategy: any[] = []
  const redis: any[] = []
  const afterStrategy: any[] = []

  let strategyVisited = false

  for (const field of withoutOmittedFields) {
    const model = field.model
    if (model === undefined) {
      continue
    }

    if (model.startsWith('config-redis-')) {
      if (field.model === 'config-redis-cluster_addresses' || field.model === 'config-redis-sentinel_addresses') {
        field.inputAttributes.help = t('rla.redis.address_example')
      }

      redis.push(field)
      continue
    }

    if (!strategyVisited) {
      endsWithStrategy.push(field)
    } else {
      afterStrategy.push(field)
    }

    if (field.model === 'config-strategy') {
      strategyVisited = true
    }
  }

  return {
    endsWithStrategy: { fields: endsWithStrategy },
    redis: { fields: [{ fields: redis, id: '_redis', model: 'redis_partial' }] },
    afterStrategy: { fields: afterStrategy },
  }
})

const filteredUseCases = computed<UseCase[]>(() => {
  const windowType = props.formModel['config-window_type']
  if (Object.prototype.hasOwnProperty.call(USE_CASES, windowType)) {
    return USE_CASES[windowType]
  }

  return []
})

const identifierField = computed(() => props.formSchema?.fields?.find((field: any) => field.model === 'config-identifier'))

const identifierSelectItems = computed<SelectItem[]>(() =>
  ((props.formSchema?.fields?.find((field: any) => field.model === 'config-identifier')?.values ?? []) as string[])
    .map((value: string) => ({
      label: t(`rla.identifiers.options.${value}` as any),
      value,
    })),
)

const selectedUseCase = ref<string | undefined>()
const advancedCollapsed = ref(true)

const windowType = computed<string>(() =>
  props.formModel['config-window_type'] ?? props.formSchema?.fields
    ?.find((field: any) => field.model === 'config-window_type')?.default,
)

const availableWindowTypes = computed<string[]>(() => {
  const defaultValue = props.formSchema?.fields?.find((field: any) => field.model === 'config-window_type')?.default

  return (props.formSchema?.fields
    ?.find((field: any) => field.model === 'config-window_type')?.values ?? [])
    .sort((a: string, b: string) => {
      return a === defaultValue ? -1 : b === defaultValue ? 1 : 0
    })
})

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

const identifier = computed<string | undefined>(() =>
  props.formModel?.['config-identifier'] ?? props.formSchema?.fields
    ?.find((field: any) => field.model === 'config-identifier')?.default,
)
const errorCode = computed<number | undefined>(() =>
  props.formModel?.['config-error_code'] ?? props.formSchema?.fields
    ?.find((field: any) => field.model === 'config-error_code')?.default,
)
const errorMessage = computed<string | undefined>(() =>
  props.formModel?.['config-error_message'] ?? props.formSchema?.fields
    ?.find((field: any) => field.model === 'config-error_message')?.default,
)

const toggleUseCase = (useCase: UseCase, useCaseKey: string) => {
  if (useCaseKey === selectedUseCase.value) {
    // If selected, clear the list
    props.onModelUpdated([], 'config-limit')
    props.onModelUpdated([], 'config-window_size')
    nextTick(() => {
      selectedUseCase.value = undefined
    })
    return
  }
  props.onModelUpdated([useCase.config.limit], 'config-limit')
  props.onModelUpdated([useCase.config.window_size], 'config-window_size')
  nextTick(() => {
    selectedUseCase.value = useCaseKey
  })
}

const updateWindowType = (newType: string | number | boolean | object | null) => {
  if (selectedUseCase.value !== undefined) {
    selectedUseCase.value = undefined
  }
  if (newType !== null) {
    props.onModelUpdated(newType.toString(), 'config-window_type')
  }
}

const updateRequestLimitLimit = (index: number, limit?: number) => {
  if (selectedUseCase.value !== undefined) {
    selectedUseCase.value = undefined
  }
  const limits = cloneDeep(props.formModel?.['config-limit'] ?? [])
  limits[index] = limit
  props.onModelUpdated(limits, 'config-limit')
}

const updateRequestLimitWindowSize = (index: number, windowSize?: number) => {
  if (selectedUseCase.value !== undefined) {
    selectedUseCase.value = undefined
  }
  const windowSizes = cloneDeep(props.formModel?.['config-window_size'] ?? [])
  windowSizes[index] = windowSize
  props.onModelUpdated(windowSizes, 'config-window_size')
}

const addRequestLimit = (index: number) => {
  if (selectedUseCase.value !== undefined) {
    selectedUseCase.value = undefined
  }
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
    if (selectedUseCase.value !== undefined) {
      selectedUseCase.value = undefined
    }
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
    .rla-form-request-limits-content {
      display: flex;
      flex-direction: column;
      gap: $kui-space-50;
    }

    .rla-form-window-type {
      &-radios {
        display: flex;
        flex-direction: row;
        gap: $kui-space-70;

        :deep(.radio-label) {
          font-size: $kui-font-size-30;
          font-weight: $kui-font-weight-regular;
        }
      }
    }

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
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: $kui-space-40;

      &-badges {
        display: flex;
        flex-direction: row;
        gap: $kui-space-40;

        :deep(.rla-form-request-limits-examples-badge) {
          cursor: pointer;
        }
      }
    }
  }

  .rla-form-window-type-label,
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

.rla-form-redis-card {
  margin: $kui-space-50 0;
}

.rla-last-vfg {
  margin-top: $kui-space-80;
}
</style>
