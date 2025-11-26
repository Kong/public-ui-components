<template>
  <div class="kong-ui-entities-vault-form">
    <EntityBaseForm
      :can-submit="isFormValid && changesExist"
      :config="config"
      :edit-id="vaultId"
      :entity-type="SupportedEntityType.Vault"
      :error-message="form.errorMessage"
      :fetch-url="fetchUrl"
      :form-fields="getPayload"
      :is-readonly="form.isReadonly"
      @cancel="cancelHandler"
      @fetch:error="fetchErrorHandler"
      @fetch:success="updateFormValues"
      @loading="loadingHandler"
      @submit="saveFormData"
    >
      <EntityFormSection
        :description="t('form.sections.config.description')"
        :title="t('form.sections.config.title')"
      >
        <div class="vault-form-provider-cards-container">
          <KSelect
            v-model="vaultProvider"
            data-testid="provider-select"
            :disabled="vaultProviderDisabled"
            dropdown-max-height="500"
            :items="providers"
            :readonly="form.isReadonly"
          >
            <template #selected-item-template="{ item }">
              <component
                :is="getProviderIcon(item!.value as VaultProviders)"
              />
              <span>{{ item?.label }}</span>
            </template>
            <template #item-template="{ item }">
              <KTooltip
                placement="top"
                :text="item.disabled ? t('form.unavailable') : ''"
              >
                <div
                  class="provider-item"
                  :data-testid="`vault-form-provider-${item.value}`"
                >
                  <component
                    :is="getProviderIcon(item.value as VaultProviders)"
                  />
                  <div class="provider-item-title-container">
                    <span class="provider-item-title">{{ item?.label }}</span>
                    <span class="provider-item-description">{{ getProviderDescription(item.value as VaultProviders) }}</span>
                  </div>
                </div>
              </KTooltip>
            </template>
          </KSelect>
        </div>

        <TransitionGroup name="appear">
          <!-- Kong Vault fields -->
          <div
            v-if="vaultProvider === VaultProviders.ENV"
            key="kong-vault-config-fields"
            class="vault-form-config-fields-container"
          >
            <KInput
              v-model.trim="configFields[VaultProviders.ENV].prefix"
              autocomplete="off"
              data-testid="vault-form-config-kong-prefix"
              :label="t('form.config.env.fields.prefix.label')"
              :label-attributes="{
                info: t('form.config.env.fields.prefix.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :placeholder="t('form.config.env.fields.prefix.placeholder')"
              :readonly="form.isReadonly"
              required
              type="text"
            />
            <KCheckbox
              v-if="config.base64FieldAvailable"
              v-model="configFields[VaultProviders.ENV].base64_decode!"
              data-testid="vault-form-config-env-base64_decode"
              :label="t('form.config.commonFields.base64_decode.label')"
              :label-attributes="{
                info: t('form.config.commonFields.base64_decode.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
            />
          </div>

          <!-- AWS fields -->
          <div
            v-if="vaultProvider === VaultProviders.AWS"
            :key="`${VaultProviders.AWS}-vault-config-fields`"
            class="vault-form-config-fields-container"
          >
            <KSelect
              v-model="configFields[VaultProviders.AWS].region"
              data-testid="vault-form-config-aws-region"
              :items="awsRegions"
              :label="t('form.config.aws.fields.region.label')"
              :label-attributes="{ info: t('form.config.aws.fields.region.tooltip') }"
              :placeholder="t('form.config.aws.fields.region.placeholder')"
              :readonly="form.isReadonly"
              required
              width="100%"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.AWS].endpoint_url"
              autocomplete="off"
              data-testid="vault-form-config-aws-endpoint_url"
              :label="t('form.config.aws.fields.endpoint_url.label')"
              :label-attributes="{
                info: t('form.config.aws.fields.endpoint_url.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
              type="text"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.AWS].assume_role_arn"
              autocomplete="off"
              data-testid="vault-form-config-aws-assume_role_arn"
              :label="t('form.config.aws.fields.assume_role_arn.label')"
              :label-attributes="{
                info: t('form.config.aws.fields.assume_role_arn.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
              type="text"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.AWS].role_session_name"
              autocomplete="off"
              data-testid="vault-form-config-aws-role_session_name"
              :label="t('form.config.aws.fields.role_session_name.label')"
              :label-attributes="{
                info: t('form.config.aws.fields.role_session_name.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
              required
              type="text"
            />
            <KInput
              v-if="config.awsStsEndpointUrlAvailable"
              v-model.trim="configFields[VaultProviders.AWS].sts_endpoint_url"
              autocomplete="off"
              data-testid="vault-form-config-aws-sts_endpoint_url"
              :label="t('form.config.aws.fields.sts_endpoint_url.label')"
              :label-attributes="{
                info: t('form.config.aws.fields.sts_endpoint_url.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
              type="text"
            />
            <KCheckbox
              v-if="config.base64FieldAvailable"
              v-model="configFields[VaultProviders.AWS].base64_decode!"
              data-testid="vault-form-config-aws-base64_decode"
              :label="t('form.config.commonFields.base64_decode.label')"
              :label-attributes="{
                info: t('form.config.commonFields.base64_decode.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
            />
          </div>

          <!-- GCP fields -->
          <div
            v-if="vaultProvider === VaultProviders.GCP"
            :key="`${VaultProviders.GCP}-vault-config-fields`"
            class="vault-form-config-fields-container"
          >
            <KInput
              v-model.trim="configFields[VaultProviders.GCP].project_id"
              autocomplete="off"
              data-testid="vault-form-config-gcp-project-id"
              :label="t('form.config.gcp.fields.project_id.label')"
              :placeholder="t('form.config.gcp.fields.project_id.placeholder')"
              :readonly="form.isReadonly"
              required
              type="text"
            >
              <template #label-tooltip>
                <i18nT
                  keypath="form.config.gcp.fields.project_id.tooltip.text"
                  scope="global"
                >
                  <template #italic-text>
                    <em>{{ t('form.config.gcp.fields.project_id.tooltip.italicText') }}</em>
                  </template>
                </i18nT>
              </template>
            </KInput>
            <KCheckbox
              v-if="config.base64FieldAvailable"
              v-model="configFields[VaultProviders.GCP].base64_decode!"
              data-testid="vault-form-config-gcp-base64_decode"
              :label="t('form.config.commonFields.base64_decode.label')"
              :label-attributes="{
                info: t('form.config.commonFields.base64_decode.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
            />
          </div>

          <!-- HashiCorp Vault fields -->
          <div
            v-if="vaultProvider === VaultProviders.HCV"
            :key="`${VaultProviders.HCV}-vault-config-fields`"
            class="vault-form-config-fields-container"
          >
            <KSelect
              v-model="configFields[VaultProviders.HCV].protocol"
              data-testid="vault-form-config-hcv-protocol"
              :items="protocols"
              :label="t('form.config.hcv.fields.protocol.label')"
              :readonly="form.isReadonly"
              required
              width="100%"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.HCV].host"
              autocomplete="off"
              data-testid="vault-form-config-hcv-host"
              :label="t('form.config.hcv.fields.host.label')"
              :readonly="form.isReadonly"
              required
              type="text"
            />
            <KInput
              v-model="configFields[VaultProviders.HCV].port"
              autocomplete="off"
              data-testid="vault-form-config-hcv-port"
              :label="t('form.config.hcv.fields.port.label')"
              min="0"
              :readonly="form.isReadonly"
              required
              type="number"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.HCV].mount"
              autocomplete="off"
              data-testid="vault-form-config-hcv-mount"
              :label="t('form.config.hcv.fields.mount.label')"
              :readonly="form.isReadonly"
              required
              type="text"
            />
            <KSelect
              v-model="configFields[VaultProviders.HCV].kv"
              data-testid="vault-form-config-hcv-kv"
              :items="kvVersions"
              :label="t('form.config.hcv.fields.kv.label')"
              :readonly="form.isReadonly"
              required
              width="100%"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.HCV].namespace"
              autocomplete="off"
              data-testid="vault-form-config-hcv-namespace"
              :label="t('form.config.hcv.fields.namespace.label')"
              :readonly="form.isReadonly"
              type="text"
            />
            <KSelect
              v-model="configFields[VaultProviders.HCV].auth_method"
              data-testid="vault-form-config-hcv-auth_method"
              :items="[
                { label: VaultAuthMethods.TOKEN, value: VaultAuthMethods.TOKEN as string },
                { label: VaultAuthMethods.K8S, value: VaultAuthMethods.K8S as string },
                ...(config.hcvAppRoleMethodAvailable ? [{ label: VaultAuthMethods.APP_ROLE, value: VaultAuthMethods.APP_ROLE as string }] : []),
                ...(config.hcvCertMethodAvailable ? [{ label: VaultAuthMethods.CERT, value: VaultAuthMethods.CERT as string }] : []),
                ...(config.hcvOauth2MethodAvailable ? [{ label: VaultAuthMethods.OAUTH2, value: VaultAuthMethods.OAUTH2 as string }] : []),
              ]"
              :label="t('form.config.hcv.fields.auth_method.label')"
              :readonly="form.isReadonly"
              required
              width="100%"
            />
            <div
              v-if="configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.TOKEN"
              class="vault-form-config-auth-method-container"
            >
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].token"
                autocomplete="off"
                data-testid="vault-form-config-hcv-token"
                :label="t('form.config.hcv.fields.token.label')"
                :readonly="form.isReadonly"
                required
                show-password-mask-toggle
                type="password"
              />
            </div>
            <div
              v-else-if="configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.K8S"
              class="vault-form-config-auth-method-container"
            >
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].kube_role"
                autocomplete="off"
                data-testid="vault-form-config-hcv-kube_role"
                :label="t('form.config.hcv.fields.kube_role.label')"
                :readonly="form.isReadonly"
                required
                type="text"
              />
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].kube_auth_path"
                autocomplete="off"
                data-testid="vault-form-config-hcv-kube_auth_path"
                :label="t('form.config.hcv.fields.kube_auth_path.label')"
                :readonly="form.isReadonly"
                type="text"
              />
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].kube_api_token_file"
                autocomplete="off"
                data-testid="vault-form-config-hcv-kube_api_token_file"
                :label="t('form.config.hcv.fields.kube_api_token_file.label')"
                :readonly="form.isReadonly"
                required
                type="text"
              />
            </div>
            <div
              v-else-if="configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.APP_ROLE"
              class="vault-form-config-auth-method-container"
            >
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].approle_auth_path"
                autocomplete="off"
                data-testid="vault-form-config-hcv-approle_auth_path"
                :label="t('form.config.hcv.fields.approle_auth_path.label')"
                :readonly="form.isReadonly"
                type="text"
              />
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].approle_role_id"
                autocomplete="off"
                data-testid="vault-form-config-hcv-approle_role_id"
                :label="t('form.config.hcv.fields.approle_role_id.label')"
                :readonly="form.isReadonly"
                required
                type="text"
              />
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].approle_secret_id"
                autocomplete="off"
                data-testid="vault-form-config-hcv-approle_secret_id"
                :label="t('form.config.hcv.fields.approle_secret_id.label')"
                :readonly="form.isReadonly"
                show-password-mask-toggle
                type="password"
              />
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].approle_secret_id_file"
                autocomplete="off"
                data-testid="vault-form-config-hcv-approle_secret_id_file"
                :label="t('form.config.hcv.fields.approle_secret_id_file.label')"
                :readonly="form.isReadonly"
                type="text"
              />
              <KCheckbox
                v-model="configFields[VaultProviders.HCV].approle_response_wrapping as boolean"
                data-testid="vault-form-config-hcv-approle_response_wrapping"
                :label="t('form.config.hcv.fields.approle_response_wrapping.label')"
              />
            </div>
            <div
              v-else-if="configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.CERT"
              class="vault-form-config-auth-method-container"
            >
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].cert_auth_role_name"
                autocomplete="off"
                data-testid="vault-form-config-hcv-cert_auth_role_name"
                :label="t('form.config.hcv.fields.cert_auth_role_name.label')"
                :readonly="form.isReadonly"
                required
              />
              <KTextArea
                v-model.trim="configFields[VaultProviders.HCV].cert_auth_cert"
                autocomplete="off"
                data-testid="vault-form-config-hcv-cert_auth_cert"
                :label="t('form.config.hcv.fields.cert_auth_cert.label')"
                :readonly="form.isReadonly"
                required
              />
              <KTextArea
                v-model.trim="configFields[VaultProviders.HCV].cert_auth_cert_key"
                autocomplete="off"
                data-testid="vault-form-config-hcv-cert_auth_cert_key"
                :label="t('form.config.hcv.fields.cert_auth_cert_key.label')"
                :readonly="form.isReadonly"
                required
              />
            </div>
            <div
              v-else-if="configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.OAUTH2"
              class="vault-form-config-auth-method-container"
            >
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].oauth2_client_id"
                autocomplete="off"
                data-testid="vault-form-config-hcv-oauth2_client_id"
                :label="t('form.config.hcv.fields.oauth2_client_id.label')"
                :readonly="form.isReadonly"
                required
              />
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].oauth2_client_secret"
                autocomplete="off"
                data-testid="vault-form-config-hcv-oauth2_client_secret"
                :label="t('form.config.hcv.fields.oauth2_client_secret.label')"
                :readonly="form.isReadonly"
                required
                show-password-mask-toggle
                type="password"
              />
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].oauth2_role_name"
                autocomplete="off"
                data-testid="vault-form-config-hcv-oauth2_role_name"
                :label="t('form.config.hcv.fields.oauth2_role_name.label')"
                :label-attributes="{
                  info: t('form.config.hcv.fields.oauth2_role_name.tooltip'),
                  tooltipAttributes: { maxWidth: '400' },
                }"
                :readonly="form.isReadonly"
                required
              />
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].oauth2_token_endpoint"
                autocomplete="off"
                data-testid="vault-form-config-hcv-oauth2_token_endpoint"
                :label="t('form.config.hcv.fields.oauth2_token_endpoint.label')"
                :readonly="form.isReadonly"
                required
              />
              <KInput
                v-model.trim="configFields[VaultProviders.HCV].oauth2_audiences"
                autocomplete="off"
                data-testid="vault-form-config-hcv-oauth2_audiences"
                :label="t('form.config.hcv.fields.oauth2_audiences.label')"
                :label-attributes="{
                  info: t('form.config.hcv.fields.oauth2_audiences.tooltip'),
                  tooltipAttributes: { maxWidth: '400' },
                }"
                :readonly="form.isReadonly"
              />
            </div>
            <KCheckbox
              v-if="config.base64FieldAvailable"
              v-model="configFields[VaultProviders.HCV].base64_decode!"
              data-testid="vault-form-config-hcv-base64_decode"
              :label="t('form.config.commonFields.base64_decode.label')"
              :label-attributes="{
                info: t('form.config.commonFields.base64_decode.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
            />
          </div>

          <!-- Azure fields -->
          <div
            v-if="vaultProvider === VaultProviders.AZURE"
            :key="`${VaultProviders.AZURE}-vault-config-fields`"
            class="vault-form-config-fields-container"
          >
            <KInput
              v-model.trim="configFields[VaultProviders.AZURE].location"
              autocomplete="off"
              data-testid="vault-form-config-azure-location"
              :label="t('form.config.azure.fields.location.label')"
              :readonly="form.isReadonly"
              required
              type="text"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.AZURE].vault_uri"
              autocomplete="off"
              data-testid="vault-form-config-azure-uri"
              :label="t('form.config.azure.fields.vault_uri.label')"
              :readonly="form.isReadonly"
              required
              type="text"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.AZURE].credentials_prefix"
              autocomplete="off"
              data-testid="vault-form-config-azure-prefix"
              :label="t('form.config.azure.fields.credential_prefix.label')"
              :readonly="form.isReadonly"
              required
              type="text"
            />
            <KSelect
              v-model="configFields[VaultProviders.AZURE].type"
              data-testid="vault-form-config-azure-type"
              :items="azureTypes"
              :label="t('form.config.azure.fields.type.label')"
              :placeholder="t('form.config.azure.fields.type.placeholder')"
              :readonly="form.isReadonly"
              required
              width="100%"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.AZURE].client_id"
              autocomplete="off"
              data-testid="vault-form-config-azure-client-id"
              :label="t('form.config.azure.fields.client_id.label')"
              :readonly="form.isReadonly"
              type="text"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.AZURE].tenant_id"
              autocomplete="off"
              data-testid="vault-form-config-azure-tenant-id"
              :label="t('form.config.azure.fields.tenant_id.label')"
              :readonly="form.isReadonly"
              type="text"
            />
            <KCheckbox
              v-if="config.base64FieldAvailable"
              v-model="configFields[VaultProviders.AZURE].base64_decode!"
              data-testid="vault-form-config-azure-base64_decode"
              :label="t('form.config.commonFields.base64_decode.label')"
              :label-attributes="{
                info: t('form.config.commonFields.base64_decode.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
            />
          </div>

          <!-- Conjur fields -->
          <div
            v-if="vaultProvider === VaultProviders.CONJUR"
            :key="`${VaultProviders.CONJUR}-vault-config-fields`"
            class="vault-form-config-fields-container"
          >
            <KInput
              v-model.trim="configFields[VaultProviders.CONJUR].endpoint_url"
              autocomplete="off"
              data-testid="vault-form-config-conjur-endpoint_url"
              :label="t('form.config.conjur.fields.endpoint_url.label')"
              :label-attributes="{
                info: t('form.config.conjur.fields.endpoint_url.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
              required
              type="text"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.CONJUR].login"
              autocomplete="off"
              data-testid="vault-form-config-conjur-login"
              :label="t('form.config.conjur.fields.login.label')"
              :label-attributes="{
                info: t('form.config.conjur.fields.login.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
              required
              type="text"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.CONJUR].account"
              autocomplete="off"
              data-testid="vault-form-config-conjur-account"
              :label="t('form.config.conjur.fields.account.label')"
              :label-attributes="{
                info: t('form.config.conjur.fields.account.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
              required
              type="text"
            />
            <KInput
              v-model.trim="configFields[VaultProviders.CONJUR].api_key"
              autocomplete="off"
              data-testid="vault-form-config-conjur-api_key"
              :label="t('form.config.conjur.fields.api_key.label')"
              :label-attributes="{
                info: t('form.config.conjur.fields.api_key.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
              required
              show-password-mask-toggle
              type="password"
            />
            <KCheckbox
              v-if="config.base64FieldAvailable"
              v-model="configFields[VaultProviders.CONJUR].base64_decode!"
              data-testid="vault-form-config-env-base64_decode"
              :label="t('form.config.commonFields.base64_decode.label')"
              :label-attributes="{
                info: t('form.config.commonFields.base64_decode.tooltip'),
                tooltipAttributes: { maxWidth: '400' },
              }"
              :readonly="form.isReadonly"
            />
          </div>

          <div v-if="config.ttl">
            <KCollapse
              v-if="isAvailableTTLConfig"
              class="advanced-fields-collapse"
              data-testid="advanced-fields-collapse"
              trigger-alignment="leading"
              :trigger-label="t('form.config.advancedFields.title')"
            >
              <div class="wrapper">
                <div class="item-50">
                  <KInput
                    v-model="configFields[vaultProvider as VaultProviders.HCV | VaultProviders.GCP | VaultProviders.AWS].ttl"
                    data-testid="vault-ttl-input"
                    :label="t('form.config.advancedFields.ttl')"
                    :label-attributes="{
                      info: t('form.config.advancedFields.ttlTooltip'),
                      tooltipAttributes: { maxWidth: '400' },
                    }"
                    type="number"
                  />
                </div>

                <div class="item-50">
                  <KInput
                    v-model="configFields[vaultProvider as VaultProviders.HCV | VaultProviders.GCP | VaultProviders.AWS].neg_ttl"
                    data-testid="vault-neg-ttl-input"
                    :label="t('form.config.advancedFields.negTtl')"
                    :label-attributes="{
                      info: t('form.config.advancedFields.negTtlTooltip'),
                      tooltipAttributes: { maxWidth: '400' },
                    }"
                    type="number"
                  />
                </div>
              </div>

              <div class="wrapper">
                <div class="item-100">
                  <KInput
                    v-model="configFields[vaultProvider as VaultProviders.HCV | VaultProviders.GCP | VaultProviders.AWS].resurrect_ttl"
                    data-testid="vault-resurrect-ttl-input"
                    :label="t('form.config.advancedFields.resurrectTtl')"
                    :label-attributes="{
                      info: t('form.config.advancedFields.resurrectTtlTooltip'),
                      tooltipAttributes: { maxWidth: '400' },
                    }"
                    type="number"
                  />
                </div>
              </div>
            </KCollapse>
          </div>
        </TransitionGroup>
      </EntityFormSection>

      <EntityFormSection
        :description="t('form.sections.general.description')"
        :title="t('form.sections.general.title')"
      >
        <KInput
          v-model.trim="form.fields.prefix"
          autocomplete="off"
          data-testid="vault-form-prefix"
          :help="t('form.fields.prefix.help')"
          :label="t('form.fields.prefix.label')"
          :label-attributes="{
            info: t('form.fields.prefix.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :placeholder="t('form.fields.prefix.placeholder')"
          :readonly="form.isReadonly"
          required
          type="text"
        />
        <KTextArea
          v-model.trim="form.fields.description"
          :character-limit="1000"
          class="vault-form-textarea"
          data-testid="vault-form-description"
          :label="t('form.fields.description.label')"
          :placeholder="t('form.fields.description.placeholder')"
          :readonly="form.isReadonly"
        />
        <KInput
          v-model.trim="form.fields.tags"
          autocomplete="off"
          data-testid="vault-form-tags"
          :help="t('form.fields.tags.help')"
          :label="t('form.fields.tags.label')"
          :placeholder="t('form.fields.tags.placeholder')"
          :readonly="form.isReadonly"
          type="text"
        />
      </EntityFormSection>
    </EntityBaseForm>
  </div>
</template>

<script lang="ts" setup>
import {
  useAxios,
  useErrors,
  useGatewayFeatureSupported,
  EntityFormSection,
  EntityBaseForm,
  EntityBaseFormType,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { PropType } from 'vue'
import { computed, reactive, ref } from 'vue'
import type {
  ConfigStoreConfig,
  KongVaultConfig,
  AWSVaultConfig,
  GCPVaultConfig,
  HCVVaultConfig,
  AzureVaultConfig,
  VaultState,
  VaultStateFields,
  KongManagerVaultFormConfig,
  KonnectVaultFormConfig,
  VaultPayload,
  ConjurVaultConfig,
} from '../types'
import {
  VaultProviders,
  VaultAuthMethods,
  type KonnectConfigStore,
} from '../types'
import { useRouter } from 'vue-router'
import type { AxiosError, AxiosResponse } from 'axios'
import endpoints from '../vaults-endpoints'
import {
  KongIcon,
  CodeIcon,
  AwsIcon,
  HashicorpIcon,
  GoogleCloudIcon,
  AzureIcon,
  ConjourIcon,
} from '@kong/icons'

interface ConfigFields {
  [VaultProviders.ENV]: KongVaultConfig
  [VaultProviders.AWS]: AWSVaultConfig
  [VaultProviders.GCP]: GCPVaultConfig
  [VaultProviders.HCV]: HCVVaultConfig
  [VaultProviders.AZURE]: AzureVaultConfig
  [VaultProviders.KONNECT]: ConfigStoreConfig
  [VaultProviders.CONJUR]: ConjurVaultConfig
}

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectVaultFormConfig | KongManagerVaultFormConfig>,
    required: true,
    validator: (config: KonnectVaultFormConfig | KongManagerVaultFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config?.app === 'konnect' && !config?.controlPlaneId) return false
      if (config?.app === 'kongManager' && typeof config?.workspace !== 'string') return false
      if (!config?.cancelRoute) return false
      return true
    },
  },
  /** If a valid vaultId is provided, it will put the form in Edit mode instead of Create */
  vaultId: {
    type: String,
    required: false,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update', data: VaultStateFields): void
  (e: 'error', error: AxiosError): void
  (e: 'loading', isLoading: boolean): void
}>()

