<template>
  <div class="kong-ui-entities-redis-configurations-form">
    <EntityBaseForm
      :can-submit="canSubmit"
      :config="config"
      :edit-id="partialId"
      :entity-type="SupportedEntityType.RedisConfiguration"
      :error-message="undefined"
      :fetch-url="undefined"
      :form-fields="payload"
      :is-readonly="form.readonly"
      @cancel="noop"
      @fetch:error="noop"
      @fetch:success="noop"
      @loading="noop"
      @submit="noop"
    >
      <EntityFormSection
        :description="t('form.sections.type.description')"
        :title="t('form.sections.type.title')"
      >
        <KSelect
          v-model="form.fields.mode"
          :items="typeOptions"
          :label="t('form.fields.type.label')"
          required
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
          required
        />
      </EntityFormSection>

      <EntityFormSection
        v-if="form.fields.mode === Mode.SENTINEL"
        :description="t('form.sections.sentinel_configuration.description')"
        :title="t('form.sections.sentinel_configuration.title')"
      >
        <KInput
          v-model="form.fields.sentinel_master"
          :label="t('form.fields.sentinel_master.label')"
          :label-attributes="{
            info: t('form.fields.sentinel_master.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
        />
        <KSelect
          v-model="form.fields.sentinel_role"
          :items="sentinelRoleOptions"
          :label="t('form.fields.sentinel_role.label')"
          :label-attributes="{
            info: t('form.fields.sentinel_role.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
        />
        <SentinelNodes v-model="form.fields.sentinel_nodes" />
        <KInput
          v-model.trim="form.fields.sentinel_username"
          :label="t('form.fields.sentinel_username.label')"
          :label-attributes="{
            info: t('form.fields.sentinel_username.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
        />
        <VaultSecretPickerProvider
          class="secret-picker-provider"
          :update="v => form.fields.sentinel_username = v"
          :value="form.fields.sentinel_username"
          @open="(value, update) => setUpVaultSecretPicker(value, update)"
        />
        <KInput
          v-model.trim="form.fields.sentinel_password"
          :label="t('form.fields.sentinel_password.label')"
          :label-attributes="{
            info: t('form.fields.sentinel_password.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          type="password"
        />
        <VaultSecretPickerProvider
          class="secret-picker-provider"
          :update="v => form.fields.sentinel_password = v"
          :value="form.fields.sentinel_password"
          @open="(value, update) => setUpVaultSecretPicker(value, update)"
        />
      </EntityFormSection>

      <EntityFormSection
        v-if="form.fields.mode === Mode.CLUSTER"
        :description="t('form.sections.cluster.description')"
        :title="t('form.sections.cluster.title')"
      >
        <ClusterNodes v-model="form.fields.cluster_nodes" />
        <KInput
          v-model="form.fields.cluster_max_redirections"
          :label="t('form.fields.cluster_max_redirections.label')"
          :label-attributes="{
            info: t('form.fields.cluster_max_redirections.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          type="number"
        />
      </EntityFormSection>

      <EntityFormSection
        :description="t('form.sections.connection.description')"
        :title="t('form.sections.connection.title')"
      >
        <KInput
          v-if="form.fields.mode === Mode.HOST_PORT_OPEN_SOURCE || form.fields.mode === Mode.HOST_PORT_ENTERPRISE"
          v-model.trim="form.fields.host"
          :label="t('form.fields.host.label')"
          :label-attributes="{
            info: t('form.fields.host.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          required
        />
        <KInput
          v-if="form.fields.mode === Mode.HOST_PORT_OPEN_SOURCE || form.fields.mode === Mode.HOST_PORT_ENTERPRISE"
          v-model.trim="form.fields.port"
          :label="t('form.fields.port.label')"
          :label-attributes="{
            info: t('form.fields.port.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          type="number"
        />

        <KCheckbox
          v-if="form.fields.mode === Mode.HOST_PORT_ENTERPRISE"
          v-model="form.fields.connection_is_proxied"
          :label="t('form.fields.connection_is_proxied.label')"
          :label-attributes="{
            info: t('form.fields.connection_is_proxied.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
        />

        <KInput
          v-if="form.fields.mode === Mode.HOST_PORT_OPEN_SOURCE"
          v-model.trim="form.fields.timeout"
          :label="t('form.fields.timeout.label')"
          :label-attributes="{
            info: t('form.fields.timeout.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          type="number"
        />

        <KInput
          v-model.trim="form.fields.database"
          :label="t('form.fields.database.label')"
          :label-attributes="{
            info: t('form.fields.database.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          type="number"
        />
        <KInput
          v-model.trim="form.fields.username"
          :label="t('form.fields.username.label')"
          :label-attributes="{
            info: t('form.fields.username.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
        />
        <VaultSecretPickerProvider
          class="secret-picker-provider"
          :update="v => form.fields.username = v"
          :value="form.fields.username"
          @open="(value, update) => setUpVaultSecretPicker(value, update)"
        />
        <KInput
          v-model.trim="form.fields.password"
          :label="t('form.fields.password.label')"
          :label-attributes="{
            info: t('form.fields.password.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          type="password"
        />
        <VaultSecretPickerProvider
          class="secret-picker-provider"
          :update="v => form.fields.password = v"
          :value="form.fields.password"
          @open="(value, update) => setUpVaultSecretPicker(value, update)"
        />
      </EntityFormSection>

      <EntityFormSection
        :description="t('form.sections.tls.description')"
        :title="t('form.sections.tls.title')"
      >
        <KCheckbox
          v-model="form.fields.ssl"
          :description="t('form.fields.ssl.description')"
          :label="t('form.fields.ssl.label')"
        />
        <KCheckbox
          v-model="form.fields.ssl_verify"
          :description="t('form.fields.ssl_verify.description')"
          :label="t('form.fields.ssl_verify.label')"
        />
        <KInput
          v-model.trim="form.fields.server_name"
          :label="t('form.fields.server_name.label')"
          :label-attributes="{
            info: t('form.fields.server_name.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
        />
      </EntityFormSection>

      <EntityFormSection
        v-if="form.fields.mode !== Mode.HOST_PORT_OPEN_SOURCE"
        :description="t('form.sections.keepalive.description')"
        :title="t('form.sections.keepalive.title')"
      >
        <KInput
          v-model="form.fields.keepalive_backlog"
          :label="t('form.fields.keepalive_backlog.label')"
          :label-attributes="{
            info: t('form.fields.keepalive_backlog.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          type="number"
        />
        <KInput
          v-model="form.fields.keepalive_pool_size"
          :label="t('form.fields.keepalive_pool_size.label')"
          :label-attributes="{
            info: t('form.fields.keepalive_pool_size.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          type="number"
        />
      </EntityFormSection>

      <EntityFormSection
        v-if="form.fields.mode !== Mode.HOST_PORT_OPEN_SOURCE"
        :description="t('form.sections.read_write_configuration.description')"
        :title="t('form.sections.read_write_configuration.title')"
      >
        <KInput
          v-model="form.fields.read_timeout"
          :label="t('form.fields.read_timeout.label')"
          type="number"
        />
        <KInput
          v-model="form.fields.send_timeout"
          :label="t('form.fields.send_timeout.label')"
          type="number"
        />
        <KInput
          v-model="form.fields.connect_timeout"
          :label="t('form.fields.connect_timeout.label')"
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
import { ref } from 'vue'
import {
  EntityBaseForm,
  EntityFormSection,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'
import { VaultSecretPicker, VaultSecretPickerProvider } from '@kong-ui-public/entities-vaults'
import '@kong-ui-public/entities-vaults/dist/style.css'

import composables from '../composables'
import ClusterNodes from './ClusterNodes.vue'
import SentinelNodes from './SentinelNodes.vue'
import { useRedisConfigurationForm } from '../composables/useRedisConfigurationForm'

import type { PropType } from 'vue'
import {
  Mode,
  type KonnectRedisConfigurationFormConfig,
} from '../types'

const props = defineProps({
  config: {
    type: Object as PropType<KonnectRedisConfigurationFormConfig>,
    required: true,
    validator: (config: unknown) => {
      return true
    },
  },
  partialId: {
    type: String,
    required: false,
    default: '',
  },
})

const { i18n: { t } } = composables.useI18n()

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

const typeOptions = [
  { label: t('form.options.type.host_port'), group: ` ${t('form.options.type.open_source')}`, value: Mode.HOST_PORT_OPEN_SOURCE }, // the space before the group name is intentional, it makes the group to be the first one
  { label: t('form.options.type.host_port'), group: t('form.options.type.enterprise'), value: Mode.HOST_PORT_ENTERPRISE },
  { label: t('form.options.type.cluster'), group: t('form.options.type.enterprise'), value: Mode.CLUSTER },
  { label: t('form.options.type.sentinel'), group: t('form.options.type.enterprise'), value: Mode.SENTINEL },
]

const sentinelRoleOptions = [
  { label: t('form.options.sentinel_role.master'), value: 'master' },
  { label: t('form.options.sentinel_role.slave'), value: 'slave' },
  { label: t('form.options.sentinel_role.any'), value: 'any' },
]

const noop = () => {}

const getSelectedText = (item: any) => {
  const suffix = item.value === Mode.HOST_PORT_OPEN_SOURCE
    ? t('form.options.type.suffix_open_source')
    : t('form.options.type.suffix_enterprise')
  return `${item.label}${suffix}`
}

const {
  form,
  canSubmit,
  payload,
} = useRedisConfigurationForm()
</script>

<style lang="scss" scoped>
.kong-ui-entities-redis-configurations-form {
  // Add component styles as needed
}

.secret-picker-provider {
  margin-top: $kui-space-40 !important;
}
</style>
