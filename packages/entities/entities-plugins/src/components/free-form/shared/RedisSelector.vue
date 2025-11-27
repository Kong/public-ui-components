<template>
  <KCard
    v-if="useRedisPartial"
    class="redis-config-card"
    data-testid="redis-config-card"
    :title="t('redis.title')"
  >
    <div
      class="redis-config-radio-group"
      data-testid="redis-config-radio-group"
    >
      <KRadio
        v-model="usePartial"
        card
        card-orientation="horizontal"
        data-testid="shared-redis-config-radio"
        :description="t('redis.shared_configuration.description')"
        :label="t('redis.shared_configuration.label')"
        :selected-value="true"
      >
        <KBadge appearance="success">
          {{ t('redis.shared_configuration.badge') }}
        </KBadge>
      </KRadio>
      <KRadio
        v-model="usePartial"
        card
        card-orientation="horizontal"
        data-testid="dedicated-redis-config-radio"
        :description="t('redis.dedicated_configuration.description')"
        :label="t('redis.dedicated_configuration.label')"
        :selected-value="false"
      />
    </div>

    <!-- Using `v-show` instead of `v-if` to preserve component state and avoid re-fetching options when toggling between shared and dedicated configuration -->
    <div
      v-show="usePartial"
      class="shared-redis-config"
    >
      <div class="shared-redis-config-title">
        {{ t('redis.shared_configuration.title') }}
      </div>
      <div
        class="redis-config-select"
        data-testid="redis-config-select"
      >
        <RedisConfigurationSelector
          data-testid="redis-config-select-trigger"
          :model-value="selectedRedisConfigItem"
          :redis-type="redisType"
          @error-change="err => sharedRedisConfigFetchError = err"
          @toast="toaster"
          @update:model-value="data => redisConfigSelected(data)"
        />
      </div>
      <RedisConfigCard
        v-if="selectedRedisConfig"
        :config-fields="selectedRedisConfig"
      />
      <p
        v-if="sharedRedisConfigFetchError"
        class="redis-shared-config-error-message"
        data-testid="redis-config-fetch-error"
      >
        {{
          sharedRedisConfigFetchError
            ? getMessageFromError(sharedRedisConfigFetchError)
            : t('redis.shared_configuration.error')
        }}
      </p>
    </div>
    <ObjectField
      v-if="!usePartial"
      v-bind="props"
      as-child
      :fields-order="fieldsOrder"
      :name="formRedisPath"
      reset-label-path="reset"
    />
  </KCard>
  <ObjectField
    v-else
    v-bind="props"
    :fields-order="fieldsOrder"
    hide-required-asterisk
    :name="formRedisPath"
  />
</template>

<script setup lang="ts">
import ObjectField from '../shared/ObjectField.vue'
import RedisConfigCard from './RedisConfigCard.vue'
import { onBeforeMount, inject, computed, ref, watch, onBeforeUnmount } from 'vue'
import english from '../../../locales/en.json'
import { createI18n } from '@kong-ui-public/i18n'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { useAxios, useErrors, type KongManagerBaseFormConfig, type KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { RedisPartialType, Redis } from './types'
import { partialEndpoints, fieldsOrder, REDIS_PARTIAL_INFO } from './const'
import { useField, useFormData, useFormShared } from './composables'
import { RedisConfigurationSelector } from '@kong-ui-public/entities-redis-configurations'
import '@kong-ui-public/entities-redis-configurations/dist/style.css'
import { useToaster } from '../../../composables/useToaster'
import { removeRootSymbol, resolve, toArray } from './utils'
import { get } from 'lodash-es'

const { t } = createI18n<typeof english>('en-us', english)

interface RedisSelectorProps {
  defaultRedisConfigItem?: string
  redisType?: RedisPartialType
  redisPath?: string
}

type PartialArray = Array<{ id: string, path?: string | undefined }>

const props = defineProps<RedisSelectorProps>()

const toaster = useToaster()

const redisPartialInfo = inject(REDIS_PARTIAL_INFO)
const isFormEditing = redisPartialInfo?.isEditing || false
const formRedisPath = computed(() => {
  if (props.redisPath) {
    return props.redisPath
  }
  if (redisPartialInfo?.redisPath?.value) {
    return '$.' + redisPartialInfo.redisPath.value
  }
  return '$.config.redis'
})
const redisType = props.redisType || redisPartialInfo?.redisType?.value
// controls the visibility of the redis partial selector
const useRedisPartial = computed(() => !!redisPartialInfo?.redisType?.value)
const selectedRedisConfig = ref(null)
const usePartial = ref(!isFormEditing)
const { getMessageFromError } = useErrors()

const selectedRedisConfigItem = ref<string | undefined>(props.defaultRedisConfigItem)
// cache redis partial/redis fields in edition
// so that they are reusable when the user switches between partials
const redisFieldsSaved = ref<Redis>({})
const partialsSaved = ref<PartialArray | undefined>()

// initialize getter and setter for redis partial/redis fields
const { value: partialValue } = useFormData<PartialArray | null | undefined>('$.partials')

const { value: redisFieldsValue } = useField<Redis | undefined>(formRedisPath)

const formConfig : KonnectBaseFormConfig | KongManagerBaseFormConfig = inject(FORMS_CONFIG)!

const sharedRedisConfigFetchError = ref<Error | null>(null)

/**
 * Build URL of getting one partial
 */
const getOnePartialUrl = (partialId: string | number): string => {
  let url = `${formConfig.apiBaseUrl}${partialEndpoints[formConfig.app].getOne}`

  if (formConfig.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, formConfig?.controlPlaneId || '')
  } else if (formConfig.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, formConfig?.workspace ? `/${formConfig.workspace}` : '')
  }
  // Always replace the id when editing
  url = url.replace(/{id}/gi, String(partialId))
  return url
}