const { i18nT, i18n: { t } } = composables.useI18n()
const router = useRouter()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const { getMessageFromError } = useErrors()

const form = reactive<VaultState>({
  fields: {
    prefix: '',
    description: '',
    tags: '',
  },
  isReadonly: false,
  errorMessage: '',
})

const originalFields = reactive<VaultStateFields>({
  prefix: '',
  description: '',
  tags: '',
})

const vaultProvider = ref<VaultProviders>(props.config.app === 'konnect' ? VaultProviders.KONNECT : VaultProviders.ENV)
const originalVaultProvider = ref<VaultProviders | null>(null)
const configStoreId = ref<string>()

const isAvailableTTLConfig = computed(() => {
  return [VaultProviders.AWS, VaultProviders.GCP, VaultProviders.HCV, VaultProviders.AZURE, VaultProviders.CONJUR].includes(vaultProvider.value)
})

const providers = computed<Array<{ label: string, value: VaultProviders }>>(() => {
  return [
    ...(
      props.config.app === 'konnect'
        ? [{
          label: t('form.config.konnect.label'),
          value: VaultProviders.KONNECT,
        }]
        : []
    ),
    {
      label: t('form.config.env.label'),
      value: VaultProviders.ENV,
    },
    {
      label: t('form.config.aws.label'),
      value: VaultProviders.AWS,
      disabled: !isOtherProvidersSupported.value,
    },
    {
      label: t('form.config.gcp.label'),
      value: VaultProviders.GCP,
      disabled: !isOtherProvidersSupported.value,
    },
    {
      label: t('form.config.hcv.label'),
      value: VaultProviders.HCV,
      disabled: !isOtherProvidersSupported.value,
    },
    ...(
      props.config.azureVaultProviderAvailable
        ? [{
          label: t('form.config.azure.label'),
          value: VaultProviders.AZURE,
          disabled: !isOtherProvidersSupported.value,
        }]
        : []
    ),
    ...(
      props.config.conjurVaultProviderAvailable
        ? [{
          label: t('form.config.conjur.label'),
          value: VaultProviders.CONJUR,
          disabled: !isOtherProvidersSupported.value,
        }]
        : []
    ),
  ]
})

