<template>
  <div>
    <EntityBaseForm
      :can-submit="canSubmit"
      :config="config"
      :edit-id="partialId"
      :entity-type="SupportedEntityType.RedisConfiguration"
      :error-message="form.errorMessage"
      :fetch-url="fetchUrl"
      :form-fields="payload"
      :is-readonly="form.readonly"
      @cancel="cancelHandler"
      @fetch:error="fetchErrorHandler"
      @fetch:success="updateFormValues"
      @loading="loadingHandler"
      @submit="submitHandler"
    >
      <EntityFormSection
        :description="t('form.sections.type.description')"
        :title="t('form.sections.type.title')"
      >
        <KSelect
          :disabled="isEdit"
          :items="typeOptions"
          :label="t('form.fields.type.label')"
          :readonly="form.readonly"
          required
          @change="handleTypeChange"
        >
          <template #selected-item-template="{ item }">
            {{ getSelectedText(item) }}
          </template>
        </KSelect>
      </EntityFormSection>

      <EntityFormSection
        :description="t('form.sections.general.description')"
        :title="t('form.sections.general.title')"
      >
        <KInput
          v-model.trim="form.fields.name"
          :label="t('form.fields.name.label')"
          :placeholder="t('form.fields.name.placeholder')"
          :readonly="form.readonly"
          required
        />
      </EntityFormSection>

      <EntityFormSection
        v-if="redisType === RedisType.SENTINEL"
        :description="t('form.sections.sentinel_configuration.description')"
        :title="t('form.sections.sentinel_configuration.title')"
      >
        <KInput
          v-model="form.fields.config.sentinel_master"
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
          :items="sentinelRoleOptions"
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

      <EntityFormSection
        v-if="redisType === RedisType.CLUSTER"
        :description="t('form.sections.cluster.description')"
        :title="t('form.sections.cluster.title')"
      >
        <ClusterNodes
          v-model="form.fields.config.cluster_nodes"
          :readonly="form.readonly"
        />
        <KInput
          v-model="form.fields.config.cluster_max_redirections"
          :label="t('form.fields.cluster_max_redirections.label')"
          :label-attributes="{
            info: t('form.fields.cluster_max_redirections.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          type="number"
        />
      </EntityFormSection>

      <EntityFormSection
        :description="t('form.sections.connection.description')"
        :title="t('form.sections.connection.title')"
      >
        <KInput
          v-if="redisType === RedisType.HOST_PORT_CE || redisType === RedisType.HOST_PORT_EE"
          v-model.trim="form.fields.config.host"
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
          :label="t('form.fields.port.label')"
          :label-attributes="{
            info: t('form.fields.port.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          type="number"
        />

        <KCheckbox
          v-if="redisType === RedisType.HOST_PORT_EE"
          v-model="form.fields.config.connection_is_proxied"
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
          :label="t('form.fields.password.label')"
          :label-attributes="{
            info: t('form.fields.password.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
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

      <EntityFormSection
        :description="t('form.sections.tls.description')"
        :title="t('form.sections.tls.title')"
      >
        <KCheckbox
          v-model="form.fields.config.ssl"
          :description="t('form.fields.ssl.description')"
          :disabled="form.readonly"
          :label="t('form.fields.ssl.label')"
        />
        <KCheckbox
          v-model="form.fields.config.ssl_verify"
          :description="t('form.fields.ssl_verify.description')"
          :disabled="form.readonly"
          :label="t('form.fields.ssl_verify.label')"
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

      <EntityFormSection
        v-if="redisType !== RedisType.HOST_PORT_CE"
        :description="t('form.sections.keepalive.description')"
        :title="t('form.sections.keepalive.title')"
      >
        <KInput
          v-model="form.fields.config.keepalive_backlog"
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
          :label="t('form.fields.keepalive_pool_size.label')"
          :label-attributes="{
            info: t('form.fields.keepalive_pool_size.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="form.readonly"
          type="number"
        />
      </EntityFormSection>

      <EntityFormSection
        v-if="redisType !== RedisType.HOST_PORT_CE"
        :description="t('form.sections.read_write_configuration.description')"
        :title="t('form.sections.read_write_configuration.title')"
      >
        <KInput
          v-model="form.fields.config.read_timeout"
          :label="t('form.fields.read_timeout.label')"
          :readonly="form.readonly"
          type="number"
        />
        <KInput
          v-model="form.fields.config.send_timeout"
          :label="t('form.fields.send_timeout.label')"
          :readonly="form.readonly"
          type="number"
        />
        <KInput
          v-model="form.fields.config.connect_timeout"
          :label="t('form.fields.connect_timeout.label')"
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
</template>

<script setup lang="ts">
import '@kong-ui-public/entities-shared/dist/style.css'
import '@kong-ui-public/entities-vaults/dist/style.css'
import { EntityBaseForm, EntityFormSection, SupportedEntityType } from '@kong-ui-public/entities-shared'
import { ref, computed } from 'vue'
import { VaultSecretPicker, VaultSecretPickerProvider } from '@kong-ui-public/entities-vaults'
import { useRouter } from 'vue-router'

import { RedisType } from '../types'
import { useRedisConfigurationForm } from '../composables/useRedisConfigurationForm'
import ClusterNodes from './ClusterNodes.vue'
import composables from '../composables'
import SentinelNodes from './SentinelNodes.vue'

import type { PropType } from 'vue'
import type {
  KongManagerRedisConfigurationFormConfig,
  KonnectRedisConfigurationFormConfig,
  RedisConfigurationFormState,
  RedisConfigurationResponse,
} from '../types'
import type { AxiosError } from 'axios'
import type { SelectItem } from '@kong/kongponents/dist/types'

const props = defineProps({
  config: {
    type: Object as PropType<KonnectRedisConfigurationFormConfig | KongManagerRedisConfigurationFormConfig>,
    required: true,
    validator: (config: KonnectRedisConfigurationFormConfig | KongManagerRedisConfigurationFormConfig) => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config?.app === 'konnect' && !config?.controlPlaneId) return false
      if (config?.app === 'kongManager' && typeof config?.workspace !== 'string') return false
      if (!config?.cancelRoute) return false
      return true
    },
  },
  /** If a valid partialId is provided, it will put the form in Edit mode instead of Create */
  partialId: {
    type: String,
    required: false,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'updated', data: RedisConfigurationResponse): void
  (e: 'update', data: RedisConfigurationFormState): void,
  (e: 'error', error: AxiosError): void,
  (e: 'loading', isLoading: boolean): void,
}>()

const { i18n: { t } } = composables.useI18n()
const router = useRouter()

const vaultSecretPickerSetup = ref<string | false>()
const vaultSecretPickerAutofillAction = ref<(secretRef: string) => void | undefined>()
const setUpVaultSecretPicker = (setupValue: string, autofillAction: (secretRef: string) => void) => {
  vaultSecretPickerSetup.value = setupValue ?? ''
  vaultSecretPickerAutofillAction.value = autofillAction
}
const handleVaultSecretPickerAutofill = (secretRef: string) => {
  vaultSecretPickerAutofillAction.value?.(secretRef)
  vaultSecretPickerSetup.value = false
}

const typeOptions = computed<SelectItem[]>(() => {
  return [
    {
      label: t('form.options.type.host_port'),
      group: ` ${t('form.options.type.open_source')}`, // the space before the group name is intentional, it makes the group to be the first one
      value: RedisType.HOST_PORT_CE,
      selected: redisType.value === RedisType.HOST_PORT_CE,
    },
    {
      label: t('form.options.type.host_port'),
      group: t('form.options.type.enterprise'),
      value: RedisType.HOST_PORT_EE,
      selected: redisType.value === RedisType.HOST_PORT_EE,
    },
    {
      label: t('form.options.type.cluster'),
      group: t('form.options.type.enterprise'),
      value: RedisType.CLUSTER,
      selected: redisType.value === RedisType.CLUSTER,
    },
    {
      label: t('form.options.type.sentinel'),
      group: t('form.options.type.enterprise'),
      value: RedisType.SENTINEL,
      selected: redisType.value === RedisType.SENTINEL,
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

const handleTypeChange = (item: SelectItem | null) => {
  userSelectedRedisType.value = item!.value as RedisType
}

const {
  form,
  canSubmit,
  payload,
  isEdit,
  userSelectedRedisType,
  redisType,
  fetchUrl,
  submit,
} = useRedisConfigurationForm({
  partialId: props.partialId,
  config: props.config,
})

const submitHandler = async () => {
  try {
    const { data } = await submit()
    emit('updated', data)
  } catch (e) {
    emit('error', e as AxiosError)
  }
}

const cancelHandler = (): void => {
  router.push(props.config?.cancelRoute || { name: 'redis-configuration-list' })
}

const loadingHandler = (val: boolean): void => {
  emit('loading', val)
}

const fetchErrorHandler = (err: AxiosError): void => {
  emit('error', err)
}

const updateFormValues = (data: Record<string, any>) => {
  form.fields.config = Object.assign({}, form.fields.config, data.config)
  form.fields.config.sentinel_nodes = data.config.sentinel_nodes ?? []
  form.fields.config.cluster_nodes = data.config.cluster_nodes ?? []
  form.fields.name = data.name
  form.fields.type = data.type
}
</script>

<style lang="scss" scoped>
.secret-picker-provider {
  margin-top: $kui-space-40 !important;
}
</style>