const { axiosInstance } = useAxios(formConfig?.axiosRequestConfig)

/**
 * When redis partial is selected, update the form field
 */
const handleFormRedisPartialData = () => {
  if (usePartial.value) {
    // when redis partial is selected, update the form field
    if (partialsSaved.value) {
      partialValue!.value = partialsSaved.value
      selectedRedisConfigItem.value = partialsSaved.value[0].id
      // unset redis fields in the form
      redisFieldsValue!.value = undefined
    }
    // save redis Fields
    if (redisFieldsValue?.value) {
      redisFieldsSaved.value = redisFieldsValue.value
    }
  } else {
    if (Object.keys(redisFieldsSaved.value).length) {
      redisFieldsValue!.value = redisFieldsSaved.value
    }
    // save redis partial
    if (partialValue?.value) {
      partialsSaved.value = partialValue.value as PartialArray
    }
    // unset redis partial value in the form
    partialValue!.value = isFormEditing ? null : undefined
  }
}

const redisConfigSelected = async (val: string | undefined) => {
  // when selector is cleared, do nothing
  if (!val) return

  selectedRedisConfigItem.value = val
  partialValue!.value = [{ id: val }]
  partialsSaved.value = [{ id: val }]

  // unset redis fields in the form
  redisFieldsValue!.value = undefined
  // show all fields in the same level
  try {
    const configRes = await axiosInstance.get(getOnePartialUrl(val))
    if (configRes.data.config) {
      const flattenedConfigRes = Object.assign(configRes.data, configRes.data.config)
      delete flattenedConfigRes.config
      selectedRedisConfig.value = flattenedConfigRes
    }
  } catch (error) {
    console.error(error)
  }
}

watch(() => usePartial.value, () => {
  handleFormRedisPartialData()
})

onBeforeMount(() => {
  if (props.defaultRedisConfigItem || partialValue?.value) {
    const defaultRedisConfigItem = props.defaultRedisConfigItem || partialValue?.value?.[0].id
    redisConfigSelected(defaultRedisConfigItem)
    usePartial.value = true
  } else if (redisFieldsValue?.value) {
    redisFieldsSaved.value = redisFieldsValue.value
  }
})

const { createComputedRenderRules, formData } = useFormShared()
const parentPath = computed(() => removeRootSymbol(resolve(...toArray(formRedisPath.value).slice(0, -1))))
const redisRenderRulesComputed = createComputedRenderRules(parentPath.value)

// Clear partial value if dependency not met
onBeforeUnmount(() => {
  if (usePartial.value && partialValue.value && redisRenderRulesComputed.value?.dependencies?.redis) {
    const [field, value] = redisRenderRulesComputed.value.dependencies.redis
    const targetFieldPath = resolve(parentPath.value, field)
    const targetFieldValue = get(formData, removeRootSymbol(targetFieldPath))
    if (targetFieldValue !== value) {
      partialValue.value = isFormEditing ? null : undefined
    }
  }
})
</script>

<style lang="scss" scoped>
.redis-config-card {
  margin-bottom: $kui-space-60;

  :deep(.form-group:last-child) {
    margin-bottom: 0;
  }
}

.shared-redis-config-title {
  font-weight: $kui-font-weight-semibold;
  line-height: $kui-line-height-30;
  margin-bottom: $kui-space-40;
}

.redis-config-radio-group {
  box-sizing: border-box;
  display: flex;
  gap: $kui-space-40;
  margin-bottom: $kui-space-40;
}

.redis-config-select {
  margin: $kui-space-60 0;
}

.redis-shared-config-error-message {
  color: $kui-color-text-danger;
}
</style>