const base64FieldConfig = props.config.base64FieldAvailable ? { base64_decode: false } : {}

const configFields = reactive<ConfigFields>({
  [VaultProviders.KONNECT]: {},
  [VaultProviders.ENV]: {
    prefix: '',
    ...base64FieldConfig,
  } as KongVaultConfig,
  [VaultProviders.AWS]: {
    region: '',
    endpoint_url: '',
    assume_role_arn: '',
    role_session_name: 'KongVault',
    ...base64FieldConfig,
  } as AWSVaultConfig,
  [VaultProviders.GCP]: {
    project_id: '',
    ...base64FieldConfig,
  } as GCPVaultConfig,
  [VaultProviders.HCV]: {
    protocol: 'http',
    host: '127.0.0.1',
    port: 8200,
    mount: 'secret',
    kv: 'v1',
    namespace: '',
    auth_method: VaultAuthMethods.TOKEN,
    token: '',
    kube_role: '',
    kube_auth_path: '',
    kube_api_token_file: '',
    approle_auth_path: '',
    approle_role_id: '',
    approle_secret_id: '',
    approle_secret_id_file: '',
    approle_response_wrapping: false,
    cert_auth_cert: '',
    cert_auth_cert_key: '',
    cert_auth_role_name: '',
    oauth2_client_id: '',
    oauth2_client_secret: '',
    oauth2_role_name: '',
    oauth2_token_endpoint: '',
    oauth2_audiences: '',
    ...base64FieldConfig,
  } as HCVVaultConfig,
  [VaultProviders.AZURE]: {
    location: '',
    vault_uri: '',
    type: 'secrets',
    credentials_prefix: 'AZURE',
    client_id: '',
    tenant_id: '',
    ...base64FieldConfig,
  } as AzureVaultConfig,
  [VaultProviders.CONJUR]: {
    endpoint_url: '',
    auth_method: 'api_key',
    ...base64FieldConfig,
  },
})

