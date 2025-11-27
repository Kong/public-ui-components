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
      :fields-order="redisFieldsOrder"
      :name="formRedisPath"
      :render-rules="redisRenderRules"
      reset-label-path="reset"
    />
  </KCard>
  <ObjectField
    v-else
    v-bind="props"
    :fields-order="redisFieldsOrder"
    hide-required-asterisk
    :name="formRedisPath"
    :render-rules="redisRenderRules"
  />
</template>

<script setup lang="ts">
import ObjectField from '../shared/ObjectField.vue'
import RedisConfigCard from './RedisConfigCard.vue'
import { onBeforeMount, inject, computed, ref, watch } from 'vue'
import english from '../../../locales/en.json'
import { createI18n } from '@kong-ui-public/i18n'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { useAxios, useErrors, type KongManagerBaseFormConfig, type KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { RedisPartialType, Redis, RenderRules } from './types'
import { partialEndpoints, REDIS_PARTIAL_INFO } from './const'
import { useField, useFormData } from './composables'
import { RedisConfigurationSelector } from '@kong-ui-public/entities-redis-configurations'
import '@kong-ui-public/entities-redis-configurations/dist/style.css'
import { useToaster } from '../../../composables/useToaster'

const { t } = createI18n<typeof english>('en-us', english)

// Redis configuration fields order
const redisFieldsOrder = [
  'host', 'port', 'database', 'username', 'password',
  'sentinel_master', 'sentinel_role', 'sentinel_nodes', 'sentinel_username', 'sentinel_password',
  'cluster_nodes', 'cluster_max_redirections', 'ssl', 'ssl_verify', 'server_name',
  'keepalive_backlog', 'keepalive_pool_size', 'timeout', 'read_timeout', 'send_timeout', 'connect_timeout',
  'connection_is_proxied', 'redis_proxy_type',
  'cloud_authentication',
]

const redisRenderRules: RenderRules = {
  dependencies: {
    'cloud_authentication.aws_cache_name': ['cloud_authentication.auth_provider', 'aws'],
    'cloud_authentication.aws_region': ['cloud_authentication.auth_provider', 'aws'],
    'cloud_authentication.aws_is_serverless': ['cloud_authentication.auth_provider', 'aws'],
    'cloud_authentication.aws_access_key_id': ['cloud_authentication.auth_provider', 'aws'],
    'cloud_authentication.aws_secret_access_key': ['cloud_authentication.auth_provider', 'aws'],
    'cloud_authentication.aws_assume_role_arn': ['cloud_authentication.auth_provider', 'aws'],
    'cloud_authentication.aws_role_session_name': ['cloud_authentication.auth_provider', 'aws'],

    'cloud_authentication.gcp_service_account_json': ['cloud_authentication.auth_provider', 'gcp'],

    'cloud_authentication.azure_client_id': ['cloud_authentication.auth_provider', 'azure'],
    'cloud_authentication.azure_client_secret': ['cloud_authentication.auth_provider', 'azure'],
    'cloud_authentication.azure_tenant_id': ['cloud_authentication.auth_provider', 'azure'],
  },
}


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

