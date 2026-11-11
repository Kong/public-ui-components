import { computed, type Ref } from 'vue'
import { ConfigurationSchemaSection, ConfigurationSchemaType, useStringHelpers, useHelpers } from '@kong-ui-public/entities-shared'
import type { VaultConfigurationSchema } from '../types'
import useI18n from './useI18n'

// Keys masked in the displayed config. AI Gateway records are reshaped to gateway field
// names (`displayRecord`) before rendering, so gateway names cover AI Gateway too.
const SENSITIVE_KEYS = ['key', 'client_secret', 'secret_id', 'secret_access_key', 'access_key_id', 'nonce', 'token', 'approle_secret_id', 'api_key', 'aws_access_key_id', 'aws_secret_access_key', 'aws_auth_nonce', 'cert_auth_cert_key', 'oauth2_client_secret']
const SENSITIVE_MASK = '************'

export default function useVaultConfigCardPresentation(isAiGateway: Readonly<Ref<boolean>>) {
  const { i18n: { t } } = useI18n()
  const { convertKeyToTitle } = useStringHelpers()
  const { getPropValue } = useHelpers()

  const configSchema = computed<Partial<VaultConfigurationSchema>>(() => ({
    id: {},
    name: {
      label: t(isAiGateway.value ? 'labels.vault_type_ai_gateway' : 'labels.vault_type'),
    },
    updated_at: {},
    created_at: {},
    prefix: {
      order: 5,
      section: ConfigurationSchemaSection.Basic,
      label: isAiGateway.value ? t('labels.vault_name_ai_gateway') : undefined,
    },
    description: {
      order: 6,
      section: ConfigurationSchemaSection.Basic,
    },
    ...(isAiGateway.value ? {} : {
      tags: {
        order: 7,
      },
    }),
    config: {
      order: 8,
      type: ConfigurationSchemaType.Json,
    },
  }))

  const codeBlockRecordFormatter = (record: Record<string, any>) => {
    const maskedConfig = { ...record.config }
    SENSITIVE_KEYS.forEach(key => {
      if (key in maskedConfig) {
        maskedConfig[key] = SENSITIVE_MASK
      }
    })
    const masked: Record<string, any> = { ...record, config: maskedConfig }
    if (isAiGateway.value) {
      // Restore AI Gateway field names so the code view matches the actual API response.
      const result: Record<string, any> = { ...masked, type: masked.name, name: masked.prefix }
      delete result.prefix
      return result
    }
    return masked
  }

  const configItems = (config: Record<string, any>) => Object.keys(config).sort().map(key => ({
    key,
    value: SENSITIVE_KEYS.includes(key) ? SENSITIVE_MASK : getPropValue(key, config),
    label: configSchema.value[key as keyof VaultConfigurationSchema]?.label || convertKeyToTitle(key),
  }))

  return { configSchema, codeBlockRecordFormatter, configItems }
}