const originalConfigFields = reactive<ConfigFields>({
  [VaultProviders.KONNECT]: {},
  [VaultProviders.ENV]: {
    prefix: '',
    ...base64FieldConfig,
  } as KongVaultConfig,
  [VaultProviders.AWS]: {
    region: '',
    endpoint_url: '',
    assume_role_arn: '',
    role_session_name: 'KongVault',
    ...base64FieldConfig,
  } as AWSVaultConfig,
  [VaultProviders.GCP]: {
    project_id: '',
    ...base64FieldConfig,
  } as GCPVaultConfig,
  [VaultProviders.HCV]: {
    protocol: 'http',
    host: '127.0.0.1',
    port: 8200,
    mount: 'secret',
    kv: 'v1',
    namespace: '',
    auth_method: VaultAuthMethods.TOKEN,
    token: '',
    kube_role: '',
    kube_auth_path: '',
    kube_api_token_file: '',
    approle_auth_path: '',
    approle_role_id: '',
    approle_secret_id: '',
    approle_secret_id_file: '',
    approle_response_wrapping: false,
    ...base64FieldConfig,
  } as HCVVaultConfig,
  [VaultProviders.AZURE]: {
    location: '',
    vault_uri: '',
    type: 'secrets',
    credentials_prefix: 'AZURE',
    client_id: '',
    tenant_id: '',
    ...base64FieldConfig,
  } as AzureVaultConfig,
  [VaultProviders.CONJUR]: {
    endpoint_url: '',
    auth_method: 'api_key',
    ...base64FieldConfig,
  },
})

