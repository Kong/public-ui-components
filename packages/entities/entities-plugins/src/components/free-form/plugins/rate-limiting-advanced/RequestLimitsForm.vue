<template>
  <KCard class="rla-form-request-limits">
    <template #title>
      <KLabel
        class="rla-form-request-limits-title"
        for="rla-form-request-limits-legend"
        required
      >
        {{ t('sp.request_limits.title') }}
      </KLabel>

      <div class="rla-form-request-limits-subtitle">
        {{ t('sp.request_limits.subtitle') }}
      </div>
    </template>

    <div class="rla-form-request-limits-content">
      <div class="rla-form-window-type">
        <RadioField
          card
          :items="availableWindowTypes"
          :label="t('sp.window_type.label')"
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
            {{ t('sp.request_limits.label_index', { index: index + 1 }) }}
          </KLabel>

          <div class="rla-form-request-limits-row">
            <legend
              :id="`rla-form-request-limits-item-${index}-legend`"
              class="rla-form-request-limits-inputs"
            >
              <NumberField
                :name="`$.config.limit.${index}`"
                :placeholder="t('sp.request_limits.custom')"
              />
              <div>{{ t('sp.request_limits.interval_determiner') }}</div>
              <NumberField
                :name="`$.config.window_size.${index}`"
                :placeholder="t('sp.request_limits.custom')"
              />
              <div>{{ t('sp.request_limits.seconds') }}</div>
            </legend>

            <!-- One limit is the minimum, so a lone row has nothing to remove. -->
            <KButton
              v-if="requestLimits.length > 1"
              appearance="tertiary"
              :aria-label="t('sp.request_limits.remove_limit', { index: index + 1 })"
              class="rla-form-request-limits-remove"
              :data-testid="`rla-form-remove-limit-${index}`"
              icon
              @click="() => removeRequestLimit(index)"
            >
              <CloseIcon />
            </KButton>
          </div>

          <!--
            `config.limit` is expressible element-wise, so the expression belongs
            to the row rather than to the array. `ExpressionEditor` rather than
            `ExpressionField`, because this form lays out the value inputs itself
            — paired with `window_size` — instead of letting the field render them.
          -->
          <ExpressionEditor
            class="rla-form-request-limits-expression"
            :name="`$.config.limit.${index}`"
          />
        </div>
      </div>

      <div
        v-if="filteredUseCases.length > 0"
        class="rla-form-request-limits-examples"
      >
        <div>{{ t('sp.start_with_a_use_case') }}</div>
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
              <div>{{ t('sp.request_limits.label') }}: {{ useCase.config.limit }}</div>
              <div>{{ t('sp.request_limits.time_interval') }}: {{ useCase.config.window_size }}</div>
            </template>
          </KTooltip>
        </div>
      </div>

      <div class="rla-form-request-limits-add">
        <KButton
          appearance="tertiary"
          data-testid="rla-form-add-limit"
          @click="addRequestLimit"
        >
          <AddIcon />
          {{ t('sp.request_limits.add_limit') }}
        </KButton>
      </div>
    </div>
  </KCard>
</template>

<script lang="ts" setup>
import { AddIcon, CloseIcon } from '@kong/icons'
import { get } from 'lodash-es'
import { computed, nextTick, ref } from 'vue'
import useI18n from '../../../../composables/useI18n'
import { useFormShared, useItemKeys } from '../../shared/composables'
import ExpressionEditor from '../../shared/ExpressionEditor.vue'
import RadioField from '../../shared/RadioField.vue'
import NumberField from '../../shared/NumberField.vue'
import type { EmptyValue } from '../../shared/types'

const { i18n: { t } } = useI18n()

interface RequestLimit {
  limit?: number | EmptyValue
  windowSize?: number | EmptyValue
}

type WindowType = 'fixed' | 'sliding'

interface FormData {
  config?: {
    window_type: WindowType
    limit?: Array<number | EmptyValue>
    window_size?: Array<number | EmptyValue>
  }
  expressions?: {
    // The array itself can be unset, and each slot can be empty for a row that
    // has no expression while a later row does.
    limit?: Array<string | EmptyValue> | EmptyValue
  } | EmptyValue
}

interface UseCase {
  label: string
  description: string
  config: {
    limit: number
    window_size: number
  }
}

const { formData, getSchema, getEmptyOrDefault, getEmptyValue } = useFormShared<FormData>()

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

/**
 * The Gateway pairs `expressions.limit` with `config.limit` by position, so any
 * insert or removal in one has to happen in the other.
 *
 * Only runs when the twin array already exists: without it no row has an
 * expression, nothing can drift, and creating it here would submit a run of
 * empty slots.
 */
const alignExpressionLimits = (mutate: (limits: Array<string | EmptyValue>) => void) => {
  const limits = formData.expressions?.limit
  if (Array.isArray(limits)) {
    mutate(limits)
  }
}

const addRequestLimit = () => {
  selectedUseCase.value = undefined
  if (!formData.config) return
  const emptyLimit = getEmptyOrDefault<number>('config.limit.0')
  const emptyWindowSize = getEmptyOrDefault<number>('config.window_size.0')
  // The list always shows at least one row, even while the arrays are still
  // empty — materialize that row before appending, so the visible count grows.
  if (!formData.config.limit?.length) {
    formData.config.limit = [emptyLimit]
    formData.config.window_size = [emptyWindowSize]
  }
  formData.config.limit.push(emptyLimit)
  formData.config.window_size!.push(emptyWindowSize)
  alignExpressionLimits((limits) => limits.push(getEmptyValue()))
}

