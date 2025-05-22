<template>
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
        <RadioField
          :items="availableWindowTypes"
          :label="t('rla.window_type.label')"
          name="window_type"
          @update:model-value="selectedUseCase = undefined"
        />
      </div>

      <div class="rla-form-request-limits-items">
        <div
          v-for="(requestLimit, index) in requestLimits"
          :key="getKey(requestLimit, index)"
        >
          <KLabel :for="`rla-form-request-limits-item-${index}-legend`">
            {{ t('rla.request_limits.label_index', { index: index + 1 }) }}
          </KLabel>

          <div class="rla-form-request-limits-row">
            <legend
              :id="`rla-form-request-limits-item-${index}-legend`"
              class="rla-form-request-limits-inputs"
            >
              <NumberField
                :name="`$.config.limit.${index}`"
                :placeholder="t('rla.request_limits.request_number')"
              />
              <div>{{ t('rla.request_limits.interval_determiner') }}</div>
              <NumberField
                :name="`$.config.window_size.${index}`"
                :placeholder="t('rla.request_limits.time_interval')"
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
</template>

<script lang="ts" setup>
import { AddIcon, RemoveIcon } from '@kong/icons'
import { get } from 'lodash-es'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../locales/en.json'
import { computed, nextTick, ref } from 'vue'
import { useFormShared, useItemKeys } from '../shared/composables'
import RadioField from '../shared/RadioField.vue'
import NumberField from '../shared/NumberField.vue'

const { t } = createI18n<typeof english>('en-us', english)

interface RequestLimit {
  limit?: number | null
  windowSize?: number | null
}

type WindowType = 'fixed' | 'sliding'

interface FormData {
  config?: {
    window_type: WindowType
    limit?: Array<number | null>
    window_size?: Array<number | null>
  }
}

interface UseCase {
  label: string
  description: string
  config: {
    limit: number
    window_size:number
  }
}

const { formData, getSelectItems, getSchema } = useFormShared<FormData>()

const requestLimits = computed<RequestLimit[]>(() => {
  const modelValue = formData.config?.limit?.map((limit, index) => {
    return {
      limit,
      windowSize: formData.config?.window_size?.[index],
    }
  })

  if (!Array.isArray(modelValue) || modelValue.length === 0) {
    return [{ limit: null, windowSize: null }]
  }

  return modelValue
})

const { getKey } = useItemKeys('request-limits', requestLimits)

const addRequestLimit = (index: number) => {
  selectedUseCase.value = undefined
  if (!formData.config) return
  if (!formData.config.limit?.length) {
    formData.config.limit = [null]
  }
  if (!formData.config.window_size?.length) {
    formData.config.window_size = [null]
  }
  formData.config.limit.splice(index + 1, 0, null)
  formData.config.window_size.splice(index + 1, 0, null)
}

const removeRequestLimit = (index: number) => {
  if (!formData.config) return
  formData.config.limit!.splice(index, 1)
  formData.config.window_size!.splice(index, 1)
}

const windowTypePath = 'config.window_type'
const defaultValue = getSchema(windowTypePath)?.default
const windowType = computed<WindowType>(() => get(formData, windowTypePath)!)

const availableWindowTypes = computed(() => {
  return getSelectItems(windowTypePath)
    .sort((a, b) => {
      return a.value === defaultValue ? -1 : b.value === defaultValue ? 1 : 0
    })
})

const selectedUseCase = ref<string | undefined>()

const USE_CASES: Record<string, UseCase[]> = {
  fixed: [
    {
      label: t('rla.use_cases.fixed.hourly_500.label'),
      description: t('rla.use_cases.fixed.hourly_500.description'),
      config: {
        limit: 500,
        window_size: 3600,
      },
    },
    {
      label: t('rla.use_cases.fixed.half_hourly_200.label'),
      description: t('rla.use_cases.fixed.half_hourly_200.description'),
      config: {
        limit: 200,
        window_size: 1800,
      },
    },
    {
      label: t('rla.use_cases.fixed.daily_500.label'),
      description: t('rla.use_cases.fixed.daily_500.description'),
      config: {
        limit: 500,
        window_size: 86400,
      },
    },
  ],
  sliding: [
    {
      label: t('rla.use_cases.sliding.hourly_100.label'),
      description: t('rla.use_cases.sliding.hourly_100.description'),
      config: {
        limit: 100,
        window_size: 3600,
      },
    },
    {
      label: t('rla.use_cases.sliding.half_hourly_300.label'),
      description: t('rla.use_cases.sliding.half_hourly_300.description'),
      config: {
        limit: 300,
        window_size: 1800,
      },
    },
    {
      label: t('rla.use_cases.sliding.hourly_500.label'),
      description: t('rla.use_cases.sliding.hourly_500.description'),
      config: {
        limit: 500,
        window_size: 3600,
        // disable_penalty: false, // not used yet
      },
    },
  ],
}

const filteredUseCases = computed<UseCase[]>(() => {
  if (Object.prototype.hasOwnProperty.call(USE_CASES, windowType.value)) {
    return USE_CASES[windowType.value]
  }

  return []
})

const toggleUseCase = (useCase: UseCase, useCaseKey: string) => {
  if (useCaseKey === selectedUseCase.value) {
    nextTick(() => {
      selectedUseCase.value = undefined
    })
    formData.config!.limit = []
    formData.config!.window_size = []
    return
  }
  nextTick(() => {
    selectedUseCase.value = useCaseKey
  })
  formData.config!.limit = [useCase.config.limit]
  formData.config!.window_size = [useCase.config.window_size]
}
</script>

<style lang="scss" scoped>
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
</style>