const awsRegions = [
  { label: `${t('form.config.aws.fields.region.locations.us-east-1.location')} (us-east-1)`, value: 'us-east-1' },
  { label: `${t('form.config.aws.fields.region.locations.us-east-2.location')} (us-east-2)`, value: 'us-east-2' },
  { label: `${t('form.config.aws.fields.region.locations.us-west-1.location')} (us-west-1)`, value: 'us-west-1' },
  { label: `${t('form.config.aws.fields.region.locations.us-west-2.location')} (us-west-2)`, value: 'us-west-2' },
  { label: `${t('form.config.aws.fields.region.locations.af-south-1.location')} (af-south-1)`, value: 'af-south-1' },
  { label: `${t('form.config.aws.fields.region.locations.ap-east-1.location')} (ap-east-1)`, value: 'ap-east-1' },
  { label: `${t('form.config.aws.fields.region.locations.ap-southeast-3.location')} (ap-southeast-3)`, value: 'ap-southeast-3' },
  { label: `${t('form.config.aws.fields.region.locations.ap-south-1.location')} (ap-south-1)`, value: 'ap-south-1' },
  { label: `${t('form.config.aws.fields.region.locations.ap-northeast-1.location')} (ap-northeast-1)`, value: 'ap-northeast-1' },
  { label: `${t('form.config.aws.fields.region.locations.ap-northeast-2.location')} (ap-northeast-2)`, value: 'ap-northeast-2' },
  { label: `${t('form.config.aws.fields.region.locations.ap-northeast-3.location')} (ap-northeast-3)`, value: 'ap-northeast-3' },
  { label: `${t('form.config.aws.fields.region.locations.ap-southeast-1.location')} (ap-southeast-1)`, value: 'ap-southeast-1' },
  { label: `${t('form.config.aws.fields.region.locations.ap-southeast-2.location')} (ap-southeast-2)`, value: 'ap-southeast-2' },
  { label: `${t('form.config.aws.fields.region.locations.ca-central-1.location')} (ca-central-1)`, value: 'ca-central-1' },
  { label: `${t('form.config.aws.fields.region.locations.eu-central-1.location')} (eu-central-1)`, value: 'eu-central-1' },
  { label: `${t('form.config.aws.fields.region.locations.eu-west-1.location')} (eu-west-1)`, value: 'eu-west-1' },
  { label: `${t('form.config.aws.fields.region.locations.eu-west-2.location')} (eu-west-2)`, value: 'eu-west-2' },
  { label: `${t('form.config.aws.fields.region.locations.eu-west-3.location')} (eu-west-3)`, value: 'eu-west-3' },
  { label: `${t('form.config.aws.fields.region.locations.eu-south-1.location')} (eu-south-1)`, value: 'eu-south-1' },
  { label: `${t('form.config.aws.fields.region.locations.eu-north-1.location')} (eu-north-1)`, value: 'eu-north-1' },
  { label: `${t('form.config.aws.fields.region.locations.me-south-1.location')} (me-south-1)`, value: 'me-south-1' },
  { label: `${t('form.config.aws.fields.region.locations.sa-east-1.location')} (sa-east-1)`, value: 'sa-east-1' },
  { label: `${t('form.config.aws.fields.region.locations.us-gov-east-1.location')} (us-gov-east-1)`, value: 'us-gov-east-1' },
  { label: `${t('form.config.aws.fields.region.locations.us-gov-west-1.location')} (us-gov-west-1)`, value: 'us-gov-west-1' },
]

