<template>
  <div class="kong-ui-entities-redis-configurations-form">
    <EntityBaseForm
      :action-teleport-target="actionTeleportTarget"
      :can-submit="canSubmit"
      :config="config"
      :edit-id="partialId"
      :entity-type="SupportedEntityType.Partial"
      :error-message="form.errorMessage"
      :fetch-url="fetchUrl"
      :form-fields="formField"
      :is-readonly="form.readonly"
      :slidout-top-offset="slidoutTopOffset"
      @cancel="cancelHandler"
      @code-block-tab-change="(tab) => codeBlockType = tab"
      @fetch:error="fetchErrorHandler"
      @fetch:success="updateFormValues"
      @loading="loadingHandler"
      @submit="submitHandler"
    >
      <KAlert
        v-if="linksCount > 0 && isEdit"
        appearance="warning"
        class="warning-alert"
        data-testid="redis-update-warning-alert"
      >
        <i18n-t
          keypath="form.edit_warning_modal.description"
          tag="div"
        >
          <template #pluginCount>
            <b>{{ t('form.edit_warning_modal.plugin_count', { count: linksCount }) }}</b>
          </template>
        </i18n-t>
      </KAlert>

      <!-- type section -->
      <EntityFormSection
        data-testid="redis-type-section"
        :description="t('form.sections.type.description')"
        :title="t('form.sections.type.title')"
      >
        <KSelect
          v-model="redisType"
          data-testid="redis-type-select"
          :disabled="isEdit && redisType === RedisType.HOST_PORT_CE"
          :items="typeOptions"
          :kpop-attributes="{ 'data-testid': 'redis-type-select-popover' }"
          :label="t('form.fields.type.label')"
          :readonly="form.readonly"
          required
        >
          <template #selected-item-template="{ item }">
            {{ getSelectedText(item) }}
          </template>
        </KSelect>
      </EntityFormSection>

      <!-- general section -->
      <EntityFormSection
        data-testid="redis-general-section"
        :description="t('form.sections.general.description')"
        :title="t('form.sections.general.title')"
      >
        <KInput
          v-model.trim="form.fields.name"
          data-testid="redis-name-input"
          :disabled="isEdit"
          :label="t('form.fields.name.label')"
          :placeholder="t('form.fields.name.placeholder')"
          :readonly="form.readonly"
          required
        />
        <KInput
          v-model.trim="form.fields.tags"
          data-testid="redis-tags-input"
          :help="t('form.fields.tags.help')"
          :label="t('form.fields.tags.label')"
          :label-attributes="{
            info: t('form.fields.tags.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :placeholder="t('form.fields.tags.placeholder')"
          :readonly="form.readonly"
        />
      </EntityFormSection>

      <!-- cloud auth section -->
      <EntityFormSection
        v-if="config.cloudAuthAvailable && redisType !== RedisType.SENTINEL"
        data-testid="redis-cloud-auth-section"
        :description="t('form.sections.cloud_auth.description')"
        :title="t('form.sections.cloud_auth.title')"
      >
        <KSelect
          v-model="form.fields.config.cloud_authentication!.auth_provider"
          clearable
          data-testid="redis-auth-provider-select"
          :items="cloudAuthOptions"
          :kpop-attributes="{ 'data-testid': 'redis-auth-provider-select-popover' }"
          :label="t('form.fields.cloud_authentication.auth_provider.label')"
          :label-attributes="{ info: t('form.fields.cloud_authentication.auth_provider.tooltip') }"
          :readonly="form.readonly"
        />
        <CloudAuthFields
          v-model="form.fields.config.cloud_authentication!"
          :config="props.config"
          :readonly="form.readonly"
        />
      </EntityFormSection>

      <!-- sentinel configuration section -->
      <EntityFormSection
        v-if="redisType === RedisType.SENTINEL"
        data-testid="redis-sentinel-configuration-section"
        :description="t('form.sections.sentinel_configuration.description')"
        :title="t('form.sections.sentinel_configuration.title')"
      >
        <KInput
          v-model="form.fields.config.sentinel_master"
          data-testid="redis-sentinel-master-input"
          :label="t('form.fields.sentinel_master.label')"
          :label-attributes="{
            info: t('form.fields.sentinel_master.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          required
        />
        <KSelect
          v-model="form.fields.config.sentinel_role"
          data-testid="redis-sentinel-role-select"
          :items="sentinelRoleOptions"
          :kpop-attributes="{ 'data-testid': 'redis-sentinel-role-select-popover' }"
          :label="t('form.fields.sentinel_role.label')"
          :label-attributes="{
            info: t('form.fields.sentinel_role.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          required
        />
        <SentinelNodes
          v-model="form.fields.config.sentinel_nodes"
          :readonly="form.readonly"
        />
        <KInput
          v-model.trim="form.fields.config.sentinel_username"
          :label="t('form.fields.sentinel_username.label')"
          :label-attributes="{
            info: t('form.fields.sentinel_username.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
        />
        <VaultSecretPickerProvider
          class="secret-picker-provider"
          :disabled="form.readonly"
          :update="v => form.fields.config.sentinel_username = v"
          :value="form.fields.config.sentinel_username"
          @open="(value, update) => setUpVaultSecretPicker(value, update)"
        />
        <KInput
          v-model.trim="form.fields.config.sentinel_password"
          :label="t('form.fields.sentinel_password.label')"
          :label-attributes="{
            info: t('form.fields.sentinel_password.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          show-password-mask-toggle
          type="password"
        />
        <VaultSecretPickerProvider
          class="secret-picker-provider"
          :disabled="form.readonly"
          :update="v => form.fields.config.sentinel_password = v"
          :value="form.fields.config.sentinel_password"
          @open="(value, update) => setUpVaultSecretPicker(value, update)"
        />
      </EntityFormSection>

      <!-- cluster configuration section -->
      <EntityFormSection
        v-if="redisType === RedisType.CLUSTER"
        data-testid="redis-cluster-configuration-section"
        :description="t('form.sections.cluster.description')"
        :title="t('form.sections.cluster.title')"
      >
        <ClusterNodes
          v-model="form.fields.config.cluster_nodes"
          :readonly="form.readonly"
        />
        <KInput
          v-model="form.fields.config.cluster_max_redirections"
          data-testid="redis-cluster-max-redirections-input"
          :label="t('form.fields.cluster_max_redirections.label')"
          :label-attributes="{
            info: t('form.fields.cluster_max_redirections.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          type="number"
        />
      </EntityFormSection>

      <!-- connection configuration section -->
      <EntityFormSection
        data-testid="redis-connection-configuration-section"
        :description="t('form.sections.connection.description')"
        :title="t('form.sections.connection.title')"
      >
        <KInput
          v-if="redisType === RedisType.HOST_PORT_CE || redisType === RedisType.HOST_PORT_EE"
          v-model.trim="form.fields.config.host"
          data-testid="redis-host-input"
          :label="t('form.fields.host.label')"
          :label-attributes="{
            info: t('form.fields.host.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
        />
        <KInput
          v-if="redisType === RedisType.HOST_PORT_CE || redisType === RedisType.HOST_PORT_EE"
          v-model.trim="form.fields.config.port"
          data-testid="redis-port-input"
          :label="t('form.fields.port.label')"
          :label-attributes="{
            info: t('form.fields.port.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
        />
        <VaultSecretPickerProvider
          v-if="redisType === RedisType.HOST_PORT_EE && config.isPortReferenceable"
          class="secret-picker-provider"
          data-testid="secret-picker-provider-for-port"
          :disabled="form.readonly"
          :update="v => form.fields.config.port = v"
          :value="String(form.fields.config.port ?? '')"
          @open="(value, update) => setUpVaultSecretPicker(value, update)"
        />

        <KCheckbox
          v-if="redisType === RedisType.HOST_PORT_EE"
          v-model="form.fields.config.connection_is_proxied"
          data-testid="redis-connection-is-proxied-checkbox"
          :disabled="form.readonly"
          :label="t('form.fields.connection_is_proxied.label')"
          :label-attributes="{
            info: t('form.fields.connection_is_proxied.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
        />

        <KInput
          v-if="redisType === RedisType.HOST_PORT_CE"
          v-model.trim="form.fields.config.timeout"
          data-testid="redis-timeout-input"
          :label="t('form.fields.timeout.label')"
          :label-attributes="{
            info: t('form.fields.timeout.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          type="number"
        />

        <KInput
          v-model.trim="form.fields.config.database"
          data-testid="redis-database-input"
          :label="t('form.fields.database.label')"
          :label-attributes="{
            info: t('form.fields.database.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          type="number"
        />
        <KInput
          v-model.trim="form.fields.config.username"
          data-testid="redis-username-input"
          :label="t('form.fields.username.label')"
          :label-attributes="{
            info: t('form.fields.username.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
        />
        <VaultSecretPickerProvider
          class="secret-picker-provider"
          :disabled="form.readonly"
          :update="v => form.fields.config.username = v"
          :value="form.fields.config.username"
          @open="(value, update) => setUpVaultSecretPicker(value, update)"
        />
        <KInput
          v-model.trim="form.fields.config.password"
          data-testid="redis-password-input"
          :label="t('form.fields.password.label')"
          :label-attributes="{
            info: t('form.fields.password.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          show-password-mask-toggle
          type="password"
        />
        <VaultSecretPickerProvider
          class="secret-picker-provider"
          :disabled="form.readonly"
          :update="v => form.fields.config.password = v"
          :value="form.fields.config.password"
          @open="(value, update) => setUpVaultSecretPicker(value, update)"
        />
      </EntityFormSection>

      <!-- TLS configuration section -->
      <EntityFormSection
        data-testid="redis-tls-configuration-section"
        :description="t('form.sections.tls.description')"
        :title="t('form.sections.tls.title')"
      >
        <KCheckbox
          v-model="form.fields.config.ssl"
          data-testid="redis-ssl-checkbox"
          :description="t('form.fields.ssl.description')"
          :disabled="form.readonly"
          :label="t('form.fields.ssl.label')"
          :label-attributes="{
            info: t('form.fields.ssl.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
        />
        <KCheckbox
          v-model="form.fields.config.ssl_verify"
          data-testid="redis-ssl-verify-checkbox"
          :description="t('form.fields.ssl_verify.description')"
          :disabled="form.readonly"
          :label="t('form.fields.ssl_verify.label')"
          :label-attributes="{
            info: t('form.fields.ssl_verify.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
        />
        <KInput
          v-model.trim="form.fields.config.server_name"
          :label="t('form.fields.server_name.label')"
          :label-attributes="{
            info: t('form.fields.server_name.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
        />
      </EntityFormSection>

      <!-- keepalive section -->
      <EntityFormSection
        v-if="redisType !== RedisType.HOST_PORT_CE"
        data-testid="redis-keepalive-section"
        :description="t('form.sections.keepalive.description')"
        :title="t('form.sections.keepalive.title')"
      >
        <KInput
          v-model="form.fields.config.keepalive_backlog"
          data-testid="redis-keepalive-backlog-input"
          :label="t('form.fields.keepalive_backlog.label')"
          :label-attributes="{
            info: t('form.fields.keepalive_backlog.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          type="number"
        />
        <KInput
          v-model="form.fields.config.keepalive_pool_size"
          data-testid="redis-keepalive-pool-size-input"
          :label="t('form.fields.keepalive_pool_size.label')"
          :label-attributes="{
            info: t('form.fields.keepalive_pool_size.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          type="number"
        />
      </EntityFormSection>

      <!-- read/write configuration section -->
      <EntityFormSection
        v-if="redisType !== RedisType.HOST_PORT_CE"
        data-testid="redis-read-write-configuration-section"
        :description="t('form.sections.read_write_configuration.description')"
        :title="t('form.sections.read_write_configuration.title')"
      >
        <KInput
          v-model="form.fields.config.read_timeout"
          data-testid="redis-read-timeout-input"
          :label="t('form.fields.read_timeout.label')"
          :label-attributes="{
            info: t('form.fields.read_timeout.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          type="number"
        />
        <KInput
          v-model="form.fields.config.send_timeout"
          data-testid="redis-send-timeout-input"
          :label="t('form.fields.send_timeout.label')"
          :label-attributes="{
            info: t('form.fields.send_timeout.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          type="number"
        />
        <KInput
          v-model="form.fields.config.connect_timeout"
          data-testid="redis-connect-timeout-input"
          :label="t('form.fields.connect_timeout.label')"
          :label-attributes="{
            info: t('form.fields.connect_timeout.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          type="number"
        />
      </EntityFormSection>
    </EntityBaseForm>
  </div>

  <VaultSecretPicker
    :config="props.config"
    :setup="vaultSecretPickerSetup"
    @cancel="() => vaultSecretPickerSetup = false"
    @proceed="handleVaultSecretPickerAutofill"
  />

  <KModal
    :action-button-text="t('form.edit_warning_modal.confirm')"
    data-testid="redis-update-warning-modal"
    hide-cancel-button
    max-width="640"
    :title="t('form.edit_warning_modal.title')"
    :visible="isEditWarningModalVisible"
    @cancel="isEditWarningModalVisible = false"
    @proceed="confirmEditHandler"
  >
    <i18n-t
      keypath="form.edit_warning_modal.description"
      tag="div"
    >
      <template #pluginCount>
        <b>{{ t('form.edit_warning_modal.plugin_count', { count: linksCount }) }}</b>
      </template>
    </i18n-t>
  </KModal>
</template>

<script setup lang="ts">
import '@kong-ui-public/entities-shared/dist/style.css'
import '@kong-ui-public/entities-vaults/dist/style.css'
import { EntityBaseForm, EntityFormSection, SupportedEntityType } from '@kong-ui-public/entities-shared'
import { ref, computed, onBeforeMount } from 'vue'
import { VaultSecretPicker, VaultSecretPickerProvider } from '@kong-ui-public/entities-vaults'
import { useRouter } from 'vue-router'

import { RedisType, PartialType, AuthProvider } from '../types'
import { useRedisConfigurationForm } from '../composables/useRedisConfigurationForm'
import ClusterNodes from './ClusterNodes.vue'
import composables from '../composables'
import { useVaultSecretPicker } from '../composables/useVaultSecretPicker'
import SentinelNodes from './SentinelNodes.vue'
import CloudAuthFields from './CloudAuthFields.vue'
import { useLinkedPluginsFetcher } from '../composables/useLinkedPlugins'
import { DEFAULT_REDIS_TYPE } from '../constants'
import { mapRedisTypeToPartialType } from '../helpers'

import type { PropType } from 'vue'
import type {
  KongManagerRedisConfigurationFormConfig,
  KonnectRedisConfigurationFormConfig,
  RedisConfigurationResponse,
} from '../types'
import type { AxiosError } from 'axios'
import type { SelectItem } from '@kong/kongponents'
import { omit } from 'lodash-es'

const props = defineProps({
  config: {
    type: Object as PropType<KonnectRedisConfigurationFormConfig | KongManagerRedisConfigurationFormConfig>,
    required: true,
    validator: (config: KonnectRedisConfigurationFormConfig | KongManagerRedisConfigurationFormConfig) => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config?.app === 'konnect' && !config?.controlPlaneId) return false
      if (config?.app === 'kongManager' && typeof config?.workspace !== 'string') return false
      return true
    },
  },
  /** If a valid partialId is provided, it will put the form in Edit mode instead of Create */
  partialId: {
    type: String,
    required: false,
    default: '',
  },
  /**
   * Teleport target for the actions
   */
  actionTeleportTarget: {
    type: String,
    default: null,
  },
  /**
   * Top offset for the slideout
   */
  slidoutTopOffset: {
    type: Number,
    default: 60,
  },
  /**
   * Set disabled partial type, only for create mode
   */
  disabledPartialType: {
    type: String as PropType<PartialType>,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update', data: RedisConfigurationResponse): void
  (e: 'error', error: AxiosError): void
  (e: 'loading', isLoading: boolean): void
  (e: 'cancel'): void
}>()

const { i18n: { t }, i18nT } = composables.useI18n()
const {
  vaultSecretPickerSetup,
  setUpVaultSecretPicker,
  handleVaultSecretPickerAutofill,
} = useVaultSecretPicker()
const router = useRouter()

const codeBlockType = ref<string>('json')

const typeOptions = computed<SelectItem[]>(() => {
  return [
    {
      label: t('form.options.type.host_port'),
      group: t('form.options.type.enterprise'),
      value: RedisType.HOST_PORT_EE,
      selected: redisType.value === RedisType.HOST_PORT_EE,
      disabled: !isEdit && props.disabledPartialType === PartialType.REDIS_EE,
    },
    {
      label: t('form.options.type.cluster'),
      group: t('form.options.type.enterprise'),
      value: RedisType.CLUSTER,
      selected: redisType.value === RedisType.CLUSTER,
      disabled: !isEdit && props.disabledPartialType === PartialType.REDIS_EE,
    },
    {
      label: t('form.options.type.sentinel'),
      group: t('form.options.type.enterprise'),
      value: RedisType.SENTINEL,
      selected: redisType.value === RedisType.SENTINEL,
      disabled: !isEdit && props.disabledPartialType === PartialType.REDIS_EE,
    },
    {
      label: t('form.options.type.host_port'),
      group: t('form.options.type.open_source'),
      value: RedisType.HOST_PORT_CE,
      selected: redisType.value === RedisType.HOST_PORT_CE,
      disabled: (isEdit && redisTypeIsEnterprise.value)
        || (!isEdit && props.disabledPartialType === PartialType.REDIS_CE),
    },
  ]
})

const cloudAuthOptions = computed<SelectItem[]>(() => {
  return [
    {
      label: t('form.options.auth_provider.aws'),
      value: AuthProvider.AWS,
    },
    {
      label: t('form.options.auth_provider.gcp'),
      value: AuthProvider.GCP,
    },
    {
      label: t('form.options.auth_provider.azure'),
      value: AuthProvider.AZURE,
    },
  ]
})

const sentinelRoleOptions = [
  { label: t('form.options.sentinel_role.master'), value: 'master' },
  { label: t('form.options.sentinel_role.slave'), value: 'slave' },
  { label: t('form.options.sentinel_role.any'), value: 'any' },
]

const getSelectedText = (item: any) => {
  const suffix = item.value === RedisType.HOST_PORT_CE
    ? t('form.options.type.suffix_open_source')
    : t('form.options.type.suffix_enterprise')
  return `${item.label}${suffix}`
}

const getDefaultRedisType = (): RedisType => {
  // If no disabled type, use default
  if (!props.disabledPartialType) {
    return DEFAULT_REDIS_TYPE
  }

  const defaultPartialType = mapRedisTypeToPartialType(DEFAULT_REDIS_TYPE)

  // If default type is disabled, return an alternative
  if (defaultPartialType === props.disabledPartialType) {
    return props.disabledPartialType === PartialType.REDIS_CE
      ? RedisType.HOST_PORT_EE
      : RedisType.HOST_PORT_CE
  }

  // Default type is valid
  return DEFAULT_REDIS_TYPE
}

const {
  form,
  canSubmit,
  payload,
  isEdit,
  redisType,
  redisTypeIsEnterprise,
  fetchUrl,
  submit,
  setInitialFormValues,
} = useRedisConfigurationForm({
  partialId: props.partialId,
  defaultRedisType: getDefaultRedisType(),
  config: props.config,
  cloudAuthAvailable: props.config.cloudAuthAvailable,
})

const { fetcher: fetchLinks } = useLinkedPluginsFetcher(props.config)

const isEditWarningModalVisible = ref(false)
const isReadEditWarning = ref(false)
const linksCount = ref(0)

const formField = computed(() => {
  if (codeBlockType.value === 'terraform') {
    const terraformPayload = {
      [payload.value.type.replaceAll('-', '_')]: omit(payload.value, ['type']),
    }
    return terraformPayload
  }
  return payload.value
})

const submitHandler = async () => {
  try {
    // show a warning if user is trying to modify a partial that already has linked plugins
    if (isEdit && !isReadEditWarning.value) {
      const { count } = await fetchLinks({ partialId: props.partialId })
      linksCount.value = count
      if (count > 0) {
        // show warning modal
        isEditWarningModalVisible.value = true
        return
      }
    }

    const { data } = await submit()
    emit('update', data)
  } catch (e) {
    emit('error', e as AxiosError)
  }
}

const confirmEditHandler = () => {
  isEditWarningModalVisible.value = false
  isReadEditWarning.value = true
  submitHandler()
}

const cancelHandler = (): void => {
  if (props.config.cancelRoute) {
    router.push(props.config.cancelRoute)
  }
  emit('cancel')
}

const loadingHandler = (val: boolean): void => {
  emit('loading', val)
}

const fetchErrorHandler = (err: AxiosError): void => {
  emit('error', err)
}

const updateFormValues = (data: Record<string, any>) => {
  setInitialFormValues(data as RedisConfigurationResponse)
}

onBeforeMount(async () => {
  if (isEdit) {
    const { count } = await fetchLinks({ partialId: props.partialId })
    linksCount.value = count
  }
})
</script>

<style lang="scss" scoped>
.warning-alert {
  margin-bottom: $kui-space-90;
}

.kong-ui-entities-redis-configurations-form {
  width: 100%;
}

.secret-picker-provider {
  margin-top: $kui-space-40 !important;
}
</style>
