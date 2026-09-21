<template>
  <div class="kong-ui-entities-create-consumer-credential-form">
    <div class="onboarding-wizard-header">
      <KStepper
        data-testid="wizard-stepper"
        :steps="stepperSteps"
      />
    </div>

    <div class="onboarding-wizard-body">
      <EntityFormBlock
        v-if="step === 1"
        :description="t('onboarding.steps.consumer.description')"
        :title="t('onboarding.steps.consumer.title')"
      >
        <div class="consumer-note">
          {{ t('onboarding.steps.consumer.note') }}
        </div>
        <KInput
          v-model.trim="consumerFields.username"
          autocomplete="off"
          data-testid="consumer-form-username"
          :label="t('onboarding.consumer_fields.username_label')"
          :placeholder="t('onboarding.consumer_fields.username_placeholder')"
          type="text"
        />
        <KInput
          v-model.trim="consumerFields.customId"
          autocomplete="off"
          data-testid="consumer-form-custom-id"
          :label="t('onboarding.consumer_fields.custom_id_label')"
          :placeholder="t('onboarding.consumer_fields.custom_id_placeholder')"
          type="text"
        />
        <KInput
          v-model.trim="consumerFields.tags"
          autocomplete="off"
          data-testid="consumer-form-tags"
          :help="t('plugins.form.fields.tags.help')"
          :label="t('plugins.form.fields.tags.label')"
          :placeholder="t('plugins.form.fields.tags.placeholder')"
          type="text"
        />
      </EntityFormBlock>

      <EntityFormBlock
        v-else
        :title="t('onboarding.steps.credential.title')"
      >
        <CredentialConfigurationForm
          :config="config"
          :credential-type="credentialType"
          @error:fetch-schema="onCredentialError"
          @update:loading="loading = $event"
          @update:model-value="credentialModel = $event"
        />
      </EntityFormBlock>

      <KAlert
        v-if="errorMessage"
        appearance="danger"
        class="onboarding-wizard-error"
        data-testid="wizard-error"
        :message="errorMessage"
      />
    </div>

    <div class="onboarding-wizard-footer">
      <KButton
        appearance="tertiary"
        data-testid="wizard-secondary-action"
        @click="onSecondaryAction"
      >
        {{ step === 1 ? t('onboarding.actions.exit_setup') : t('onboarding.actions.skip') }}
      </KButton>
      <KButton
        appearance="primary"
        data-testid="wizard-primary-action"
        :disabled="loading || (step === 1 && !isConsumerFormValid)"
        @click="step === 1 ? submitStep1() : submitStep2()"
      >
        {{ step === 1 ? t('onboarding.actions.save_and_next') : t(`onboarding.${credentialType}.credential_action`) }}
      </KButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { StepItem } from '@kong/kongponents'
import { EntityFormBlock, useAxios, useErrors } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import CredentialConfigurationForm from './CredentialConfigurationForm.vue'
import { CREDENTIAL_METADATA } from '../definitions/metadata'
import endpoints from '../plugins-endpoints'
import { resolvePluginConfigUrl } from '../utils/resolve-url'
import type { CreatedConsumer, CredentialType, KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../types'

const { i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()

const { config, credentialType } = defineProps<{
  config: KonnectPluginFormConfig | KongManagerPluginFormConfig
  credentialType: CredentialType
}>()

const emit = defineEmits<{
  cancel: []
  success: [{ consumer: CreatedConsumer, credential: Record<string, any> | null }]
}>()

const { axiosInstance } = useAxios(config?.axiosRequestConfig)

const step = ref<1 | 2>(1)
const loading = ref(false)
const errorMessage = ref('')
const consumer = ref<CreatedConsumer | null>(null)

// Set by `CredentialConfigurationForm`'s `update:model-value`.
const credentialModel = ref<Record<string, any>>({})

const consumerFields = reactive({
  username: '',
  customId: '',
  tags: '',
})

const isConsumerFormValid = computed((): boolean => !!consumerFields.username || !!consumerFields.customId)

const stepperSteps = computed((): StepItem[] => [
  { label: t('onboarding.steps.consumer.step'), state: step.value === 1 ? 'active' : 'completed' },
  { label: t('onboarding.steps.credential.step'), state: step.value === 2 ? 'active' : 'default' },
])

const consumerPayload = computed(() => ({
  username: consumerFields.username || null,
  custom_id: consumerFields.customId || null,
  tags: consumerFields.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag !== ''),
}))

const onCredentialError = (error: unknown) => {
  errorMessage.value = getMessageFromError(error)
}

const submitStep1 = async (): Promise<void> => {
  errorMessage.value = ''
  loading.value = true

  try {
    const { data } = await axiosInstance.post(resolvePluginConfigUrl(config, endpoints.consumers[config.app]), consumerPayload.value)
    consumer.value = { id: data?.id, username: data?.username, custom_id: data?.custom_id }
    step.value = 2
  } catch (error: any) {
    errorMessage.value = getMessageFromError(error)
  } finally {
    loading.value = false
  }
}

const resourceEndpoint = computed((): string => {
  const type = CREDENTIAL_METADATA[credentialType]?.endpoint || '/plugins'
  return `consumers/${consumer.value?.id}${type}`
})

const credentialSubmitUrl = computed((): string => {
  return resolvePluginConfigUrl(config, endpoints.form[config.app].credential.create)
    .replace(/{resourceEndpoint}/gi, resourceEndpoint.value)
})

const submitStep2 = async (): Promise<void> => {
  if (!consumer.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await axiosInstance.post(credentialSubmitUrl.value, credentialModel.value)
    emit('success', { consumer: consumer.value, credential: data })
  } catch (error: any) {
    errorMessage.value = getMessageFromError(error)
  } finally {
    loading.value = false
  }
}

const onSecondaryAction = () => {
  if (step.value === 1) {
    emit('cancel')
  } else if (consumer.value) {
    // consumer already exists; skipping the credential step is a partial success, not a cancel
    emit('success', { consumer: consumer.value, credential: null })
  }
}
</script>

<style lang="scss" scoped>
.kong-ui-entities-create-consumer-credential-form {
  background: var(--kui-color-background, $kui-color-background);
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  display: flex;
  flex-direction: column;

  .consumer-note {
    font-size: var(--kui-font-size-30, $kui-font-size-30);
  }

  .onboarding-wizard-header {
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    padding: var(--kui-space-70, $kui-space-70) var(--kui-space-90, $kui-space-90);
  }

  .onboarding-wizard-body {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-70, $kui-space-70);
    padding: var(--kui-space-70, $kui-space-70) var(--kui-space-90, $kui-space-90);

    :deep(.kong-ui-entity-form-block .content) {
      background: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    }
  }

  .onboarding-wizard-footer {
    border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
    justify-content: space-between;
    padding: var(--kui-space-70, $kui-space-70) var(--kui-space-90, $kui-space-90);
  }
}
</style>