const azureTypes = [{ label: 'secrets', value: 'secrets' }]

const protocols = [{ label: 'http', value: 'http' }, { label: 'https', value: 'https' }]

const kvVersions = [{ label: 'v1', value: 'v1' }, { label: 'v2', value: 'v2' }]

const formType = computed((): EntityBaseFormType => props.vaultId
  ? EntityBaseFormType.Edit
  : EntityBaseFormType.Create)

const fetchUrl = computed<string>(() => endpoints.form[props.config?.app]?.edit)

const vaultProviderDisabled = computed<boolean>(() => formType.value === EntityBaseFormType.Edit && props.config.app === 'kongManager')
const isOtherProvidersSupported = computed<boolean>(() => props.config.app === 'konnect' || useGatewayFeatureSupported({
  gatewayInfo: props.config.gatewayInfo,
  // vault name can only be `env` in Gateway Community Edition
  supportedRange: {
    enterprise: [],
  },
}))

const cancelHandler = (): void => {
  router.push(props.config?.cancelRoute || { name: 'vault-list' })
}

const loadingHandler = (val: boolean): void => {
  emit('loading', val)
}

const fetchErrorHandler = (err: AxiosError): void => {
  emit('error', err)
}

const getProviderIcon = (providerName: VaultProviders) => {
  switch (providerName) {
    case VaultProviders.KONNECT:
      return KongIcon
    case VaultProviders.ENV:
      return CodeIcon
    case VaultProviders.AWS:
      return AwsIcon
    case VaultProviders.GCP:
      return GoogleCloudIcon
    case VaultProviders.HCV:
      return HashicorpIcon
    case VaultProviders.AZURE:
      return AzureIcon
    case VaultProviders.CONJUR:
      return ConjourIcon
  }
}

const getProviderDescription = (providerName: VaultProviders) => {
  switch (providerName) {
    case VaultProviders.KONNECT:
      return t('form.config.konnect.description')
    case VaultProviders.ENV:
      return t('form.config.env.description')
    case VaultProviders.AWS:
      return t('form.config.aws.description')
    case VaultProviders.GCP:
      return t('form.config.gcp.description')
    case VaultProviders.HCV:
      return t('form.config.hcv.description')
    case VaultProviders.AZURE:
      return t('form.config.azure.description')
    case VaultProviders.CONJUR:
      return t('form.config.conjur.description')
  }
}

const updateFormValues = (data: Record<string, any>): void => {
  form.fields.prefix = data?.item?.prefix || data?.prefix || ''
  form.fields.description = data?.item?.description || data?.description || ''

  const tags = data?.item?.tags || data?.tags || []
  form.fields.tags = tags?.join(', ') || ''

  Object.assign(originalFields, form.fields)

  const config = data?.item?.config || data?.config || null
  if (config && (Object.keys(config).length || data?.name === VaultProviders.KONNECT)) {
    vaultProvider.value = data?.item?.name || data?.name || ''
    originalVaultProvider.value = vaultProvider.value
    configStoreId.value = data?.config?.config_store_id || undefined
    Object.assign(configFields[vaultProvider.value], config)

    Object.assign(originalConfigFields[vaultProvider.value], config)
  } else {
    form.errorMessage = 'Error loading vault config'
  }
}

// return true if the value is one of '', undefined or null
const isEmpty = (v: unknown): boolean => v === '' || v == null

/**
 * Is the form submit button enabled?
 */