const removeRequestLimit = (index: number) => {
  if (!formData.config) return
  formData.config.limit!.splice(index, 1)
  formData.config.window_size!.splice(index, 1)
  alignExpressionLimits((limits) => limits.splice(index, 1))
}

const windowTypePath = 'config.window_type'
const defaultValue = getSchema(windowTypePath)?.default
const windowType = computed<WindowType>(() => get(formData, windowTypePath)!)

const WINDOW_TYPE_LABELS = {
  fixed: 'sp.window_type.options.fixed',
  sliding: 'sp.window_type.options.sliding',
} as const

const WINDOW_TYPE_DESCRIPTIONS = {
  fixed: 'sp.window_type.descriptions.fixed',
  sliding: 'sp.window_type.descriptions.sliding',
} as const

/**
 * Built from the schema's `one_of` so a Gateway that offers a different set is
 * honoured, but labelled and described from i18n — `one_of` carries only the raw
 * values. The default is listed first.
 */
const availableWindowTypes = computed(() => {
  const values = (getSchema(windowTypePath)?.one_of ?? []) as WindowType[]

  return values
    .filter((value) => value in WINDOW_TYPE_LABELS)
    .sort((a, b) => {
      return a === defaultValue ? -1 : b === defaultValue ? 1 : 0
    })
    .map((value) => ({
      value,
      label: t(WINDOW_TYPE_LABELS[value]),
      description: t(WINDOW_TYPE_DESCRIPTIONS[value]),
    }))
})

const selectedUseCase = ref<string | undefined>()

const USE_CASES: Record<string, UseCase[]> = {
  fixed: [
    {
      label: t('sp.use_cases.fixed.hourly_500.label'),
      description: t('sp.use_cases.fixed.hourly_500.description'),
      config: {
        limit: 500,
        window_size: 3600,
      },
    },
    {
      label: t('sp.use_cases.fixed.half_hourly_200.label'),
      description: t('sp.use_cases.fixed.half_hourly_200.description'),
      config: {
        limit: 200,
        window_size: 1800,
      },
    },
    {
      label: t('sp.use_cases.fixed.daily_500.label'),
      description: t('sp.use_cases.fixed.daily_500.description'),
      config: {
        limit: 500,
        window_size: 86400,
      },
    },
  ],
  sliding: [
    {
      label: t('sp.use_cases.sliding.hourly_100.label'),
      description: t('sp.use_cases.sliding.hourly_100.description'),
      config: {
        limit: 100,
        window_size: 3600,
      },
    },
    {
      label: t('sp.use_cases.sliding.half_hourly_300.label'),
      description: t('sp.use_cases.sliding.half_hourly_300.description'),
      config: {
        limit: 300,
        window_size: 1800,
      },
    },
    {
      label: t('sp.use_cases.sliding.hourly_500.label'),
      description: t('sp.use_cases.sliding.hourly_500.description'),
      config: {
        limit: 500,
        window_size: 3600,
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
  // A preset replaces every limit, so the expressions attached to the rows it
  // replaces go with them.
  const clearExpressionLimits = () => {
    if (formData.expressions) {
      formData.expressions.limit = getEmptyValue()
    }
  }

  if (useCaseKey === selectedUseCase.value) {
    nextTick(() => {
      selectedUseCase.value = undefined
    })
    formData.config!.limit = []
    formData.config!.window_size = []
    clearExpressionLimits()
    return
  }
  nextTick(() => {
    selectedUseCase.value = useCaseKey
  })
  formData.config!.limit = [useCase.config.limit]
  formData.config!.window_size = [useCase.config.window_size]
  clearExpressionLimits()
}
</script>

<style lang="scss" scoped>
.rla-form-request-limits {
  .rla-form-request-limits-content {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-50, $kui-space-50);
  }

  &-title {
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
  }

  &-subtitle {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
  }

  &-items {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-50, $kui-space-50);
  }

  &-row,
  &-inputs {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: var(--kui-space-50, $kui-space-50);
    justify-content: space-between;
  }

  &-inputs {
    flex-grow: 1;
  }

  &-remove {
    flex-shrink: 0;
  }

  // `ExpressionEditor` is spacing-neutral, so the row owns the gap to it.
  &-expression {
    margin-top: var(--kui-space-40, $kui-space-40);
  }

  :deep(.form-group) {
    margin-bottom: 0 !important;
  }

  &-examples {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: var(--kui-space-40, $kui-space-40);

    &-badges {
      display: flex;
      flex-direction: row;
      gap: var(--kui-space-40, $kui-space-40);

      :deep(.rla-form-request-limits-examples-badge) {
        cursor: pointer;
      }
    }
  }

  // Separated from the limits above, since it appends to the whole list rather
  // than acting on any one row.
  &-add {
    border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    padding-top: var(--kui-space-50, $kui-space-50);

    :deep(.k-button) {
      padding-left: 0;
      padding-right: 0;
    }
  }
}
</style>
