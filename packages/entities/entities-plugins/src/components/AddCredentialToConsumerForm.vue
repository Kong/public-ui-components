<template>
  <EntityBaseForm
    align-action-button-to-left
    :can-submit="canSubmit"
    :config="config"
    :entity-type="SupportedEntityType.Other"
    :error-message="errorMessage"
    :form-fields="credentialModel"
    :is-readonly="submitting"
    no-validate
    wrapper-component="div"
    @cancel="$emit('cancel')"
    @submit="submit"
  >
    <EntityFormBlock
      :description="t('onboarding.choose_consumer.description')"
      :step="1"
      :title="t('onboarding.choose_consumer.title')"
    >
      <KSelect
        v-model="selectedConsumerId"
        data-testid="choose-consumer-select"
        enable-filtering
        :items="consumerItems"
        :label="t('onboarding.choose_consumer.select_label')"
        :loading="loading"
        :placeholder="t('onboarding.choose_consumer.select_placeholder')"
        width="100%"
        @query-change="debouncedQueryChange"
      />
    </EntityFormBlock>

    <EntityFormBlock
      :step="2"
      :title="t('onboarding.add_credential.title')"
    >
      <CredentialConfigurationForm
        :config="config"
        :credential-type="credentialType"
        @error:fetch-schema="(error) => errorMessage = getMessageFromError(error)"
        @update:loading="schemaLoading = $event"
        @update:model-value="credentialModel = $event"
      />
    </EntityFormBlock>
  </EntityBaseForm>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SelectItem } from '@kong/kongponents'
import { EntityBaseForm, EntityFormBlock, SupportedEntityType, useAxios, useDebouncedFilter, useErrors } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import CredentialConfigurationForm from './CredentialConfigurationForm.vue'
import { CREDENTIAL_METADATA } from '../definitions/metadata'
import endpoints from '../plugins-endpoints'
import { resolvePluginConfigUrl } from '../utils/resolve-url'
import type { CredentialType, KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../types'

const { i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()

const { config, credentialType } = defineProps<{
  config: KonnectPluginFormConfig | KongManagerPluginFormConfig
  credentialType: CredentialType
}>()

const emit = defineEmits<{
  cancel: []
  success: [credential: Record<string, any>]
}>()

const { axiosInstance } = useAxios(config?.axiosRequestConfig)

const {
  debouncedQueryChange,
  loading,
  results,
  loadItems,
} = useDebouncedFilter(
  config,
  endpoints.consumers[config.app],
  '',
  {
    fetchedItemsKey: 'data',
    searchKeys: ['username', 'id'],
  },
)

const consumerItems = computed((): SelectItem[] => {
  return results.value.map((record: Record<string, any>) => ({
    label: record.username || record.custom_id,
    value: record.id,
  }))
})

const selectedConsumerId = ref<string>('')
const submitting = ref(false)
const errorMessage = ref('')
const schemaLoading = ref(false)

// Set by `CredentialConfigurationForm`'s `update:model-value`.
const credentialModel = ref<Record<string, any>>({})

const canSubmit = computed((): boolean => !!selectedConsumerId.value && !schemaLoading.value && !submitting.value)

const resourceEndpoint = computed((): string => {
  const type = CREDENTIAL_METADATA[credentialType].endpoint
  return `consumers/${selectedConsumerId.value}${type}`
})

const credentialSubmitUrl = computed((): string => {
  return resolvePluginConfigUrl(config, endpoints.form[config.app].credential.create)
    .replace(/{resourceEndpoint}/gi, resourceEndpoint.value)
})

const submit = async (): Promise<void> => {
  if (!canSubmit.value) {
    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    const { data } = await axiosInstance.post(credentialSubmitUrl.value, credentialModel.value)
    emit('success', data)
  } catch (error: any) {
    errorMessage.value = getMessageFromError(error)
  } finally {
    submitting.value = false
  }
}

loadItems()
</script>

<style lang="scss" scoped>
.kong-ui-entity-base-form {
  :deep(form) {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-70, $kui-space-70);
  }

  /* Temporarily hide the "View Configuration" button, since the code it shows is not correct */
  :deep([data-testid$='-form-view-configuration']) {
    display: none;
  }
}
</style>