const isVaultConfigValid = computed((): boolean => {
  // HashiCorp Vault fields logic
  if (vaultProvider.value === VaultProviders.HCV) {
    return !Object.keys(configFields[VaultProviders.HCV]).filter(key => {
      // namespace and ttl fields are optional fields
      if (
        [
          'namespace',
          'ttl',
          'neg_ttl',
          'resurrect_ttl',
          'kube_auth_path',
          'approle_auth_path',
          'approle_secret_id',
          'approle_secret_id_file',
          'oauth2_audiences',
        ].includes(key)
      ) {
        return false
      }
      // kube_role and kube_api_token_file are not needed if auth method is not kubernetes
      if (configFields[VaultProviders.HCV].auth_method !== VaultAuthMethods.K8S && (key === 'kube_role' || key === 'kube_api_token_file')) {
        return false
      }
      // token is not needed if auth method is not token
      if (configFields[VaultProviders.HCV].auth_method !== VaultAuthMethods.TOKEN && key === 'token') {
        return false
      }
      // approle_role_id and approle_response_wrapping don't need to be verified if auth method is not approle
      if (configFields[VaultProviders.HCV].auth_method !== VaultAuthMethods.APP_ROLE && (key === 'approle_role_id' || key === 'approle_response_wrapping')) {
        return false
      }
      if (configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.APP_ROLE && key === 'approle_response_wrapping' && typeof (configFields[vaultProvider.value] as HCVVaultConfig)[key] === 'boolean') {
        return false
      }
      if (configFields[VaultProviders.HCV].auth_method !== VaultAuthMethods.CERT && ['cert_auth_role_name', 'cert_auth_cert', 'cert_auth_cert_key'].includes(key)) {
        return false
      }
      if (configFields[VaultProviders.HCV].auth_method !== VaultAuthMethods.OAUTH2 && ['oauth2_client_id', 'oauth2_client_secret', 'oauth2_role_name', 'oauth2_token_endpoint'].includes(key)) {
        return false
      }
      return isEmpty((configFields[vaultProvider.value] as HCVVaultConfig)[key as keyof HCVVaultConfig])
    }).length
  }

  // Azure Vault fields logic
  if (vaultProvider.value === VaultProviders.AZURE) {
    return !Object.keys(configFields[VaultProviders.AZURE]).filter(key => {
      // client_id, tenant_id and ttl fields are optional
      if (['client_id', 'tenant_id', 'ttl', 'neg_ttl', 'resurrect_ttl'].includes(key)) {
        return false
      }
      return isEmpty((configFields[vaultProvider.value] as AzureVaultConfig)[key as keyof AzureVaultConfig])
    }).length
  }

  // AWS Vault fields logic
  if (vaultProvider.value === VaultProviders.AWS) {
    return !Object.keys(configFields[VaultProviders.AWS]).filter(key => {
      // sts_endpoint_url, endpoint_url, assume_role_arn and ttl fields are optional
      if (['endpoint_url', 'assume_role_arn', 'ttl', 'neg_ttl', 'resurrect_ttl', 'sts_endpoint_url'].includes(key)) {
        return false
      }
      return isEmpty((configFields[vaultProvider.value] as AWSVaultConfig)[key as keyof AWSVaultConfig])
    }).length
  }

  return !Object.keys(configFields[vaultProvider.value]).filter(key => {
    // ttl fields are optional
    if (['ttl', 'neg_ttl', 'resurrect_ttl'].includes(key)) {
      return false
    }
    return isEmpty((configFields[vaultProvider.value] as KongVaultConfig | GCPVaultConfig)[key as keyof (KongVaultConfig | GCPVaultConfig)])
  }).length
})
const isFormValid = computed((): boolean => !!form.fields.prefix && isVaultConfigValid.value)
const changesExist = computed((): boolean => (JSON.stringify(form.fields) !== JSON.stringify(originalFields)) || (vaultProvider.value !== originalVaultProvider.value || JSON.stringify(configFields[vaultProvider.value]) !== JSON.stringify(originalConfigFields[vaultProvider.value])))

/* ---------------
 * Saving
 * ---------------
 */

/**
 * Build the submit URL
 */
const submitUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app][formType.value]}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  // Always replace the id when editing
  url = url.replace(/{id}/gi, props.vaultId)

  return url
})

const getPayload = computed((): Record<string, any> => {
  const hcvConfig = {
    protocol: configFields[VaultProviders.HCV].protocol,
    host: configFields[VaultProviders.HCV].host,
    port: parseInt(configFields[VaultProviders.HCV].port.toString()),
    mount: configFields[VaultProviders.HCV].mount,
    kv: configFields[VaultProviders.HCV].kv,
    namespace: configFields[VaultProviders.HCV].namespace || null,
    auth_method: configFields[VaultProviders.HCV].auth_method,
    ...(props.config.base64FieldAvailable && { base64_decode: configFields[VaultProviders.HCV].base64_decode }),
    ...(configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.TOKEN && { token: configFields[VaultProviders.HCV].token }),
    // For Kong Admin API, when auth_method is kubernetes, token must be in the request body and its value has to be null
    ...(configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.K8S && {
      kube_role: configFields[VaultProviders.HCV].kube_role,
      kube_auth_path: configFields[VaultProviders.HCV].kube_auth_path || undefined,
      kube_api_token_file: configFields[VaultProviders.HCV].kube_api_token_file,
      token: null,
    }),
    ...(configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.APP_ROLE && {
      approle_auth_path: configFields[VaultProviders.HCV].approle_auth_path || undefined,
      approle_role_id: configFields[VaultProviders.HCV].approle_role_id,
      approle_secret_id: configFields[VaultProviders.HCV].approle_secret_id || undefined,
      approle_secret_id_file: configFields[VaultProviders.HCV].approle_secret_id_file || undefined,
      approle_response_wrapping: configFields[VaultProviders.HCV].approle_response_wrapping ?? false,
    }),
    ...(configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.CERT && {
      cert_auth_role_name: configFields[VaultProviders.HCV].cert_auth_role_name,
      cert_auth_cert: configFields[VaultProviders.HCV].cert_auth_cert,
      cert_auth_cert_key: configFields[VaultProviders.HCV].cert_auth_cert_key,
    }),
    ...(configFields[VaultProviders.HCV].auth_method === VaultAuthMethods.OAUTH2 && {
      oauth2_audiences: (configFields[VaultProviders.HCV] as HCVVaultConfig).oauth2_audiences || undefined,
      oauth2_client_id: (configFields[VaultProviders.HCV] as HCVVaultConfig).oauth2_client_id,
      oauth2_client_secret: (configFields[VaultProviders.HCV] as HCVVaultConfig).oauth2_client_secret,
      oauth2_role_name: (configFields[VaultProviders.HCV] as HCVVaultConfig).oauth2_role_name,
      oauth2_token_endpoint: (configFields[VaultProviders.HCV] as HCVVaultConfig).oauth2_token_endpoint,
    }),
  }

  const azureConfig = {
    ...configFields[vaultProvider.value],
    client_id: (configFields[vaultProvider.value] as AzureVaultConfig).client_id || null,
    tenant_id: (configFields[vaultProvider.value] as AzureVaultConfig).tenant_id || null,
  }

  const awsConfig = {
    ...configFields[vaultProvider.value],
    endpoint_url: (configFields[vaultProvider.value] as AWSVaultConfig).endpoint_url || null,
    assume_role_arn: (configFields[vaultProvider.value] as AWSVaultConfig).assume_role_arn || null,
    ...(props.config.awsStsEndpointUrlAvailable ? { sts_endpoint_url: (configFields[vaultProvider.value] as AWSVaultConfig).sts_endpoint_url || null } : {}),
  }

  let config: VaultPayload['config'] = configFields[vaultProvider.value]
  if (vaultProvider.value === VaultProviders.HCV) {
    config = hcvConfig
  } else if (vaultProvider.value === VaultProviders.AZURE) {
    config = azureConfig
  } else if (vaultProvider.value === VaultProviders.AWS) {
    config = awsConfig
  }

  let ttlFields = {}
  if (![VaultProviders.KONNECT, VaultProviders.ENV].includes(vaultProvider.value)) {
    const fields = configFields[vaultProvider.value as VaultProviders.HCV | VaultProviders.GCP | VaultProviders.AWS | VaultProviders.AZURE]
    const ttl = fields.ttl
    const negTtl = fields.neg_ttl
    const resurrectTtl = fields.resurrect_ttl
    ttlFields = {
      ttl: ttl ? parseInt(ttl.toString(), 10) : null,
      neg_ttl: negTtl ? parseInt(negTtl.toString(), 10) : null,
      resurrect_ttl: resurrectTtl ? parseInt(resurrectTtl.toString(), 10) : null,
    }
  }

  const payload: VaultPayload = {
    prefix: form.fields.prefix,
    description: form.fields.description || null,
    tags: form.fields.tags.split(',')?.map((tag: string) => String(tag || '')
      .trim())?.filter((tag: string) => tag !== ''),
    name: vaultProvider.value,
    config: {
      ...config,
      ...ttlFields,
    },
  }

  return payload
})

const payloadWithConfigStoreId = computed<Record<string, any>>(() => (
  {
    ...getPayload.value,
    config: {
      ...getPayload.value.config,
      config_store_id: configStoreId.value,
    },
  }
))

const createConfigStore = async (): Promise<string | undefined> => {
  try {
    form.isReadonly = true

    const requestUrl = `${props.config.apiBaseUrl}${endpoints.form.konnect.createConfigStore}`
      .replace(/{controlPlaneId}/gi, (props.config as KonnectVaultFormConfig)?.controlPlaneId || '')

    const response = await axiosInstance.post<KonnectConfigStore>(requestUrl)

    return response?.data.id
  } catch (error: any) {
    form.errorMessage = getMessageFromError(error)
    emit('error', error as AxiosError)
  } finally {
    form.isReadonly = false
  }
}

const saveFormData = async (): Promise<void> => {
  try {
    form.isReadonly = true

    let response: AxiosResponse | undefined

    if (formType.value === 'create') {
      if (vaultProvider.value === VaultProviders.KONNECT) {
        configStoreId.value = await createConfigStore()
        response = await axiosInstance.post(submitUrl.value, payloadWithConfigStoreId.value)
      } else {
        response = await axiosInstance.post(submitUrl.value, getPayload.value)
      }
    } else if (formType.value === 'edit') {
      if (vaultProvider.value === VaultProviders.KONNECT && !configStoreId.value) {
        configStoreId.value = await createConfigStore()
        response = await axiosInstance.put(submitUrl.value, payloadWithConfigStoreId.value)
      } else {
        response = props.config?.app === 'konnect'
          ? await axiosInstance.put(submitUrl.value, payloadWithConfigStoreId.value)
          : await axiosInstance.patch(submitUrl.value, getPayload.value)
      }
    }

    updateFormValues(response?.data)

    emit('update', response?.data)
  } catch (error: any) {
    form.errorMessage = getMessageFromError(error)
    emit('error', error as AxiosError)
  } finally {
    form.isReadonly = false
  }
}
</script>

<style lang="scss">
.appear-enter-active {
  transition: all 0.5s ease;
}

.appear-enter-from,
.appear-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>

<style lang="scss" scoped>
.kong-ui-entities-vault-form {
  width: 100%;

  .advanced-fields-collapse {
    margin-bottom: 24px;

    .wrapper {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;

      .item-50 {
        width: 50%;
      }

      .item-100 {
        width: 100%;
      }
    }
  }

  .vault-form {
    &-textarea {
      width: 100%;
    }

    &-provider-cards-container {
      .provider-item {
        display: flex;
        flex-direction: row;
        gap: $kui-space-60;

        &-title-container {
          flex: 1;
        }

        &-title {
          display: block;
          font-weight: $kui-font-weight-bold;
        }

        &-description {
          display: block;
          font-size: $kui-font-size-20;
        }
      }

      button:not(:disabled) .provider-item {
        &-title {
          color: $kui-color-text-neutral-stronger;
        }

        &-description {
          color: $kui-color-text-neutral;
        }
      }

      :deep(.k-tooltip .popover-container) {
        padding: $kui-space-30 !important;
      }
    }

    &-config-fields-container {
      > *, .vault-form-config-auth-method-container > * {
        &:not(:first-child) {
          margin-top: $kui-space-80;
        }
      }
    }
  }
}
</style>
